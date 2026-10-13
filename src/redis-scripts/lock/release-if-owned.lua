-- 只釋放 token 相符的鎖，避免刪除到期後由其他執行者取得的新鎖。
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end

return 0
