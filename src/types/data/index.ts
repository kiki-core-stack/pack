export type {} from '@kikiutils/mongoose/types/data';

declare global {
    interface ApiResponseData<D extends object | undefined = undefined, E extends string | undefined = undefined> {
        data?: D;
        errorCode?: E;
        message?: string;
        success: boolean;
    }

    interface TableRowData {
        id: string;
    }
}
