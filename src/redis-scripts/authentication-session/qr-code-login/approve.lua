-- 來源裝置以 approval capability 原子核准 pending request：驗證 capability、來源 Session、
-- epoch 與各項期限，保存完成階段需要的來源綁定，並將 request TTL 收斂到短效核准期限。

local request = redis.call("HMGET", KEYS[1], "approvalValidatorDigest", "state", "expiresAt")
if request[1] ~= ARGV[1] or request[2] ~= "pending" then
    return 0
end

local source = redis.call(
    "HMGET",
    KEYS[2],
    "absoluteExpiresAt",
    "epoch",
    "id",
    "lastActiveAt",
    "principalAuthenticationRevision",
    "principalId"
)

local currentEpoch = redis.call("GET", KEYS[3])
local redisTime = redis.call("TIME")
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
if
    currentEpoch ~= ARGV[3]
    or source[2] ~= currentEpoch
    or source[3] ~= ARGV[2]
    or source[5] ~= ARGV[4]
    or source[6] ~= ARGV[5]
    or tonumber(request[3]) <= now
    or tonumber(source[1]) <= now
    or tonumber(source[4]) + tonumber(ARGV[6]) <= now
then
    return 0
end

local approvalExpiresAt = math.min(tonumber(request[3]), now + tonumber(ARGV[7]))
redis.call(
    "HSET",
    KEYS[1],
    "approvalExpiresAt",
    approvalExpiresAt,
    "principalAuthenticationRevision",
    source[5],
    "principalId",
    source[6],
    "sourceEpoch",
    source[2],
    "sourceSessionId",
    source[3],
    "state",
    "approved"
)

redis.call("PEXPIREAT", KEYS[1], approvalExpiresAt)
return 1
