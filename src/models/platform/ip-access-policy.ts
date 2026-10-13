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

import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import {
    PlatformIpAccessPolicyMode,
    PlatformIpAccessPolicyScope,
} from '../../constants/platform';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { PlatformIpAccessPolicyData } from '../../types/data/platform';
import { AdminModel } from '../admin';

export type PlatformIpAccessPolicy = SmartDataToBaseMongooseDocType<
    SetFieldType<
        PlatformIpAccessPolicyData,
        'targets',
        SetFieldType<PlatformIpAccessPolicyData['targets'][number], 'principalIds', null | Types.ObjectId[]>[]
    >
>;

export type PlatformIpAccessPolicyDocument = MongooseHydratedDocument<PlatformIpAccessPolicy>;
type PlatformIpAccessPolicyModel = BaseMongoosePaginateModel<PlatformIpAccessPolicy>;

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
                        switch (this.principalType) {
                            case 'admin': return AdminModel.modelName;
                            default: throw new Error(`Unknown principal type: ${this.principalType}`);
                        }
                    },
                    type: [s.objectId().required],
                },
                principalType: s.string().trim.default(null).nonRequired,
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
