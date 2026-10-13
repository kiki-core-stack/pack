import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import {
    cloneDeep,
    isPlainObject,
} from 'es-toolkit';
import type {
    ClientSession,
    Types,
} from 'mongoose';

import {
    defaultPlatformConfigs,
    PlatformConfigScope,
} from '../../../constants/platform';
import { PlatformConfigModel } from '../../../models/platform/config';
import { platformConfigValidators } from '../../../schemas/platform/config';

function applyMissingPlatformConfigDefaults(config: Record<string, unknown>, defaults: Record<string, unknown>) {
    let changed = false;
    for (const [key, defaultValue] of Object.entries(defaults)) {
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

export async function run(session: ClientSession, adminId: Types.ObjectId) {
    // Create platform configs and backfill missing defaults without overwriting existing values.
    for (const platformConfigScope of getEnumNumberValues(PlatformConfigScope)) {
        const platformConfig = await PlatformConfigModel
            .findOne({ scope: platformConfigScope }, undefined, { session })
            .select(['config'])
            .lean();

        if (platformConfig) {
            const config = cloneDeep(platformConfig.config);
            const changed = applyMissingPlatformConfigDefaults(
                config,
                defaultPlatformConfigs[platformConfigScope],
            );

            platformConfigValidators[platformConfigScope].parse(config);
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
            { scope: platformConfigScope },
            {
                $setOnInsert: {
                    config: defaultPlatformConfigs[platformConfigScope],
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
}
