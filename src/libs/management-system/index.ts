import type { ManagementSystemType } from '../../types';

export function getManagementSystemTypeFromRoutePath(path: string): ManagementSystemType | undefined {
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) return 'admin';
}
