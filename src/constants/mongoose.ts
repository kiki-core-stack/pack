import { refSchemaBuilder } from '@kikiutils/mongoose/schema-builders';

export { mongooseConnections } from '@kikiutils/mongoose/constants';

export const mongooseRefSchemas = {
    admin: {
        group: {
            nonRequired: refSchemaBuilder('AdminGroup').nonRequired,
            required: refSchemaBuilder('AdminGroup').required,
        },
        nonRequired: refSchemaBuilder('Admin').nonRequired,
        permission: { required: refSchemaBuilder('AdminPermission').required },
        required: refSchemaBuilder('Admin').required,
    },
};

export const schemaTimestampsConfigOnlyCreatedAt = Object.freeze({
    createdAt: true,
    updatedAt: false,
});
