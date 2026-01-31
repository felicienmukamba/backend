export const PERMISSIONS = {
    // Users & Roles
    USERS_READ: 'users:read',
    USERS_WRITE: 'users:write',
    USERS_DELETE: 'users:delete',
    ROLES_READ: 'roles:read',
    ROLES_WRITE: 'roles:write',

    // Resources
    PRODUCTS_READ: 'products:read',
    PRODUCTS_WRITE: 'products:write',
    THIRD_PARTIES_READ: 'third_parties:read',
    THIRD_PARTIES_WRITE: 'third_parties:write',

    // Sales
    INVOICES_READ: 'invoices:read',
    INVOICES_WRITE: 'invoices:write',
    INVOICES_VALIDATE: 'invoices:validate',
    CREDIT_NOTES_READ: 'credit_notes:read',
    CREDIT_NOTES_WRITE: 'credit_notes:write',

    // Accounting
    ACCOUNTS_READ: 'accounts:read',
    ACCOUNTS_WRITE: 'accounts:write',
    ENTRIES_READ: 'entries:read',
    ENTRIES_WRITE: 'entries:write',
    REPORTS_READ: 'reports:read', // Balance Sheet, Income Statement

    // System
    COMPANY_SETTINGS: 'company:settings',
    BRANCHES_MANAGE: 'branches:manage',

    // HR
    HR_READ: 'hr:read',
    HR_WRITE: 'hr:write',
    HR_PAYROLL: 'hr:payroll',

    // Budgeting
    BUDGETS_READ: 'budgets:read',
    BUDGETS_WRITE: 'budgets:write',
} as const;

export const DEFAULT_ROLES = {
    SUPERADMIN: {
        label: 'Super Administrateur SaaS',
        permissions: ['*']
    },
    ADMIN_COMPANY: {
        label: 'Administrateur Entreprise',
        permissions: [
            PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE, PERMISSIONS.USERS_DELETE,
            PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_WRITE,
            PERMISSIONS.COMPANY_SETTINGS, PERMISSIONS.BRANCHES_MANAGE,
            PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.ENTRIES_READ, PERMISSIONS.REPORTS_READ
        ]
    },
    ADMIN_BRANCH: {
        label: 'Administrateur Succursale',
        permissions: [
            PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE,
            PERMISSIONS.BRANCHES_MANAGE,
            PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_WRITE,
            PERMISSIONS.THIRD_PARTIES_READ, PERMISSIONS.PRODUCTS_READ
        ]
    },
    COMPTABLE: {
        label: 'Comptable',
        permissions: [
            PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.ACCOUNTS_WRITE,
            PERMISSIONS.ENTRIES_READ, PERMISSIONS.ENTRIES_WRITE,
            PERMISSIONS.REPORTS_READ,
            PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_VALIDATE,
            PERMISSIONS.THIRD_PARTIES_READ,
            PERMISSIONS.PRODUCTS_READ
        ]
    },
    DIRECTEUR_FINANCIER: {
        label: 'Directeur Financier',
        permissions: [
            PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.REPORTS_READ,
            PERMISSIONS.BUDGETS_READ, PERMISSIONS.BUDGETS_WRITE,
            PERMISSIONS.INVOICES_READ, PERMISSIONS.ENTRIES_READ
        ]
    },
    RH: {
        label: 'Responsable RH',
        permissions: [
            PERMISSIONS.HR_READ, PERMISSIONS.HR_WRITE, PERMISSIONS.HR_PAYROLL,
            PERMISSIONS.USERS_READ
        ]
    },
    GERANT: {
        label: 'Gérant',
        permissions: [
            PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE,
            PERMISSIONS.INVOICES_READ, PERMISSIONS.THIRD_PARTIES_READ,
            PERMISSIONS.REPORTS_READ, PERMISSIONS.BUDGETS_READ
        ]
    },
    CAISSIER: {
        label: 'Caissier',
        permissions: [
            PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_WRITE,
            PERMISSIONS.THIRD_PARTIES_READ,
            PERMISSIONS.PRODUCTS_READ
        ]
    }
}
