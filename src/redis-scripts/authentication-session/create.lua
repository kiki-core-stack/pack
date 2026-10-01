-- 原子建立 Session：重新確認主體 epoch，寫入只保存 token digest 的 Session hash，
-- 設定 idle/absolute 較早的 TTL，更新到期索引並限量清除過期 member。

local epoch = redis.call("GET", KEYS[2])
if epoch ~= ARGV[1] then
    return 0
end

redis.call(
    "HSET",
    KEYS[1],
    "absoluteExpiresAt",
    ARGV[2],
    "epoch",
    epoch,
    "id",
    ARGV[3],
    "lastActiveAt",
    ARGV[4],
    "lastActiveIp",
    ARGV[5],
    "loggedAt",
    ARGV[4],
    "loginIp",
    ARGV[5],
    "principalAuthenticationRevision",
    ARGV[6],
    "principalId",
    ARGV[7],
    "userAgent",
    ARGV[8],
    "validatorDigest",
    ARGV[9]
)

redis.call("EXPIRE", KEYS[1], ARGV[10])
redis.call("ZADD", KEYS[3], ARGV[11], ARGV[3])
local expiredIds = redis.call("ZRANGEBYSCORE", KEYS[3], "-inf", ARGV[4], "LIMIT", 0, 256)
if #expiredIds > 0 then
    redis.call("ZREM", KEYS[3], unpack(expiredIds))
end

if redis.call("TTL", KEYS[3]) < tonumber(ARGV[10]) then
    redis.call("EXPIRE", KEYS[3], ARGV[10])
end

return 1
