-- 原子讀取並刪除；以 hex 回傳，避免 Bun RedisClient 將二進位值解碼成字串時損壞。
local value = redis.call("GETDEL", KEYS[1])
if not value then
    return false
end

return (string.gsub(value, ".", function(char)
    return string.format("%02x", string.byte(char))
end))
