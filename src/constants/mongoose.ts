import { refSchemaBuilder } from '@kikiutils/mongoose/schema-builders';

export { mongooseConnections } from '@kikiutils/mongoose/constants';

export const mongooseRefSchemas = {
    admin: {
        nonRequired: refSchemaBuilder('Admin').nonRequired,
        permission: { required: refSchemaBuilder('AdminPermission').required },
        required: refSchemaBuilder('Admin').required,
    },
};
