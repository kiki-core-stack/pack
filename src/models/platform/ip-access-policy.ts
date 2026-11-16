import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import type { Types } from 'mongoose';
import { Schema } from 'mongoose';
import type { SetFieldType } from 'type-fest';

import {
    PlatformIpAccessPolicyMode,
    PlatformIpAccessPolicyScope,
} from '../../constants/platform';
import * as mongooseRefSchemas from '../../schemas/mongoose/refs';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { PlatformIpAccessPolicyData } from '../../types/data/platform';
import { AdminModel } from '../admin';

export type PlatformIpAccessPolicy = SmartDataToBaseMongooseDocType<
    SetFieldType<
        PlatformIpAccessPolicyData,
        'targets',
        Array<SetFieldType<PlatformIpAccessPolicyData['targets'][number], 'principalIds', null | Types.ObjectId[]>>
    >
>;

export type PlatformIpAccessPolicyDocument = MongooseHydratedDocument<PlatformIpAccessPolicy>;
type PlatformIpAccessPolicyModel = BaseMongoosePaginateModel<PlatformIpAccessPolicy>;

// 可指定帳號的入口與其帳號 model；未列出的入口只能設定整個入口的規則。
const platformIpAccessPolicyScopeToPrincipalModelNameMap: Partial<Record<PlatformIpAccessPolicyScope, string>> = {
    [PlatformIpAccessPolicyScope.AdminManagement]: AdminModel.modelName,

    // Downstream projects scopes
};

const schema = new Schema<PlatformIpAccessPolicy, PlatformIpAccessPolicyModel>({
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    enabled: s.boolean().default(false).required,
    ipEntries: {
        required: true,
        type: [s.string().trim.required],
    },
    mode: s.number().enum(getEnumNumberValues(PlatformIpAccessPolicyMode)).required,
    name: s.string().maxlength(64).trim.required,
    note: s.string().trim.nonRequired,
    targets: {
        required: true,
        type: [
            {
                principalIds: {
                    default: null,
                    ref(this: PlatformIpAccessPolicy['targets'][number]) {
                        if (!this.principalIds?.length) return;
                        const modelName = this.scope === null
                            ? undefined
                            : platformIpAccessPolicyScopeToPrincipalModelNameMap[this.scope];

                        if (!modelName) throw new Error(`IP access policy scope ${this.scope} has no principal model`);
                        return modelName;
                    },
                    type: [s.objectId().required],
                },
                scope: s
                    .number()
                    .enum([
                        ...getEnumNumberValues(PlatformIpAccessPolicyScope),
                        null,
                    ])
                    .default(null)
                    .nonRequired,
            },
        ],
    },
});

export const PlatformIpAccessPolicyModel = buildMongooseModel<PlatformIpAccessPolicy, PlatformIpAccessPolicyModel>(
    'platform.ip_access_policies',
    'PlatformIpAccessPolicy',
    schema,
);
