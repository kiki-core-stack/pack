export type {} from '@kikiutils/mongoose/types/data';

declare global {
    type TwoFactorAuthenticationCodesData = PartialRecord<`${TwoFactorAuthenticationMethod}Code`, string>;

    interface ApiResponseData<D extends object = object> {
        data?: D & { requiredTwoFactorAuthentications?: TwoFactorAuthenticationStatus };
        message?: string;
        success: boolean;
    }

    interface TableRowData {
        id: string;
    }
}
