-- 重新確認 epoch 與 principal 後，原子刪除單一 Session hash 及其 index member。

local values = redis.call("HMGET", KEYS[1], "epoch", "id", "principalId")
if values[1] ~= ARGV[1] or values[3] ~= ARGV[2] then
    return 0
end

redis.call("DEL", KEYS[1])
redis.call("ZREM", KEYS[2], values[2])
return 1
