export const createAuthenticationSessionScript = String.raw`
local epoch = redis.call('GET', KEYS[2])
if epoch ~= ARGV[1] then
    return 0
end

redis.call('HSET', KEYS[1],
    'absoluteExpiresAt', ARGV[2],
    'epoch', epoch,
    'id', ARGV[3],
    'lastActiveAt', ARGV[4],
    'lastActiveIp', ARGV[5],
    'loggedAt', ARGV[4],
    'loginIp', ARGV[5],
    'principalAuthenticationRevision', ARGV[6],
    'principalId', ARGV[7],
    'principalType', ARGV[8],
    'userAgent', ARGV[9],
    'validatorDigest', ARGV[10])
redis.call('EXPIRE', KEYS[1], ARGV[11])
redis.call('ZADD', KEYS[3], ARGV[12], ARGV[3])
local expiredIds = redis.call('ZRANGEBYSCORE', KEYS[3], '-inf', ARGV[4],
    'LIMIT', 0, 256)
if #expiredIds > 0 then
    redis.call('ZREM', KEYS[3], unpack(expiredIds))
end
if redis.call('TTL', KEYS[3]) < tonumber(ARGV[11]) then
    redis.call('EXPIRE', KEYS[3], ARGV[11])
end
return 1
`;

export const finalizeAuthenticationSessionScript = String.raw`
local values = redis.call('HMGET', KEYS[1],
    'absoluteExpiresAt', 'epoch', 'id', 'lastActiveAt', 'principalId',
    'validatorDigest')
if not values[1] then
    return 0
end

local currentEpoch = redis.call('GET', KEYS[2])
if currentEpoch ~= ARGV[1]
    or values[2] ~= currentEpoch
    or values[5] ~= ARGV[2]
    or values[6] ~= ARGV[3]
    or tonumber(values[1]) <= tonumber(ARGV[4])
    or tonumber(values[4]) + tonumber(ARGV[9]) <= tonumber(ARGV[4]) then
    redis.call('DEL', KEYS[1])
    redis.call('ZREM', KEYS[3], values[3])
    return 0
end

if tonumber(ARGV[4]) - tonumber(values[4]) < tonumber(ARGV[7]) then
    return 1
end

redis.call('HSET', KEYS[1], 'lastActiveAt', ARGV[4], 'lastActiveIp', ARGV[5])
redis.call('EXPIRE', KEYS[1], ARGV[6])
redis.call('ZADD', KEYS[3], ARGV[8], values[3])
local expiredIds = redis.call('ZRANGEBYSCORE', KEYS[3], '-inf', ARGV[4],
    'LIMIT', 0, 256)
if #expiredIds > 0 then
    redis.call('ZREM', KEYS[3], unpack(expiredIds))
end
if redis.call('TTL', KEYS[3]) < tonumber(ARGV[6]) then
    redis.call('EXPIRE', KEYS[3], ARGV[6])
end
return 2
`;

export const initializeAuthenticationSessionEpochScript = String.raw`
local epoch = redis.call('GET', KEYS[1])
if not epoch then
    epoch = ARGV[1]
    redis.call('SET', KEYS[1], epoch, 'EX', ARGV[2])
elseif redis.call('TTL', KEYS[1]) < tonumber(ARGV[2]) then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end
return epoch
`;

export const revokeAllAuthenticationSessionsScript = String.raw`
local oldEpoch = redis.call('GET', KEYS[1])
redis.call('DEL', KEYS[1])
return oldEpoch or ''
`;

export const revokeAuthenticationSessionScript = String.raw`
local values = redis.call('HMGET', KEYS[1], 'epoch', 'id', 'principalId')
if values[1] ~= ARGV[1]
    or values[3] ~= ARGV[2] then
    return 0
end

redis.call('DEL', KEYS[1])
redis.call('ZREM', KEYS[2], values[2])
return 1
`;

export const rotateAuthenticationSessionScript = String.raw`
local oldValues = redis.call('HMGET', KEYS[1],
    'absoluteExpiresAt', 'epoch', 'id', 'lastActiveAt', 'lastActiveIp',
    'loggedAt', 'loginIp', 'principalAuthenticationRevision', 'principalId',
    'principalType', 'userAgent', 'validatorDigest')
if oldValues[9] ~= ARGV[1]
    or oldValues[12] ~= ARGV[2] then
    return 0
end

local currentEpoch = redis.call('GET', KEYS[3])
if oldValues[2] ~= currentEpoch
    or tonumber(oldValues[1]) <= tonumber(ARGV[3])
    or tonumber(oldValues[4]) + tonumber(ARGV[10]) <= tonumber(ARGV[3]) then
    return 0
end

redis.call('DEL', KEYS[1])
redis.call('ZREM', KEYS[4], oldValues[3])
redis.call('HSET', KEYS[2],
    'absoluteExpiresAt', oldValues[1],
    'epoch', currentEpoch,
    'id', ARGV[4],
    'lastActiveAt', ARGV[3],
    'lastActiveIp', ARGV[5],
    'loggedAt', oldValues[6],
    'loginIp', oldValues[7],
    'principalAuthenticationRevision', oldValues[8],
    'principalId', ARGV[1],
    'principalType', oldValues[10],
    'userAgent', ARGV[6],
    'validatorDigest', ARGV[7])
redis.call('EXPIRE', KEYS[2], ARGV[8])
redis.call('ZADD', KEYS[4], ARGV[9], ARGV[4])
local expiredIds = redis.call('ZRANGEBYSCORE', KEYS[4], '-inf', ARGV[3],
    'LIMIT', 0, 256)
if #expiredIds > 0 then
    redis.call('ZREM', KEYS[4], unpack(expiredIds))
end
if redis.call('TTL', KEYS[4]) < tonumber(ARGV[8]) then
    redis.call('EXPIRE', KEYS[4], ARGV[8])
end
return 1
`;
