import type { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';

import type { JobType } from '../constants/job';
import type { jobOutboxEventPayloadVariants } from '../schemas/job';

import type {
    DiscriminatedFieldVariant,
    ZodSchemaMapInput,
    ZodSchemaMapOutput,
} from './';

export type CreateJobOutboxEventInput<T extends JobType = JobType> =
  & DiscriminatedFieldVariant<'type', 'payload', JobOutboxEventPayloadInputByType, T>
  & { nextPublishAt?: EnhancedDate };

export type JobOutboxEventPayloadByType = ZodSchemaMapOutput<typeof jobOutboxEventPayloadVariants['schemas']>;
export type JobOutboxEventPayloadInputByType = ZodSchemaMapInput<typeof jobOutboxEventPayloadVariants['schemas']>;
export type JobOutboxEventPayloadVariant<T extends JobType = JobType> = DiscriminatedFieldVariant<
    'type',
    'payload',
    JobOutboxEventPayloadByType,
    T
>;
