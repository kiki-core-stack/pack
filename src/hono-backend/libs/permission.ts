import type { Arrayable } from 'type-fest';

import { hasPermission } from '../../libs/permission';
import type { PrincipalPermissions } from '../../types/permission';
import * as apiErrors from '../api-errors';

import { throwApiError } from './api/error';

/**
 * Throws `forbidden` unless the principal passes any of the required permissions (see `hasPermission`).
 */
export function assertPermission(granted: PrincipalPermissions, required: Arrayable<string>) {
    if (!hasPermission(granted, required)) throwApiError(apiErrors.common.forbidden);
}
