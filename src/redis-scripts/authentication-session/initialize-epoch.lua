-- 取得或建立主體目前的撤銷世代；既有 epoch 繼續沿用，
-- 並確保 epoch key 的 TTL 足以涵蓋新 Session 的 absolute TTL。

local epoch = redis.call("GET", KEYS[1])
if not epoch then
    epoch = ARGV[1]
    redis.call("SET", KEYS[1], epoch, "EX", ARGV[2])
elseif redis.call("TTL", KEYS[1]) < tonumber(ARGV[2]) then
    redis.call("EXPIRE", KEYS[1], ARGV[2])
end

return epoch
