import Bowser from 'bowser';

export interface UserAgentDeviceInfo {
    deviceName: string;
    platformType?: string;
}

function getPlatformTypeName(platformType?: string) {
    switch (platformType) {
        case 'bot': return '自動化工具';
        case 'desktop': return '電腦';
        case 'mobile': return '手機';
        case 'tablet': return '平板';
        case 'tv': return '智慧電視';
        default: return '未知裝置';
    }
}

export function getUserAgentDeviceInfo(userAgent?: string): UserAgentDeviceInfo {
    if (!userAgent) {
        return {
            deviceName: '未知裝置',
            platformType: undefined,
        };
    }

    const {
        browser,
        os,
        platform,
    } = Bowser.parse(userAgent);

    const deviceName = [
        platform.vendor,
        platform.model,
    ].filter((value) => value).join(' ') || os.name || getPlatformTypeName(platform.type);

    return {
        deviceName: [
            browser.name,
            deviceName,
        ].filter((value) => value).join(' · ') || '未知裝置',
        platformType: platform.type,
    };
}
