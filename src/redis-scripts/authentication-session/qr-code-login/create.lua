-- 依 Redis server time 建立 pending QR 登入請求，保存互相分離的 approval/completion
-- capability digest、目標裝置資訊與 request TTL，並回傳到期時間。

local redisTime = redis.call("TIME")
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
local expiresAt = now + tonumber(ARGV[5]) * 1000
redis.call(
    "HSET",
    KEYS[1],
    "approvalValidatorDigest",
    ARGV[1],
    "expiresAt",
    expiresAt,
    "state",
    "pending",
    "targetIp",
    ARGV[2],
    "targetUserAgent",
    ARGV[3],
    "completionValidatorDigest",
    ARGV[4]
)

redis.call("EXPIRE", KEYS[1], ARGV[5])
return tostring(expiresAt)
