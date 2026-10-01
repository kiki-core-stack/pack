-- 原子驗證並消耗舊 token，重新確認 epoch 與到期狀態，建立保留原登入資訊及
-- absolute expiry 的新 Session，更新 TTL 與索引，確保並行輪換只成功一次。

local oldValues = redis.call(
    "HMGET",
    KEYS[1],
    "absoluteExpiresAt",
    "epoch",
    "id",
    "lastActiveAt",
    "lastActiveIp",
    "loggedAt",
    "loginIp",
    "principalAuthenticationRevision",
    "principalId",
    "userAgent",
    "validatorDigest"
)

if oldValues[9] ~= ARGV[1] or oldValues[11] ~= ARGV[2] then
    return 0
end

local currentEpoch = redis.call("GET", KEYS[3])
if
    oldValues[2] ~= currentEpoch
    or tonumber(oldValues[1]) <= tonumber(ARGV[3])
    or tonumber(oldValues[4]) + tonumber(ARGV[10]) <= tonumber(ARGV[3])
then
    return 0
end

redis.call("DEL", KEYS[1])
redis.call("ZREM", KEYS[4], oldValues[3])
redis.call(
    "HSET",
    KEYS[2],
    "absoluteExpiresAt",
    oldValues[1],
    "epoch",
    currentEpoch,
    "id",
    ARGV[4],
    "lastActiveAt",
    ARGV[3],
    "lastActiveIp",
    ARGV[5],
    "loggedAt",
    oldValues[6],
    "loginIp",
    oldValues[7],
    "principalAuthenticationRevision",
    oldValues[8],
    "principalId",
    ARGV[1],
    "userAgent",
    ARGV[6],
    "validatorDigest",
    ARGV[7]
)

redis.call("EXPIRE", KEYS[2], ARGV[8])
redis.call("ZADD", KEYS[4], ARGV[9], ARGV[4])
local expiredIds = redis.call("ZRANGEBYSCORE", KEYS[4], "-inf", ARGV[3], "LIMIT", 0, 256)
if #expiredIds > 0 then
    redis.call("ZREM", KEYS[4], unpack(expiredIds))
end

if redis.call("TTL", KEYS[4]) < tonumber(ARGV[8]) then
    redis.call("EXPIRE", KEYS[4], ARGV[8])
end

return 1
