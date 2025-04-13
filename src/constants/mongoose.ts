import { ref } from '@kikiutils/mongoose/schema-builders';

export { mongooseConnections } from '@kikiutils/mongoose/constants';

export const mongooseRefSchemas = {
    admin: {
        group: {
            nonRequired: ref('AdminGroup').nonRequired,
            required: ref('AdminGroup').required,
        },
        nonRequired: ref('Admin').nonRequired,
        permission: { required: ref('AdminPermission').required },
        required: ref('Admin').required,
    },
};

export const schemaTimestampsConfigOnlyCreatedAt = {
    createdAt: true,
    updatedAt: false,
} as const;
