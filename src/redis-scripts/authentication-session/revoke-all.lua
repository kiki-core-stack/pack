-- 原子刪除並回傳主體舊 epoch，使所有引用舊世代的 Session 立即失效。

local oldEpoch = redis.call("GET", KEYS[1])
redis.call("DEL", KEYS[1])
return oldEpoch or ""
