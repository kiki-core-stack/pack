import type {
    ClientSession,
    Types,
} from 'mongoose';

export type InitTask = NonTransactionalInitTask | TransactionalInitTask;

export interface InitTaskContext {
    adminId: Types.ObjectId;
}

export interface NonTransactionalInitTask {
    name: string;
    run: (context: InitTaskContext) => Promise<void>;
    transaction: false;
}

export interface TransactionalInitTask {
    name: string;
    run: (context: InitTaskContext & { session: ClientSession }) => Promise<void>;
    transaction: true;
}

// Functions

/**
 * Defines a task run on every system initialization, so it must be safe to run again: check the current state and
 * change only what is missing. One-off data migrations do not belong here; run them as scripts when deploying.
 *
 * `transaction: true` gives the task a transaction of its own rather than one shared by all tasks.
 */
export function defineInitTask<T extends InitTask>(task: T) {
    return task;
}
