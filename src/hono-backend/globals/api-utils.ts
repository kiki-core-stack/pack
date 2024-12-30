import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

declare global {
    const createAPISuccessResponseData: {
        <D extends object>(data?: D, message?: string): APIResponseData<D>;
        <D extends object>(message?: string, data?: D): APIResponseData<D>;
    };

    const throwAPIError: {
        <D extends object>(statusCode?: ContentfulStatusCode, data?: D, message?: string): never;
        <D extends object>(statusCode?: ContentfulStatusCode, message?: string, data?: D): never;
    };
}

setReadonlyConstantToGlobalThis<typeof createAPISuccessResponseData>('createAPISuccessResponseData', (arg1, arg2) => {
    if (typeof arg1 === 'string') {
        const message = arg1;
        arg1 = arg2;
        arg2 = message;
    }

    return {
        data: arg1,
        message: arg2 ?? '成功',
        success: true,
    };
});

setReadonlyConstantToGlobalThis<typeof throwAPIError>('throwAPIError', (statusCode, arg1: any, arg2: any) => {
    throw new APIError(statusCode, arg1, arg2);
});
