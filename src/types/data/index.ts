import type { AdminData } from './admin';

export type {} from '@kikiutils/mongoose/types/data';

type EffectiveObjectIdFields<
    T,
    O extends keyof T,
> = Extract<keyof T, keyof WithAdminAuditData> extends never
    ? O
    : Extract<keyof WithAdminAuditData | O, keyof T>;

declare global {
    type SmartDataToBaseMongooseDocType<
        T,
        ObjectIdFields extends Exclude<keyof T, keyof WithAdminAuditData> = never,
        DateFields extends Exclude<keyof T, EffectiveObjectIdFields<T, ObjectIdFields>> = never,
        CreatedAtField extends boolean = true,
        UpdatedAtField extends boolean = true,
    > = DataToBaseMongooseDocType<
        T,
        EffectiveObjectIdFields<T, ObjectIdFields>,
        DateFields,
        CreatedAtField,
        UpdatedAtField
    >;

    interface ApiResponseData<D extends object | undefined = undefined, E extends string | undefined = undefined> {
        data?: D;
        errorCode?: E;
        message?: string;
        success: boolean;
    }

    interface TableRowData {
        id: string;
    }

    interface WithAdminAuditData {
        createdByAdmin: Partial<AdminData>;
        editedByAdmin?: Partial<AdminData>;
    }
}
