import { mapValues } from 'lodash-es';

export const statusCodeToResponseMessageMap = Object.freeze<Record<number, string>>({
	200: '成功',
	400: '資料格式錯誤或是非法操作！',
	401: '尚未登入！',
	403: '沒有權限！',
	404: '找不到資料！',
	409: '欄位值重複或是該資料使用中！',
	413: '檔案大小超出限制！',
	500: '系統錯誤！',
	503: '系統維護中！',
	504: '超時！'
});

export const statusCodeToApiResponseTextMap = Object.freeze<Record<number, string>>(mapValues(statusCodeToResponseMessageMap, (message, code) => JSON.stringify({ data: {}, message, success: +code < 400 })));
