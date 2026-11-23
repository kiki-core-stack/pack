import {
    describe,
    it,
} from 'vitest';

import {
    definePermissions,
    expandPermissionRequirements,
    hasPermission,
} from '../../src/libs/permission';

const catalog = definePermissions({
    admin: {
        children: {
            create: {},
            role: {
                children: {
                    list: {},
                    update: {},
                },
            },
        },
    },
    log: { children: { list: {} } },
});

describe.concurrent('definePermissions', () => {
    it('should expose typed keys, groups and a key map', ({ expect }) => {
        expect(catalog.keys).toStrictEqual([
            'admin.create',
            'admin.role.list',
            'admin.role.update',
            'log.list',
        ]);

        expect(catalog.groups).toStrictEqual([
            'admin',
            'admin.role',
            'log',
        ]);

        expect(catalog.permissions.admin.role.list).toBe('admin.role.list');
    });

    it('should resolve sibling, cross-node and indirect requirements', ({ expect }) => {
        const { requirements } = definePermissions({
            admin: {
                children: {
                    create: {
                        requires: [
                            'update',
                            'log.list',
                        ],
                    },
                    list: {},
                    update: { requires: ['list'] },
                },
            },
            log: { children: { list: {} } },
        });

        expect(requirements).toStrictEqual({
            'admin.create': [
                'admin.list',
                'admin.update',
                'log.list',
            ],
            'admin.update': ['admin.list'],
        });

        expect(expandPermissionRequirements(requirements, ['admin.update']).toSorted()).toStrictEqual([
            'admin.list',
            'admin.update',
        ]);
    });

    it('should reject invalid definitions', ({ expect }) => {
        expect(() => definePermissions({ 'a.b': {} })).toThrow('Invalid permission name');
        expect(() => definePermissions({ admin: { children: {} } })).toThrow('has no children');

        expect(() => definePermissions({ admin: { children: { create: { requires: ['list'] } } } })).toThrow('requires unknown permission "admin.list"');
    });
});

describe.concurrent('hasPermission', () => {
    const granted = {
        permissions: ['admin.role.list'],
        unrestricted: false,
    };

    it('should match exact keys and any-of lists', ({ expect }) => {
        expect(hasPermission(granted, 'admin.role.list')).toBe(true);
        expect(hasPermission(granted, 'admin.create')).toBe(false);
        expect(hasPermission(
            granted,
            [
                'admin.create',
                'admin.role.list',
            ],
        )).toBe(true);
    });

    it('should match group wildcards by prefix only', ({ expect }) => {
        expect(hasPermission(granted, 'admin.*')).toBe(true);
        expect(hasPermission(granted, 'admin.role.*')).toBe(true);
        expect(hasPermission(granted, 'adm.*')).toBe(false);
        expect(hasPermission(granted, 'log.*')).toBe(false);
    });

    it('should subtract exclusions from the matching patterns', ({ expect }) => {
        const catHouse = {
            permissions: [
                'catHouse.group.list',
                'catHouse.job.list',
            ],
            unrestricted: false,
        };

        const requirement = [
            'catHouse.*',
            '!catHouse.group.*',
            '!catHouse.job.*',
        ];

        expect(hasPermission(catHouse, requirement)).toBe(false);
        expect(hasPermission(
            {
                ...catHouse,
                permissions: [
                    ...catHouse.permissions,
                    'catHouse.list',
                ],
            },
            requirement,
        ))
            .toBe(true);

        expect(hasPermission(catHouse, '!catHouse.group.*')).toBe(true);
        expect(hasPermission(
            {
                ...catHouse,
                permissions: ['catHouse.group.list'],
            },
            '!catHouse.group.*',
        )).toBe(false);
    });

    it('should pass everything when unrestricted', ({ expect }) => {
        expect(hasPermission(
            {
                permissions: [],
                unrestricted: true,
            },
            'anything',
        )).toBe(true);

        expect(hasPermission(
            {
                permissions: [],
                unrestricted: false,
            },
            [],
        )).toBe(false);
    });
});
