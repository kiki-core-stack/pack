export type {} from '@kikiutils/mongoose/types/data';

declare global {
	interface ApiResponseData<D extends object = {}> {
		data?: D;
		message?: string;
		success: boolean;
	}

	interface TableRowData {
		id: string;
	}
}
