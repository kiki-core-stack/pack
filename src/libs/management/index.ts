import type { ManagementType } from '../../types';

export function getManagementTypeFromRoutePath(path: string): ManagementType | undefined {
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) return 'admin';
}
