export enum AdminLogType {
	LoginFailure = 0,
	LoginSuccess = 1
}

export const adminLogTypeToTextMap: Record<AdminLogType, string> = {
	[AdminLogType.LoginFailure]: '登入失敗',
	[AdminLogType.LoginSuccess]: '登入成功'
};
