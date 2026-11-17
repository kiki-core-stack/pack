import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import { createRedisScriptRunner } from '@kikiutils/shared/redis/script-runner';
import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';
import { LRUCache } from 'lru-cache';

import { redisClient } from '../../connections/redis';
import { projectRedisKeyPrefix } from '../../constants';
import * as redisScripts from '../../redis-scripts';
import { redisMsgpackStorage } from '../../storages/redis/msgpack';

interface LocalCacheEntry<T> extends SharedCacheValue<T> {
    checkedAt: number;
    loadedAt: number;
}

interface SharedCacheValue<T> {
    value: T;
    version: string;
}

export interface VersionedCacheDependency {
    readonly cache: VersionedCache<any, any>;
    readonly entryKey: string;
}

export interface VersionedCacheOptions<P extends unknown[], T> {
    /**
     * 依賴的其他快取條目；任一版本號變更即視為本快取失效。
     * 同一實例內被依賴的快取失效時，會一併清除本快取的本機條目。
     */
    dependsOn?: VersionedCacheDependency[];

    /**
     * 載入失敗的錯誤保留秒數，期間直接拋出同一錯誤；未設定則不快取失敗。
     */
    failureTtlSeconds?: number;

    /**
     * 由參數產生條目 key；未設定表示單一條目快取。
     */
    key?: (...args: P) => string;
    load: (...args: P) => Promise<T>;

    /**
     * 本機快取：每 revalidateIntervalSeconds 向 Redis 確認一次版本號，超過 maxAgeSeconds 強制重新載入。
     */
    local?: {
        max?: number;
        maxAgeSeconds: number;
        revalidateIntervalSeconds: number;
    };

    /**
     * Redis 鍵名稱的一部分，各快取之間不可重複。
     */
    name: string;

    /**
     * 設定後載入結果以 msgpack 寫入 Redis 供各實例共用（值必須可序列化）。
     */
    redisTtlSeconds?: number;
}

// Constants
const incrementCacheVersion = createRedisScriptRunner<number>(redisClient, redisScripts.cache.incrementVersion);

/**
 * 版本號式快取：失效時遞增 Redis 中的版本號，而不是刪除資料。
 *
 * 載入前先讀取版本號，寫入的值帶著該版本號；讀取時版本號不一致即視為失效。
 * 因此清除快取前就開始的載入（包含其他實例）稍後寫回的舊值不會被採用，
 * 全部失效也只需遞增一個命名空間版本號，不必掃描刪除所有 key。
 *
 * 版本號讀取或載入失敗會拋錯（fail-closed），由呼叫端決定如何回應。
 */
export class VersionedCache<P extends unknown[], T> {
    /**
     * 依賴本快取的其他快取，及其依賴的條目 key。
     */
    readonly #dependents = new Map<VersionedCache<any, any>, Set<string>>();
    readonly #failures: LRUCache<string, { error: unknown }> | undefined;
    readonly #localEntries: LRUCache<string, LocalCacheEntry<T>> | undefined;
    readonly #localMaxAgeMilliseconds: number;
    readonly #localRevalidateIntervalMilliseconds: number;
    readonly #options: VersionedCacheOptions<P, T>;
    readonly #pendingLoads = new Map<string, Promise<T>>();
    readonly #sharedValues;
    readonly #versionKeyTtlMilliseconds: number;
    #generation = 0;

    constructor(options: VersionedCacheOptions<P, T>) {
        this.#options = options;
        if (options.failureTtlSeconds) {
            this.#failures = new LRUCache({
                max: 1000,
                ttl: options.failureTtlSeconds * 1000,
            });
        }

        if (options.local) this.#localEntries = new LRUCache({ max: options.local.max ?? 1000 });
        this.#localMaxAgeMilliseconds = (options.local?.maxAgeSeconds ?? 0) * 1000;
        this.#localRevalidateIntervalMilliseconds = (options.local?.revalidateIntervalSeconds ?? 0) * 1000;
        if (options.redisTtlSeconds) {
            this.#sharedValues = createRedisKeyedStore<SharedCacheValue<T>>(redisMsgpackStorage)(
                (entryKey: string) => this.#getRedisKey('cache', entryKey),
            );
        }

        // 條目版本號必須比任何以舊版本號寫入的值活得久，才不會在過期歸零後誤判舊值為最新。
        this.#versionKeyTtlMilliseconds = Math.max((options.redisTtlSeconds ?? 0) * 1000, this.#localMaxAgeMilliseconds)
          + 60 * 60 * 1000;

        for (const dependency of options.dependsOn ?? []) {
            const entryKeys = dependency.cache.#dependents.get(this);
            if (entryKeys) entryKeys.add(dependency.entryKey);
            else dependency.cache.#dependents.set(this, new Set([dependency.entryKey]));
        }
    }

    // Private methods

    /**
     * 未指定 entryKey 表示本快取全部失效。
     */
    #clearDependentsLocal(entryKey?: string) {
        for (const [dependent, entryKeys] of this.#dependents) {
            if (entryKey === undefined || entryKeys.has(entryKey)) dependent.#clearLocal();
        }
    }

    #clearLocal() {
        this.#generation++;
        this.#localEntries?.clear();
        this.#failures?.clear();
        this.#pendingLoads.clear();
        this.#clearDependentsLocal();
    }

    #getEntryKey(args: P) {
        return this.#options.key?.(...args) ?? '';
    }

    #getRedisKey(type: 'cache' | 'cacheVersion', entryKey = '') {
        const key = `${projectRedisKeyPrefix}:${type}:${this.#options.name}`;
        return entryKey ? `${key}:${entryKey}` : key;
    }

    #getVersionKeys(entryKey: string): string[] {
        const keys = [this.#getRedisKey('cacheVersion')];
        if (entryKey) keys.push(this.#getRedisKey('cacheVersion', entryKey));
        for (const dependency of this.#options.dependsOn ?? []) {
            keys.push(...dependency.cache.#getVersionKeys(dependency.entryKey));
        }

        return keys;
    }

    async #loadEntry(args: P, entryKey: string) {
        const generation = this.#generation;
        try {
            const [version, sharedValue] = await Promise.all([
                this.#readVersion(entryKey),
                this.#sharedValues?.getItem(entryKey),
            ]);

            const now = EnhancedDate.now();
            const localEntry = this.#localEntries?.get(entryKey);
            if (localEntry?.version === version && now - localEntry.loadedAt < this.#localMaxAgeMilliseconds) {
                localEntry.checkedAt = now;
                return localEntry.value;
            }

            let value: T;
            if (sharedValue?.version === version) value = sharedValue.value;
            else {
                value = await this.#options.load(...args);
                if (this.#sharedValues) {
                    await this.#sharedValues.setItemWithTtl(
                        this.#options.redisTtlSeconds!,
                        {
                            value,
                            version,
                        },
                        entryKey,
                    );
                }
            }

            // 載入期間若已失效，不寫入本機；跨實例的情況由下次版本確認處理。
            if (generation === this.#generation) {
                this.#localEntries?.set(
                    entryKey,
                    {
                        checkedAt: now,
                        loadedAt: now,
                        value,
                        version,
                    },
                );
            }

            return value;
        } catch (error) {
            if (generation === this.#generation) this.#failures?.set(entryKey, { error });
            throw error;
        }
    }

    async #readVersion(entryKey: string) {
        const versions = await redisClient.send('MGET', this.#getVersionKeys(entryKey)) as Array<null | string>;
        return versions.map((version) => version ?? '0').join(':');
    }

    // Public methods

    /**
     * 供其他快取的 dependsOn 使用。
     */
    asDependency(...args: P): VersionedCacheDependency {
        return {
            cache: this,
            entryKey: this.#getEntryKey(args),
        };
    }

    async get(...args: P): Promise<T> {
        const entryKey = this.#getEntryKey(args);
        const localEntry = this.#localEntries?.get(entryKey);
        if (localEntry) {
            const now = EnhancedDate.now();
            if (
                now - localEntry.checkedAt < this.#localRevalidateIntervalMilliseconds
                && now - localEntry.loadedAt < this.#localMaxAgeMilliseconds
            ) return localEntry.value;
        }

        const failure = this.#failures?.get(entryKey);
        if (failure) throw failure.error;
        let pendingLoad = this.#pendingLoads.get(entryKey);
        if (!pendingLoad) {
            const load = this.#loadEntry(args, entryKey).finally(() => {
                if (this.#pendingLoads.get(entryKey) === load) this.#pendingLoads.delete(entryKey);
            });

            this.#pendingLoads.set(entryKey, pendingLoad = load);
        }

        return await pendingLoad;
    }

    /**
     * 使單一條目失效；單一條目快取等同 invalidateAll。
     */
    async invalidate(...args: P) {
        if (!this.#options.key) return await this.invalidateAll();
        const entryKey = this.#getEntryKey(args);
        await incrementCacheVersion([this.#getRedisKey('cacheVersion', entryKey)], [this.#versionKeyTtlMilliseconds.toString()]);
        // 必須在遞增版本號之後才清除本機狀態，避免進行中的載入在清除後寫回舊值。
        this.#generation++;
        this.#localEntries?.delete(entryKey);
        this.#failures?.delete(entryKey);
        this.#pendingLoads.delete(entryKey);
        this.#clearDependentsLocal(entryKey);
    }

    async invalidateAll() {
        await incrementCacheVersion([this.#getRedisKey('cacheVersion')], ['0']);
        this.#clearLocal();
    }
}
