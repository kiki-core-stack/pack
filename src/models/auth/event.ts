import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import {
    AuthEventType,
    authFactors,
} from '../../constants/auth';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { AuthEventData } from '../../types/data/auth';

export type AuthEvent = SmartDataToBaseMongooseDocType<AuthEventData, 'actorPrincipalId' | 'principalId'>;
export type AuthEventDocument = MongooseHydratedDocument<AuthEvent>;
type AuthEventModel = BaseMongoosePaginateModel<AuthEvent>;

const schema = new Schema<AuthEvent, AuthEventModel>(
    {
        actorPrincipalId: s.objectId().required,
        actorRealm: s.string().trim.required,
        factor: s.string().enum(authFactors).nonRequired,
        ip: s.string().trim.nonRequired,
        metadata: s.mixed().nonRequired,
        principalId: s.objectId().required,
        realm: s.string().trim.required,
        sessionId: s.string().trim.nonRequired,
        type: s.number().enum(getEnumNumberValues(AuthEventType)).required,
        userAgent: s.string().trim.nonRequired,
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    },
);

schema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 });

export const AuthEventModel = buildMongooseModel<AuthEvent, AuthEventModel>('auth.events', 'AuthEvent', schema);
