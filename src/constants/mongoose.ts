import { ref } from '@kikiutils/mongoose/schema-builders';

export { mongooseConnections } from '@kikiutils/mongoose/constants';

export const mongooseRefSchemas = {
    admin: {
        nonRequired: ref('Admin').nonRequired,
        required: ref('Admin').required,
    },
};

export const schemaTimestampsConfigOnlyCreatedAt = {
    createdAt: true,
    updatedAt: false,
} as const;
