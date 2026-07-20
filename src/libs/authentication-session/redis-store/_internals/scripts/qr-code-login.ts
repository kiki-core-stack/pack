/**
 * 來源裝置以 approval capability 原子核准 pending request：驗證 capability、來源 Session、
 * epoch 與各項期限，保存完成階段需要的來源綁定，並將 request TTL 收斂到短效核准期限。
 */
export const approveAuthenticationSessionQrCodeLoginScript = String.raw`
local request = redis.call('HMGET', KEYS[1],
    'approvalValidatorDigest', 'state', 'expiresAt')
if request[1] ~= ARGV[1]
    or request[2] ~= 'pending' then
    return 0
end

local source = redis.call('HMGET', KEYS[2],
    'absoluteExpiresAt', 'epoch', 'id', 'lastActiveAt',
    'principalAuthenticationRevision', 'principalId')
local currentEpoch = redis.call('GET', KEYS[3])
local redisTime = redis.call('TIME')
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
if currentEpoch ~= ARGV[3]
    or source[2] ~= currentEpoch
    or source[3] ~= ARGV[2]
    or source[5] ~= ARGV[4]
    or source[6] ~= ARGV[5]
    or tonumber(request[3]) <= now
    or tonumber(source[1]) <= now
    or tonumber(source[4]) + tonumber(ARGV[6]) <= now then
    return 0
end

local approvalExpiresAt = math.min(tonumber(request[3]), now + tonumber(ARGV[7]))
redis.call('HSET', KEYS[1],
    'approvalExpiresAt', approvalExpiresAt,
    'principalAuthenticationRevision', source[5],
    'principalId', source[6],
    'sourceEpoch', source[2],
    'sourceSessionId', source[3],
    'state', 'approved')
redis.call('PEXPIREAT', KEYS[1], approvalExpiresAt)
return 1
`;

/**
 * 目標裝置原子完成已核准請求：重新驗證 request、來源 Session、epoch 與期限，
 * 建立具全新 absolute lifetime 且仍受 idle TTL 限制的目標 Session，維護 epoch/index TTL，
 * 最後消耗一次性 request。
 */
export const completeAuthenticationSessionQrCodeLoginScript = String.raw`
local request = redis.call('HMGET', KEYS[1],
    'completionValidatorDigest', 'state', 'approvalExpiresAt',
    'sourceSessionId', 'sourceEpoch', 'principalAuthenticationRevision',
    'principalId')
if request[1] ~= ARGV[1]
    or request[2] ~= 'approved'
    or request[4] ~= ARGV[2]
    or request[5] ~= ARGV[3]
    or request[6] ~= ARGV[4]
    or request[7] ~= ARGV[5] then
    return 0
end

local source = redis.call('HMGET', KEYS[2],
    'absoluteExpiresAt', 'epoch', 'id', 'lastActiveAt',
    'principalAuthenticationRevision', 'principalId')
local currentEpoch = redis.call('GET', KEYS[3])
local redisTime = redis.call('TIME')
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
local idleTtlSeconds = tonumber(ARGV[7])
local idleTtlMilliseconds = idleTtlSeconds * 1000
if currentEpoch ~= request[5]
    or source[2] ~= currentEpoch
    or source[3] ~= request[4]
    or source[5] ~= request[6]
    or source[6] ~= request[7]
    or tonumber(request[3]) <= now
    or tonumber(source[1]) <= now
    or tonumber(source[4]) + idleTtlMilliseconds <= now
    or tonumber(ARGV[6]) <= now then
    return 0
end

local targetAbsoluteRemainingSeconds = math.ceil((tonumber(ARGV[6]) - now) / 1000)
local sessionTtlSeconds = math.min(idleTtlSeconds, targetAbsoluteRemainingSeconds)
local sessionExpiresAt = math.min(tonumber(ARGV[6]), now + idleTtlMilliseconds)
redis.call('HSET', KEYS[4],
    'absoluteExpiresAt', ARGV[6],
    'epoch', request[5],
    'id', ARGV[8],
    'lastActiveAt', now,
    'lastActiveIp', ARGV[9],
    'loggedAt', now,
    'loginIp', ARGV[9],
    'principalAuthenticationRevision', request[6],
    'principalId', request[7],
    'userAgent', ARGV[10],
    'validatorDigest', ARGV[11])
redis.call('EXPIRE', KEYS[4], sessionTtlSeconds)
redis.call('ZADD', KEYS[5], sessionExpiresAt, ARGV[8])
local expiredIds = redis.call('ZRANGEBYSCORE', KEYS[5], '-inf', now,
    'LIMIT', 0, 256)
if #expiredIds > 0 then
    redis.call('ZREM', KEYS[5], unpack(expiredIds))
end
if redis.call('TTL', KEYS[3]) < targetAbsoluteRemainingSeconds then
    redis.call('EXPIRE', KEYS[3], targetAbsoluteRemainingSeconds)
end
if redis.call('TTL', KEYS[5]) < sessionTtlSeconds then
    redis.call('EXPIRE', KEYS[5], sessionTtlSeconds)
end
redis.call('DEL', KEYS[1])
return {targetAbsoluteRemainingSeconds, now}
`;

/**
 * 依 Redis server time 建立 pending QR 登入請求，保存互相分離的 approval/completion
 * capability digest、目標裝置資訊與 request TTL，並回傳到期時間。
 */
export const createAuthenticationSessionQrCodeLoginScript = String.raw`
local redisTime = redis.call('TIME')
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
local expiresAt = now + tonumber(ARGV[5]) * 1000
redis.call('HSET', KEYS[1],
    'approvalValidatorDigest', ARGV[1],
    'expiresAt', expiresAt,
    'state', 'pending',
    'targetIp', ARGV[2],
    'targetUserAgent', ARGV[3],
    'completionValidatorDigest', ARGV[4])
redis.call('EXPIRE', KEYS[1], ARGV[5])
return tostring(expiresAt)
`;
