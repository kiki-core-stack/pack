import type { Buffer } from 'node:buffer';

import { capitalize } from 'es-toolkit';
import type {
    Schema,
    UpdateQuery,
    UpdateWithAggregationPipeline,
} from 'mongoose';

import {
    hashPasswordWithArgon2,
    verifyPasswordWithArgon2,
} from './password-argon2';

export function registerMongooseSchemaArgon2HashFieldHandlers(schema: Schema<any, any>, fields: string[]) {
    fields.forEach((field) => {
        async function processUpdate(update: UpdateQuery<any> | UpdateWithAggregationPipeline) {
            if (Array.isArray(update)) {
                await Promise.all(
                    update.map(async (stage) => {
                        if (('$set' in stage) && stage.$set[field] !== undefined) {
                            stage.$set[field] = await hashPasswordWithArgon2(stage.$set[field] as string);
                        }
                    }),
                );
            } else {
                const value = update[field] ?? update.$set?.[field];
                if (value !== undefined) {
                    const hashedValue = await hashPasswordWithArgon2(value as string);
                    if (update[field] !== undefined) update[field] = hashedValue;
                    else update.$set![field] = hashedValue;
                }
            }
        }

        // findOneAndUpdate
        schema.pre('findOneAndUpdate', async function () {
            const update = this.getUpdate();
            if (update) await processUpdate(update);
        });

        // save
        schema.pre('save', async function () {
            if (this.isModified(field) && this[field] !== undefined) {
                this[field] = await hashPasswordWithArgon2(this[field] as string);
            }
        });

        // updateMany
        schema.pre('updateMany', async function () {
            const update = this.getUpdate();
            if (update) await processUpdate(update);
        });

        // updateOne
        schema.pre('updateOne', async function () {
            const update = this.getUpdate();
            if (update) await processUpdate(update);
        });

        // Verify document method
        schema.method(`verify${capitalize(field)}`, function (value: string, options?: { secret: Buffer }) {
            return verifyPasswordWithArgon2(this[field] as string, value, options);
        });
    });
}
