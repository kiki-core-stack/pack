export enum AdminLogType {
    LoginFailure = 0,
    LoginSuccess = 1,
}

export enum AdminPermissionMode {
    Blacklist = 0,
    Whitelist = 1,
}

export const adminLogTypeToTextMap: ReadonlyRecord<AdminLogType, string> = {
    [AdminLogType.LoginFailure]: '登入失敗',
    [AdminLogType.LoginSuccess]: '登入成功',
};

export const adminPermissionModeToTextMap: ReadonlyRecord<AdminPermissionMode, string> = {
    [AdminPermissionMode.Blacklist]: '黑名單',
    [AdminPermissionMode.Whitelist]: '白名單',
};
