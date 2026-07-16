export function isDebugMode() {
    const { DEBUG, NODE_ENV } = process.env;
    return NODE_ENV === 'development' || DEBUG === 'true';
}
