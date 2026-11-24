import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import {
    cloneDeep,
    isPlainObject,
} from 'es-toolkit';
import { objectEntries } from 'ts-extras';
import type { UnknownRecord } from 'type-fest';

import {
    defaultPlatformConfigs,
    PlatformScope,
} from '../../../constants/platform';
import { PlatformConfigModel } from '../../../models/platform/config';
import { platformConfigVariants } from '../../../schemas/platform';
import { defineInitTask } from '../../task';

function applyMissingPlatformConfigDefaults(config: UnknownRecord, defaults: UnknownRecord) {
    let changed = false;
    for (const [key, defaultValue] of objectEntries(defaults)) {
        const value = config[key];
        if (value === undefined) {
            config[key] = cloneDeep(defaultValue);
            changed = true;
        } else if (isPlainObject(value) && isPlainObject(defaultValue)) {
            if (applyMissingPlatformConfigDefaults(value, defaultValue)) changed = true;
        }
    }

    return changed;
}

export default defineInitTask({
    name: 'kcs:ensure-platform-configs',
    async run({ adminId, session }) {
        for (const platformScope of getEnumNumberValues(PlatformScope)) {
            const platformConfig = await PlatformConfigModel
                .findOne({ scope: platformScope }, undefined, { session })
                .select(['config'])
                .lean();

            if (platformConfig) {
                const config = cloneDeep(platformConfig.config);
                const changed = applyMissingPlatformConfigDefaults(
                    config,
                    defaultPlatformConfigs[platformScope],
                );

                await platformConfigVariants.parse(platformScope, config);
                if (!changed) continue;

                await PlatformConfigModel.updateOne(
                    { _id: platformConfig._id },
                    {
                        $set: {
                            config,
                            updatedAt: new EnhancedDate(),
                        },
                    },
                    {
                        session,
                        timestamps: false,
                    },
                );

                continue;
            }

            const now = new EnhancedDate();
            await PlatformConfigModel.updateOne(
                { scope: platformScope },
                {
                    $setOnInsert: {
                        config: defaultPlatformConfigs[platformScope],
                        createdAt: now,
                        createdByAdmin: adminId,
                        updatedAt: now,
                    },
                },
                {
                    session,
                    timestamps: false,
                    upsert: true,
                },
            );
        }
    },
    transaction: true,
});
