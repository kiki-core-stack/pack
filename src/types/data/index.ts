export type {} from '@kikiutils/mongoose/types/data';

declare global {
    type ApiResponseData<D extends object | undefined = undefined, E extends string | undefined = undefined> =
        & (D extends object ? { data: D } : { data?: undefined })
        & (E extends string ? { errorCode: E } : { errorCode?: undefined })
        & {
            message?: string;
            success: boolean;
        };

    interface TableRowData {
        id: string;
    }
}
