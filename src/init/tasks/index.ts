import type { InitTask } from '../task';

import * as kcs from './kcs';

export const initTasks: InitTask[] = [
    // KCS
    kcs.ensurePlatformConfigs,

    // Downstream project
];
