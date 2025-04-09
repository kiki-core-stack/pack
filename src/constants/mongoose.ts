import * as s from '@kikiutils/mongoose/schema-builders';

export { mongooseConnections } from '@kikiutils/mongoose/constants';

export const mongooseRefSchemas = {
    admin: {
        group: {
            nonRequired: s.ref('AdminGroup').nonRequired,
            required: s.ref('AdminGroup').required,
        },
        nonRequired: s.ref('Admin').nonRequired,
        permission: { required: s.ref('AdminPermission').required },
        required: s.ref('Admin').required,
    },
};

export const schemaTimestampsConfigOnlyCreatedAt = Object.freeze({
    createdAt: true,
    updatedAt: false,
});
