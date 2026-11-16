-- 遞增快取版本號；ARGV[1] 大於 0 時同時設定毫秒 TTL，避免逐條目版本號無限累積。
local version = redis.call("INCR", KEYS[1])
local ttl = tonumber(ARGV[1])
if ttl > 0 then
    redis.call("PEXPIRE", KEYS[1], ttl)
end

return version
