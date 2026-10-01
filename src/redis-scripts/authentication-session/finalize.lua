-- 主體驗證完成後再次原子確認 epoch、principal、digest、absolute 與 idle expiry；
-- 尚未達 touch interval 時只回報成功，否則更新活動資訊、TTL 與到期索引。

local values =
    redis.call("HMGET", KEYS[1], "absoluteExpiresAt", "epoch", "id", "lastActiveAt", "principalId", "validatorDigest")

if not values[1] then
    return 0
end

local currentEpoch = redis.call("GET", KEYS[2])
if
    currentEpoch ~= ARGV[1]
    or values[2] ~= currentEpoch
    or values[5] ~= ARGV[2]
    or values[6] ~= ARGV[3]
    or tonumber(values[1]) <= tonumber(ARGV[4])
    or tonumber(values[4]) + tonumber(ARGV[9]) <= tonumber(ARGV[4])
then
    redis.call("DEL", KEYS[1])
    redis.call("ZREM", KEYS[3], values[3])
    return 0
end

if tonumber(ARGV[4]) - tonumber(values[4]) < tonumber(ARGV[7]) then
    return 1
end

redis.call("HSET", KEYS[1], "lastActiveAt", ARGV[4], "lastActiveIp", ARGV[5])
redis.call("EXPIRE", KEYS[1], ARGV[6])
redis.call("ZADD", KEYS[3], ARGV[8], values[3])
local expiredIds = redis.call("ZRANGEBYSCORE", KEYS[3], "-inf", ARGV[4], "LIMIT", 0, 256)
if #expiredIds > 0 then
    redis.call("ZREM", KEYS[3], unpack(expiredIds))
end

if redis.call("TTL", KEYS[3]) < tonumber(ARGV[6]) then
    redis.call("EXPIRE", KEYS[3], ARGV[6])
end

return 2
