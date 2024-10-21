import type { StatusCode } from 'hono/utils/http-status';
import { mapValues } from 'lodash-es';

export const statusCodeToResponseMessageMap = Object.freeze<PartialRecord<StatusCode, string>>({
	200: '成功',
	400: '資料格式錯誤或是非法操作！',
	401: '尚未登入！',
	403: '沒有權限！',
	404: '找不到資料！',
	409: '欄位值重複或是該資料使用中！',
	413: '檔案大小超出限制！',
	429: '請求過於頻繁！',
	500: '系統錯誤！',
	503: '系統維護中！',
	504: '超時！'
});

export const statusCodeToAPIResponseTextMap = Object.freeze<PartialRecord<StatusCode, string>>(mapValues(statusCodeToResponseMessageMap, (message, code) => JSON.stringify({ data: {}, message, success: +code < 400 })));
