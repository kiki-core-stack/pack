import {
    isPlainObject,
    upperFirst,
} from 'es-toolkit';
import type {
    AnyBulkWriteOperation,
    Document,
    Model,
    Query,
    Schema,
} from 'mongoose';
import {
    objectEntries,
    objectHasOwn,
    objectValues,
} from 'ts-extras';
import type { UnknownRecord } from 'type-fest';

import { logger } from './_internals/logger';
import {
    hashPasswordWithArgon2,
    isArgon2PasswordHashOutdated,
    verifyPasswordWithArgon2,
} from './password-argon2';

// Constants

/**
 * 允許涉及雜湊欄位的更新運算子；$set、$setOnInsert 會被雜湊，$unset 只移除欄位。
 */
const allowedUpdateOperators = new Set([
    '$set',
    '$setOnInsert',
    '$unset',
]);

// Functions

/**
 * 寫入時以 argon2id 雜湊指定的頂層欄位，並為每個欄位產生 `verify<Field>` 文件方法。
 *
 * 處理 save、insertMany、update 類（頂層欄位、$set、$setOnInsert）與 replace 類操作；
 * 無法安全雜湊的寫入（aggregation pipeline 更新、bulkWrite、其他更新運算子）只要涉及這些欄位就拋錯，避免明文寫入。
 * 欄位值必須是字串，undefined 視為未設定。
 *
 * `verify<Field>` 在欄位未被查詢時拋錯；比對成功且雜湊參數過時時，會以新參數重新雜湊並寫回（失敗只記錄錯誤）。
 */
export function registerMongooseSchemaArgon2HashFieldHandlers(schema: Schema<any, any>, fields: string[]) {
    // Functions
    function hasAnyField(value: unknown) {
        return isPlainObject(value) && fields.some((field) => objectHasOwn(value, field));
    }

    async function hashFields(target: unknown) {
        if (!isPlainObject(target)) return;
        for (const field of fields) {
            if (target[field] !== undefined) target[field] = await hashFieldValue(field, target[field]);
        }
    }

    async function hashFieldValue(field: string, value: unknown) {
        if (typeof value !== 'string') throw new TypeError(`Argon2 hash field ${field} must be a string`);
        return await hashPasswordWithArgon2(value);
    }

    // Register middlewares
    schema.pre(
        'save',
        async function () {
            for (const field of fields) {
                const value = this.get(field);
                if (this.isModified(field) && value !== undefined) this.set(field, await hashFieldValue(field, value));
            }
        },
    );

    schema.pre(
        'insertMany',
        async (docs: unknown[]) => {
            for (const doc of docs) await hashFields(doc);
        },
    );

    schema.pre(
        [
            'findOneAndUpdate',
            'updateMany',
            'updateOne',
        ],
        async function (this: Query<unknown, unknown>) {
            const update = this.getUpdate();
            if (!update) return;
            if (Array.isArray(update)) {
                for (const stage of update) {
                    for (const [operator, spec] of objectEntries(stage)) {
                        if (operator === '$replaceRoot' || operator === '$replaceWith' || hasAnyField(spec)) {
                            throw new Error(`Aggregation pipeline updates cannot write Argon2 hash fields: ${fields.join(', ')}`);
                        }
                    }
                }

                return;
            }

            for (const [key, value] of objectEntries(update)) {
                if (!key.startsWith('$') || allowedUpdateOperators.has(key)) continue;
                // $rename 的目標欄位在值而不是 key。
                const writesField = key === '$rename'
                    ? isPlainObject(value) && objectValues(value).some((target) => fields.includes(target))
                    : hasAnyField(value);

                if (writesField) throw new Error(`Update operator ${key} cannot write Argon2 hash fields: ${fields.join(', ')}`);
            }

            await hashFields(update);
            await hashFields(update.$set);
            await hashFields(update.$setOnInsert);
        },
    );

    schema.pre(
        [
            'findOneAndReplace',
            'replaceOne',
        ],
        async function (this: Query<unknown, unknown>) {
            await hashFields(this.getUpdate());
        },
    );

    schema.pre(
        'bulkWrite',
        (operations: AnyBulkWriteOperation[]) => {
            for (const operation of operations) {
                const [operationData] = objectValues(operation) as UnknownRecord[];
                const writes = [
                    operationData?.document,
                    operationData?.replacement,
                    ...[operationData?.update].flat(),
                ];

                const touchesField = writes.some(
                    (write) => hasAnyField(write) || (isPlainObject(write) && objectValues(write).some(hasAnyField)),
                );

                if (touchesField) throw new Error(`bulkWrite cannot write Argon2 hash fields: ${fields.join(', ')}`);
            }
        },
    );

    // Register methods
    for (const field of fields) {
        schema.method(
            `verify${upperFirst(field)}`,
            async function (this: Document, input: string) {
                const hashed = this.get(field);
                if (typeof hashed !== 'string') throw new TypeError(`Argon2 hash field ${field} is not selected`);
                if (!await verifyPasswordWithArgon2(hashed, input)) return false;
                if (isArgon2PasswordHashOutdated(hashed)) {
                    // Only while the stored hash is still the verified one: a rehash finishing after a concurrent
                    // change of the field must not write the old value back.
                    await (this.constructor as Model<unknown>).updateOne(
                        {
                            _id: this._id,
                            [field]: hashed,
                        },
                        { $set: { [field]: input } },
                    ).catch((error) => {
                        logger.error(
                            'Failed to rehash outdated Argon2 hash field',
                            {
                                error,
                                field,
                            },
                        );
                    });
                }

                return true;
            },
        );
    }
}
