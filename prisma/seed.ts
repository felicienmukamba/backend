import { PrismaClient, AccountType, JournalType, ThirdPartyType, ProductType, InvoiceType, InvoiceStatus, PurchaseOrderStatus, PaymentMethod, EntryStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ROLES, PERMISSIONS } from '../src/modules/auth/permissions';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Milele SaaS Master Seed...');

    // 1. CLEAR DATA (Safely using TRUNCATE CASCADE for PostgreSQL)

    const tables = [
        'StockMovement', 'InvoiceLine', 'Invoice', 'Payment', 'BudgetLine', 'Budget',
        'PayrollPeriod', 'Employee', 'AuditLog', 'User', 'Role', 'FiscalYear',
        'Journal', 'Product', 'ThirdParty', 'Account', 'Tax', 'Branch', 'Company',
        'AccountingEntry', 'EntryLine', 'Department', 'CostCenter', 'PurchaseOrder',
        'PurchaseOrderLine', 'StockReception', 'Leave', 'Attendance', 'Training',
        'TrainingDomain', 'TrainingParticipation', 'Payslip', 'PayslipLine',
        'CreditNote', 'DefTransmission', 'ElectronicFiscalDevice'
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
        } catch (e) {
            // Ignore errors for tables that don't exist
        }
    }

    console.log('🗑️  Database cleared meticulously.');

    // 2. CREATE SYSTEM COMPANY (Internal)
    const systemCompany = await prisma.company.create({
        data: {
            companyName: 'MILELE SYSTEMS ®',
            taxId: 'MILELE-PLATFORM-001',
            nationalId: 'MILELE-HQ-001',
            rccm: 'CD/PLATFORM/SAAS/2026',
            headquartersAddress: 'Digital Center, Gombe, Kinshasa',
            phone: '+243900000000',
            email: 'admin@milele.com',
            taxRegime: 'REEL',
            taxCenter: 'DGE',
            isActive: true,
        }
    });

    const systemBranch = await prisma.branch.create({
        data: {
            name: 'Siège Plateforme',
            code: 'MILELE-HQ',
            isMain: true,
            isActive: true,
            companyId: systemCompany.id
        }
    });

    // 3. CREATE PLATFORM ROLES
    const saasAdminRole = await prisma.role.create({
        data: {
            code: 'SAAS_SUPER_ADMIN',
            label: 'Super-Administrateur Plateforme',
            permissions: JSON.stringify(['*']),
            companyId: systemCompany.id,
            branchId: systemBranch.id
        }
    });

    const saasManagerRole = await prisma.role.create({
        data: {
            code: 'SAAS_MANAGER',
            label: 'Gestionnaire de Plateforme',
            permissions: JSON.stringify([
                'platform:companies:read',
                'platform:companies:write',
                'platform:companies:activate',
                'platform:companies:deactivate',
                'platform:stats:read'
            ]),
            companyId: systemCompany.id,
            branchId: systemBranch.id
        }
    });

    // 4. CREATE MASTER SUPER ADMINS
    const passwordHash = await bcrypt.hash('password123', 12);

    // Master Global Admin
    await prisma.user.create({
        data: {
            firstName: 'Top',
            lastName: 'Administrator',
            email: 'admin@milele.app',
            username: 'superadmin',
            passwordHash: passwordHash,
            roles: { connect: { id: saasAdminRole.id } },
            companyId: systemCompany.id,
            branchId: systemBranch.id,
            isActive: true,
            isSaaSAdmin: true,
            twoFactorRecoveryCodes: '[]',
        }
    });

    // Platform Manager
    await prisma.user.create({
        data: {
            firstName: 'Manager',
            lastName: 'Plateforme',
            email: 'manager@milele.app',
            username: 'saas.manager',
            passwordHash: passwordHash,
            roles: { connect: { id: saasManagerRole.id } },
            companyId: systemCompany.id,
            branchId: systemBranch.id,
            isActive: true,
            isSaaSAdmin: true,
            twoFactorRecoveryCodes: '[]',
        }
    });

    console.log('✅ SaaS Admin users created:');
    console.log('   - superadmin / password123 (Global)');
    console.log('   - saas.manager / password123 (Activations & Control)');

    // 5. SEED DEMO CLIENT (Active Tenant)
    await seedCompanyData({
        name: 'Entreprise de Démonstration SIGCF',
        taxId: '000-000-000',
        email: 'contact@demo-sigcf.com',
        isActive: true
    });

    // 6. SEED PENDING CLIENTS
    await seedCompanyData({
        name: 'Kivu Mining SARL',
        taxId: 'KIV-999-555',
        email: 'billing@kivu-mining.cd',
        isActive: false
    });

    await seedCompanyData({
        name: 'Trans-Sahara Logistics',
        taxId: 'LOG-444-222',
        email: 'ops@trans-sahara.com',
        isActive: false
    });

    console.log('🏁 Seeding finished successfully.');
}

async function seedCompanyData(config: { name: string, taxId: string, email: string, isActive: boolean }) {
    console.log(`\n📦 Seeding Tenant: ${config.name}...`);

    const company = await prisma.company.create({
        data: {
            companyName: config.name,
            taxId: config.taxId,
            nationalId: `NAT-${config.taxId}`,
            rccm: 'CD/KNG/RCCM/24-B-XXXX',
            headquartersAddress: 'Kinshasa, RDC',
            phone: '+243000000000',
            email: config.email,
            taxRegime: 'REEL',
            taxCenter: 'DGE',
            isActive: config.isActive,
        }
    });

    const branch = await prisma.branch.create({
        data: {
            name: 'Siège Social',
            code: 'HQ-01',
            isMain: true,
            isActive: config.isActive,
            companyId: company.id
        }
    });

    // Create a second branch for testing
    const branch2 = await prisma.branch.create({
        data: {
            name: 'Succursale Gombe',
            code: 'BR-02',
            isMain: false,
            isActive: config.isActive,
            companyId: company.id,
            address: 'Avenue de la République, Gombe',
            city: 'Kinshasa'
        }
    });

    // Create ALL roles from DEFAULT_ROLES
    const roles: Record<string, any> = {};

    for (const [roleKey, roleData] of Object.entries(DEFAULT_ROLES)) {
        const role = await prisma.role.create({
            data: {
                code: roleKey,
                label: roleData.label,
                permissions: JSON.stringify(roleData.permissions),
                companyId: company.id,
                branchId: branch.id
            }
        });
        roles[roleKey] = role;
    }

    // Create additional company-specific roles
    const additionalRoles = {
        VENDEUR: {
            code: 'VENDEUR',
            label: 'Vendeur',
            permissions: [
                PERMISSIONS.PRODUCTS_READ,
                PERMISSIONS.INVOICES_READ,
                PERMISSIONS.INVOICES_WRITE,
                PERMISSIONS.THIRD_PARTIES_READ
            ]
        },
        MAGASINIER: {
            code: 'MAGASINIER',
            label: 'Magasinier',
            permissions: [
                PERMISSIONS.PRODUCTS_READ,
                PERMISSIONS.PRODUCTS_WRITE
            ]
        }
    };

    for (const [roleKey, roleData] of Object.entries(additionalRoles)) {
        const role = await prisma.role.create({
            data: {
                code: roleKey,
                label: roleData.label,
                permissions: JSON.stringify(roleData.permissions),
                companyId: company.id,
                branchId: branch.id
            }
        });
        roles[roleKey] = role;
    }

    const passwordHash = await bcrypt.hash('password123', 12);

    // Create multiple users with different roles
    const users = {
        admin: await prisma.user.create({
            data: {
                firstName: 'Admin',
                lastName: config.name.split(' ')[0],
                email: config.email,
                username: config.email.split('@')[0],
                passwordHash: passwordHash,
                roles: { connect: { id: roles.ADMIN_COMPANY.id } },
                companyId: company.id,
                branchId: branch.id,
                isActive: true,
                isSaaSAdmin: false,
                twoFactorRecoveryCodes: '[]',
            }
        }),
        comptable: await prisma.user.create({
            data: {
                firstName: 'Jean',
                lastName: 'Comptable',
                email: `comptable@${config.email.split('@')[1]}`,
                username: `comptable.${config.email.split('@')[0]}`,
                passwordHash: passwordHash,
                roles: { connect: { id: roles.COMPTABLE.id } },
                companyId: company.id,
                branchId: branch.id,
                isActive: true,
                isSaaSAdmin: false,
                twoFactorRecoveryCodes: '[]',
            }
        }),
        directeur: await prisma.user.create({
            data: {
                firstName: 'Marie',
                lastName: 'Directrice',
                email: `directeur@${config.email.split('@')[1]}`,
                username: `directeur.${config.email.split('@')[0]}`,
                passwordHash: passwordHash,
                roles: { connect: { id: roles.DIRECTEUR_FINANCIER.id } },
                companyId: company.id,
                branchId: branch.id,
                isActive: true,
                isSaaSAdmin: false,
                twoFactorRecoveryCodes: '[]',
            }
        }),
        rh: await prisma.user.create({
            data: {
                firstName: 'Paul',
                lastName: 'RH',
                email: `rh@${config.email.split('@')[1]}`,
                username: `rh.${config.email.split('@')[0]}`,
                passwordHash: passwordHash,
                roles: { connect: { id: roles.RH.id } },
                companyId: company.id,
                branchId: branch.id,
                isActive: true,
                isSaaSAdmin: false,
                twoFactorRecoveryCodes: '[]',
            }
        }),
        caissier: await prisma.user.create({
            data: {
                firstName: 'Sophie',
                lastName: 'Caissière',
                email: `caissier@${config.email.split('@')[1]}`,
                username: `caissier.${config.email.split('@')[0]}`,
                passwordHash: passwordHash,
                roles: { connect: { id: roles.CAISSIER.id } },
                companyId: company.id,
                branchId: branch.id,
                isActive: true,
                isSaaSAdmin: false,
                twoFactorRecoveryCodes: '[]',
            }
        }),
        gerant: await prisma.user.create({
            data: {
                firstName: 'Pierre',
                lastName: 'Gérant',
                email: `gerant@${config.email.split('@')[1]}`,
                username: `gerant.${config.email.split('@')[0]}`,
                passwordHash: passwordHash,
                roles: { connect: { id: roles.GERANT.id } },
                companyId: company.id,
                branchId: branch2.id,
                isActive: true,
                isSaaSAdmin: false,
                twoFactorRecoveryCodes: '[]',
            }
        })
    };

    console.log(`✅ Created ${Object.keys(users).length} users with different roles`);

    // 3. Create OHADA Accounts (Inlined)
    const STANDARD_JOURNALS = [
        { code: 'VT', label: 'Ventes', type: 'SALE' },
        { code: 'HA', label: 'Achats', type: 'PURCHASE' },
        { code: 'BQ', label: 'Banque', type: 'BANK' },
        { code: 'CA', label: 'Caisse', type: 'CASH' },
        { code: 'OD', label: 'Divers', type: 'OD' },
        { code: 'PA', label: 'Paie', type: 'PAYROLL' },
        { code: 'ST', label: 'Stocks', type: 'STOCK' },
    ];

    // Ensure we can access AccountType via Prisma or import it if needed
    // Assuming AccountType is imported at top of file

    const OHADA_ACCOUNTS = [
        { number: '101', label: 'Capital social', class: 1, type: AccountType.LIABILITY },
        { number: '1011', label: 'Capital social souscrit, non appelé', class: 1, type: AccountType.LIABILITY },
        { number: '1012', label: 'Capital social souscrit, appelé, non versé', class: 1, type: AccountType.LIABILITY },
        { number: '1013', label: 'Capital social souscrit, appelé, versé, non amorti', class: 1, type: AccountType.LIABILITY },
        { number: '111', label: 'Réserves légales', class: 1, type: AccountType.LIABILITY },
        { number: '112', label: 'Réserves statutaires ou contractuelles', class: 1, type: AccountType.LIABILITY },
        { number: '118', label: 'Autres réserves', class: 1, type: AccountType.LIABILITY },
        { number: '121', label: 'Report à nouveau créditeur', class: 1, type: AccountType.LIABILITY },
        { number: '129', label: 'Report à nouveau débiteur', class: 1, type: AccountType.LIABILITY, normalBalance: 'DEBIT' },
        { number: '131', label: 'Résultat net : Bénéfice', class: 1, type: AccountType.LIABILITY },
        { number: '139', label: 'Résultat net : Perte', class: 1, type: AccountType.LIABILITY, normalBalance: 'DEBIT' },
        { number: '161', label: 'Emprunts obligataires', class: 1, type: AccountType.LIABILITY },
        { number: '162', label: 'Emprunts et dettes auprès des établissements de crédit', class: 1, type: AccountType.LIABILITY },

        // CLASSE 2 : COMPTES D'ACTIF IMMOBILISE
        { number: '211', label: 'Frais de développement', class: 2, type: AccountType.ASSET },
        { number: '212', label: 'Brevets, licences, concessions, marques', class: 2, type: AccountType.ASSET },
        { number: '213', label: 'Logiciels', class: 2, type: AccountType.ASSET },
        { number: '221', label: 'Terrains', class: 2, type: AccountType.ASSET },
        { number: '231', label: 'Bâtiments industriels, agricoles, administratifs', class: 2, type: AccountType.ASSET },
        { number: '241', label: 'Matériel et outillage industriel', class: 2, type: AccountType.ASSET },
        { number: '244', label: 'Matériel de bureau et matériel informatique', class: 2, type: AccountType.ASSET },
        { number: '245', label: 'Matériel de transport', class: 2, type: AccountType.ASSET },
        { number: '281', label: 'Amortissements des immobilisations incorporelles', class: 2, type: AccountType.ASSET, normalBalance: 'CREDIT' },
        { number: '283', label: 'Amortissements des immobilisations corporelles', class: 2, type: AccountType.ASSET, normalBalance: 'CREDIT' },
        { number: '284', label: 'Amortissements du matériel de bureau', class: 2, type: AccountType.ASSET, normalBalance: 'CREDIT' },

        // CLASSE 3 : COMPTES DE STOCKS
        { number: '311', label: 'Marchandises A', class: 3, type: AccountType.ASSET },
        { number: '312', label: 'Marchandises B', class: 3, type: AccountType.ASSET },
        { number: '321', label: 'Matières premières', class: 3, type: AccountType.ASSET },
        { number: '322', label: 'Fournitures consommables', class: 3, type: AccountType.ASSET },
        { number: '331', label: 'Produits en cours', class: 3, type: AccountType.ASSET },
        { number: '361', label: 'Produits finis', class: 3, type: AccountType.ASSET },
        { number: '381', label: 'Marchandises en cours de route', class: 3, type: AccountType.ASSET },

        // CLASSE 4 : COMPTES DE TIERS
        { number: '401', label: 'Fournisseurs, dettes en compte', class: 4, type: AccountType.LIABILITY },
        { number: '4011', label: 'Fournisseurs - Achats de biens et prestations de services', class: 4, type: AccountType.LIABILITY },
        { number: '402', label: 'Fournisseurs, Effets à payer', class: 4, type: AccountType.LIABILITY },
        { number: '408', label: 'Fournisseurs, factures non parvenues', class: 4, type: AccountType.LIABILITY },
        { number: '409', label: 'Fournisseurs, débiteurs', class: 4, type: AccountType.LIABILITY, normalBalance: 'DEBIT' },
        { number: '411', label: 'Clients', class: 4, type: AccountType.ASSET },
        { number: '4111', label: 'Clients - Ventes de biens et prestations de services', class: 4, type: AccountType.ASSET },
        { number: '412', label: 'Clients, Effets à recevoir', class: 4, type: AccountType.ASSET },
        { number: '416', label: 'Créances douteuses ou litigieuses', class: 4, type: AccountType.ASSET },
        { number: '418', label: 'Clients, produits à recevoir', class: 4, type: AccountType.ASSET },
        { number: '419', label: 'Clients, créditeurs', class: 4, type: AccountType.ASSET, normalBalance: 'CREDIT' },
        { number: '421', label: 'Personnel, rémunérations dues', class: 4, type: AccountType.LIABILITY },
        { number: '422', label: 'Personnel, rémunérations dues (Dirigeants)', class: 4, type: AccountType.LIABILITY },
        { number: '431', label: 'Sécurité sociale (CNSS)', class: 4, type: AccountType.LIABILITY },
        { number: '441', label: 'État, impôt sur les bénéfices', class: 4, type: AccountType.LIABILITY },
        { number: '442', label: 'État, autres impôts et taxes', class: 4, type: AccountType.LIABILITY },
        { number: '443', label: 'État, TVA facturée', class: 4, type: AccountType.LIABILITY },
        { number: '444', label: 'État, TVA due ou crédit de TVA', class: 4, type: AccountType.LIABILITY },
        { number: '445', label: 'État, TVA récupérable', class: 4, type: AccountType.ASSET },
        { number: '471', label: 'Débiteurs divers', class: 4, type: AccountType.ASSET },
        { number: '472', label: 'Créditeurs divers', class: 4, type: AccountType.LIABILITY },

        // CLASSE 5 : COMPTES DE TRESORERIE
        { number: '501', label: 'Titres de placement', class: 5, type: AccountType.ASSET },
        { number: '511', label: 'Effets à encaisser', class: 5, type: AccountType.ASSET },
        { number: '512', label: 'Effets à l\'encaissement', class: 5, type: AccountType.ASSET },
        { number: '521', label: 'Banques locales', class: 5, type: AccountType.ASSET },
        { number: '531', label: 'Chèques postaux', class: 5, type: AccountType.ASSET },
        { number: '561', label: 'Banques, crédits de trésorerie', class: 5, type: AccountType.LIABILITY },
        { number: '571', label: 'Caisse monnaie nationale', class: 5, type: AccountType.ASSET },
        { number: '572', label: 'Caisse devises', class: 5, type: AccountType.ASSET },
        { number: '581', label: 'Virements de fonds', class: 5, type: AccountType.ASSET },

        // CLASSE 6 : COMPTES DE CHARGES
        { number: '601', label: 'Achats de marchandises', class: 6, type: AccountType.EXPENSE },
        { number: '602', label: 'Achats de matières premières', class: 6, type: AccountType.EXPENSE },
        { number: '603', label: 'Variation de stocks', class: 6, type: AccountType.EXPENSE, normalBalance: 'DEBIT' }, // Peut être créditeur
        { number: '604', label: 'Achats stockés de matières et fournitures', class: 6, type: AccountType.EXPENSE },
        { number: '605', label: 'Autres achats', class: 6, type: AccountType.EXPENSE },
        { number: '606', label: 'Achats non stockés de matières et fournitures', class: 6, type: AccountType.EXPENSE },
        { number: '608', label: 'Achats de fournitures de bureau', class: 6, type: AccountType.EXPENSE },
        { number: '611', label: 'Transport sur achats', class: 6, type: AccountType.EXPENSE },
        { number: '612', label: 'Transport sur ventes', class: 6, type: AccountType.EXPENSE },
        { number: '621', label: 'Sous-traitance générale', class: 6, type: AccountType.EXPENSE },
        { number: '622', label: 'Locations et charges locatives', class: 6, type: AccountType.EXPENSE },
        { number: '623', label: 'Redevances pour brevets, licences', class: 6, type: AccountType.EXPENSE },
        { number: '624', label: 'Entretien, réparations et maintenance', class: 6, type: AccountType.EXPENSE },
        { number: '625', label: 'Primes d\'assurances', class: 6, type: AccountType.EXPENSE },
        { number: '626', label: 'Etudes, recherches et documentation', class: 6, type: AccountType.EXPENSE },
        { number: '627', label: 'Publicité, publications, relations publiques', class: 6, type: AccountType.EXPENSE },
        { number: '628', label: 'Frais de télécommunications', class: 6, type: AccountType.EXPENSE },
        { number: '631', label: 'Frais bancaires', class: 6, type: AccountType.EXPENSE },
        { number: '632', label: 'Rémunérations d\'intermédiaires et honoraires', class: 6, type: AccountType.EXPENSE },
        { number: '641', label: 'Rémunérations du personnel', class: 6, type: AccountType.EXPENSE },
        { number: '646', label: 'Cotisations sociales (Part patronale)', class: 6, type: AccountType.EXPENSE },
        { number: '651', label: 'Impôts et taxes directs', class: 6, type: AccountType.EXPENSE },
        { number: '654', label: 'Autres impôts et taxes', class: 6, type: AccountType.EXPENSE },
        { number: '661', label: 'Charges d\'intérêts', class: 6, type: AccountType.EXPENSE },
        { number: '662', label: 'Escomptes accordés', class: 6, type: AccountType.EXPENSE },
        { number: '663', label: 'Pertes de change', class: 6, type: AccountType.EXPENSE },
        { number: '671', label: 'Dotations aux amortissements d\'exploitation', class: 6, type: AccountType.EXPENSE },
        { number: '681', label: 'Dotations aux provisions d\'exploitation', class: 6, type: AccountType.EXPENSE },
        { number: '691', label: 'Impôt sur le résultat', class: 6, type: AccountType.EXPENSE },

        // CLASSE 7 : COMPTES DE PRODUITS
        { number: '701', label: 'Ventes de marchandises', class: 7, type: AccountType.REVENUE },
        { number: '702', label: 'Ventes de produits finis', class: 7, type: AccountType.REVENUE },
        { number: '703', label: 'Ventes de produits intermédiaires', class: 7, type: AccountType.REVENUE },
        { number: '704', label: 'Ventes de produits résiduels', class: 7, type: AccountType.REVENUE },
        { number: '705', label: 'Travaux facturés', class: 7, type: AccountType.REVENUE },
        { number: '706', label: 'Services vendus', class: 7, type: AccountType.REVENUE },
        { number: '707', label: 'Produits accessoires', class: 7, type: AccountType.REVENUE },
        { number: '711', label: 'Variation des stocks de marchandises', class: 7, type: AccountType.REVENUE, normalBalance: 'CREDIT' }, // Peut être débiteur
        { number: '712', label: 'Variation des stocks de matières premières', class: 7, type: AccountType.REVENUE },
        { number: '721', label: 'Production immobilisée', class: 7, type: AccountType.REVENUE },
        { number: '731', label: 'Subventions d\'exploitation', class: 7, type: AccountType.REVENUE },
        { number: '752', label: 'Reprises sur amortissements', class: 7, type: AccountType.REVENUE },
        { number: '754', label: 'Autres produits de gestion courante', class: 7, type: AccountType.REVENUE },
        { number: '771', label: 'Intérêts créditeurs', class: 7, type: AccountType.REVENUE },
        { number: '772', label: 'Escomptes obtenus', class: 7, type: AccountType.REVENUE },
        { number: '776', label: 'Gains de change', class: 7, type: AccountType.REVENUE },

        // CLASSE 8 : COMPTES DES AUTRES CHARGES ET DES AUTRES PRODUITS (HAO)
        { number: '81', label: 'Valeurs comptables des cessions d\'immobilisations', class: 8, type: AccountType.EXPENSE },
        { number: '82', label: 'Produits des cessions d\'immobilisations', class: 8, type: AccountType.REVENUE },
        { number: '83', label: 'Charges Hors Activités Ordinaires', class: 8, type: AccountType.EXPENSE },
        { number: '84', label: 'Produits Hors Activités Ordinaires', class: 8, type: AccountType.REVENUE },
    ];
    console.log(`📚 Seeding ${OHADA_ACCOUNTS.length} OHADA Accounts...`);

    const accountMap: Record<string, any> = {};
    const sortedAccounts = [...OHADA_ACCOUNTS].sort((a, b) => a.number.length - b.number.length);

    for (const acc of sortedAccounts) {
        let parentId: number | null = null;
        if (acc.number.length > 2) {
            const parentNum = acc.number.substring(0, acc.number.length - 1);
            if (accountMap[parentNum]) {
                parentId = accountMap[parentNum].id;
            }
        }

        const account = await prisma.account.create({
            data: {
                accountNumber: acc.number,
                label: acc.label,
                accountClass: acc.class,
                type: acc.type,
                level: acc.number.length,
                normalBalance: acc.normalBalance || ((acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) ? 'DEBIT' : 'CREDIT'),
                companyId: company.id,
                parentAccountId: parentId
            }
        });
        accountMap[acc.number] = account;
    }

    // Journals
    const journalMap: Record<string, any> = {};
    for (const j of STANDARD_JOURNALS) {
        const journal = await prisma.journal.create({
            data: { ...j, companyId: company.id, branchId: branch.id, type: j.type as JournalType } // Cast type
        });
        journalMap[j.code] = journal;
    }

    // Fiscal Years
    // 2025 (Closed)
    await prisma.fiscalYear.create({
        data: {
            code: '2025',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-12-31'),
            companyId: company.id,
            isClosed: true
        }
    });

    // 2026 (Active)
    const fiscalYear = await prisma.fiscalYear.create({
        data: {
            code: '2026',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            companyId: company.id,
            isClosed: false
        }
    });

    // Departments
    const departments = {
        finance: await prisma.department.create({
            data: {
                name: 'Direction Financière',
                description: 'Gestion financière et comptable',
                companyId: company.id,
                branchId: branch.id
            }
        }),
        rh: await prisma.department.create({
            data: {
                name: 'Ressources Humaines',
                description: 'Gestion du personnel',
                companyId: company.id,
                branchId: branch.id
            }
        }),
        commercial: await prisma.department.create({
            data: {
                name: 'Commercial',
                description: 'Ventes et relations clients',
                companyId: company.id,
                branchId: branch2.id
            }
        })
    };

    // Employees
    const employees = {
        comptable: await prisma.employee.create({
            data: {
                firstName: 'Jean',
                lastName: 'Comptable',
                email: `jean.comptable@${config.email.split('@')[1]}`,
                phone: '+243900000001',
                jobTitle: 'Comptable Principal',
                hireDate: new Date('2025-01-15'),
                baseSalary: 1500,
                taxDependents: 2,
                cnssNumber: 'CNSS-001',
                tinNumber: 'TIN-001',
                isActive: true,
                companyId: company.id,
                departmentId: departments.finance.id,
                branchId: branch.id
            }
        }),
        rh: await prisma.employee.create({
            data: {
                firstName: 'Paul',
                lastName: 'RH',
                email: `paul.rh@${config.email.split('@')[1]}`,
                phone: '+243900000002',
                jobTitle: 'Responsable RH',
                hireDate: new Date('2025-02-01'),
                baseSalary: 1800,
                taxDependents: 3,
                cnssNumber: 'CNSS-002',
                tinNumber: 'TIN-002',
                isActive: true,
                companyId: company.id,
                departmentId: departments.rh.id,
                branchId: branch.id
            }
        }),
        vendeur: await prisma.employee.create({
            data: {
                firstName: 'Marc',
                lastName: 'Vendeur',
                email: `marc.vendeur@${config.email.split('@')[1]}`,
                phone: '+243900000003',
                jobTitle: 'Commercial',
                hireDate: new Date('2025-03-01'),
                baseSalary: 1200,
                taxDependents: 1,
                cnssNumber: 'CNSS-003',
                tinNumber: 'TIN-003',
                isActive: true,
                companyId: company.id,
                departmentId: departments.commercial.id,
                branchId: branch2.id
            }
        })
    };

    // Cost Centers
    const costCenters = {
        principal: await prisma.costCenter.create({
            data: {
                code: 'CC-001',
                name: 'Centre Principal',
                type: 'PRINCIPAL',
                isActive: true,
                companyId: company.id
            }
        }),
        commercial: await prisma.costCenter.create({
            data: {
                code: 'CC-002',
                name: 'Centre Commercial',
                type: 'ANALYTICAL',
                isActive: true,
                companyId: company.id,
                parentCostCenterId: (await prisma.costCenter.findFirst({ where: { code: 'CC-001', companyId: company.id } }))?.id
            }
        })
    };

    // Products & Inventory
    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: 'Ordinateur Portable Pro',
                sku: 'LAP-001',
                salesPriceExclTax: 1200,
                purchasePriceExclTax: 800,
                type: 'GOODS',
                currentStock: 50,
                alertStock: 10,
                companyId: company.id,
                branchId: branch.id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Support Technique/Heure',
                sku: 'SRV-001',
                salesPriceExclTax: 50,
                purchasePriceExclTax: 0,
                type: 'SERVICE',
                currentStock: 0,
                companyId: company.id,
                branchId: branch.id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Imprimante Multifonction',
                sku: 'PRT-001',
                salesPriceExclTax: 450,
                purchasePriceExclTax: 300,
                type: 'GOODS',
                currentStock: 25,
                alertStock: 5,
                companyId: company.id,
                branchId: branch2.id
            }
        })
    ]);

    // Third Parties
    const clients = [
        await prisma.thirdParty.create({
            data: {
                name: 'Banque Centrale du Congo',
                type: 'CUSTOMER',
                email: 'fin@bcc.cd',
                taxId: 'NIF-BCC-2026',
                address: 'Avenue Colonel Tshatshi, Kinshasa',
                phone: '+243900000100',
                isVatSubject: true,
                companyId: company.id,
                branchId: branch.id
            }
        }),
        await prisma.thirdParty.create({
            data: {
                name: 'Entreprise Générale de Commerce',
                type: 'CUSTOMER',
                email: 'contact@egc.cd',
                taxId: 'NIF-EGC-2026',
                address: 'Gombe, Kinshasa',
                phone: '+243900000101',
                isVatSubject: true,
                creditLimit: 50000,
                companyId: company.id,
                branchId: branch.id
            }
        })
    ];

    const suppliers = [
        await prisma.thirdParty.create({
            data: {
                name: 'Fournisseur Tech SARL',
                type: 'SUPPLIER',
                email: 'ventes@techsupplier.cd',
                taxId: 'NIF-TECH-2026',
                address: 'Lingwala, Kinshasa',
                phone: '+243900000200',
                isVatSubject: true,
                companyId: company.id,
                branchId: branch.id
            }
        })
    ];

    // Taxes
    const taxes = {
        tva16: await prisma.tax.create({
            data: {
                label: 'TVA 16%',
                code: 'TVA16',
                rate: 16,
                isDeductible: false,
                companyId: company.id,
                branchId: branch.id
            }
        }),
        tva0: await prisma.tax.create({
            data: {
                label: 'TVA 0%',
                code: 'TVA0',
                rate: 0,
                isDeductible: false,
                companyId: company.id,
                branchId: branch.id
            }
        })
    };

    // Budget
    const budget = await prisma.budget.create({
        data: {
            name: 'Budget Annuel 2026',
            description: 'Budget annuel pour l\'année 2026',
            fiscalYearId: fiscalYear.id,
            companyId: company.id,
            branchId: branch.id
        }
    });

    // Budget Lines
    await prisma.budgetLine.createMany({
        data: [
            {
                forecastAmount: 100000,
                realizedAmount: 0,
                accountId: accountMap['701'].id,
                budgetId: budget.id,
                companyId: company.id,
                branchId: branch.id
            },
            {
                forecastAmount: 50000,
                realizedAmount: 0,
                accountId: accountMap['601'].id,
                budgetId: budget.id,
                companyId: company.id,
                branchId: branch.id
            }
        ]
    });

    // Purchase Order
    const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
            orderNumber: `CMD-2026-C${company.id.toString().padStart(3, '0')}-001`,
            orderDate: new Date('2026-01-15'),
            expectedDate: new Date('2026-01-30'),
            status: 'SENT',
            totalAmount: 8000,
            currency: 'USD',
            notes: 'Commande urgente',
            supplierId: suppliers[0].id,
            companyId: company.id,
            branchId: branch.id
        }
    });

    await prisma.purchaseOrderLine.createMany({
        data: [
            {
                quantity: 10,
                unitPrice: 800,
                receivedQuantity: 0,
                productId: products[0].id,
                purchaseOrderId: purchaseOrder.id,
                description: 'Commande Ordinateurs Portables'
            }
        ]
    });

    // Stock Reception
    const stockReception = await prisma.stockReception.create({
        data: {
            receptionNumber: `REC-2026-C${company.id.toString().padStart(3, '0')}-001`,
            receptionDate: new Date('2026-01-25'),
            purchaseOrderId: purchaseOrder.id,
            supplierId: suppliers[0].id,
            documentReference: 'BL-001',
            notes: 'Réception complète',
            companyId: company.id,
            branchId: branch.id
        }
    });

    // Stock Movements
    await prisma.stockMovement.createMany({
        data: [
            {
                movementDate: new Date('2026-01-25'),
                type: 'IN',
                quantity: 10,
                weightedAverageCost: 800,
                productId: products[0].id,
                stockReceptionId: stockReception.id,
                thirdPartyId: suppliers[0].id,
                documentReference: 'REC-2026-0001',
                reason: 'Réception commande CMD-2026-0001',
                companyId: company.id,
                branchId: branch.id
            }
        ]
    });

    // Generate a Validated Invoice with Accounting Entry
    const invDate = new Date('2026-02-01');
    const invoice = await prisma.invoice.create({
        data: {
            invoiceNumber: 'FAC-2026-0001',
            issuedAt: invDate,
            issuedTime: '10:00:00',
            currency: 'USD',
            exchangeRate: 2800,
            type: 'NORMAL',
            totalAmountExclTax: 1200,
            totalVAT: 192,
            totalAmountInclTax: 1392,
            status: 'VALIDATED',
            clientId: clients[0].id,
            createdById: users.admin.id,
            companyId: company.id,
            branchId: branch.id,
            sellerLegalName: company.companyName,
            sellerNif: company.taxId,
            invoiceLines: {
                create: {
                    productId: products[0].id,
                    quantity: 1,
                    unitPrice: 1200,
                    netAmountExclTax: 1200,
                    vatAmount: 192,
                    totalAmountInclTax: 1392,
                    taxId: taxes.tva16.id,
                    companyId: company.id,
                    description: 'Vente Ordinateur Portable Pro'
                }
            }
        }
    });

    // Automatic Accounting Entry for Invoice
    const entry = await prisma.accountingEntry.create({
        data: {
            referenceNumber: 'FAC-2026-0001',
            entryDate: invDate,
            description: `Vente Client: ${clients[0].name}`,
            status: 'VALIDATED',
            journalId: journalMap['VT'].id,
            fiscalYearId: fiscalYear.id,
            invoiceId: invoice.id,
            companyId: company.id,
            branchId: branch.id,
            createdById: users.comptable.id,
            currency: 'USD',
            exchangeRate: 2800
        }
    });

    await prisma.entryLine.createMany({
        data: [
            {
                debit: 1392,
                credit: 0,
                debitLocal: 1392 * 2800,
                creditLocal: 0,
                accountId: accountMap['411'].id,
                entryId: entry.id,
                companyId: company.id,
                thirdPartyId: clients[0].id,
                description: `Débit Client ${clients[0].name}`
            },
            {
                debit: 0,
                credit: 1200,
                debitLocal: 0,
                creditLocal: 1200 * 2800,
                accountId: accountMap['701'].id,
                entryId: entry.id,
                companyId: company.id,
                description: 'Vente HT'
            },
            {
                debit: 0,
                credit: 192,
                debitLocal: 0,
                creditLocal: 192 * 2800,
                accountId: accountMap['443'].id,
                entryId: entry.id,
                companyId: company.id,
                description: 'TVA Collectée 16%'
            },
        ]
    });

    // Add a Payment
    const payment = await prisma.payment.create({
        data: {
            amountPaid: 1392,
            paidAt: invDate,
            method: 'BANK_TRANSFER',
            invoiceId: invoice.id,
            companyId: company.id,
            branchId: branch.id
        }
    });

    // Accounting Entry for Payment
    const pEntry = await prisma.accountingEntry.create({
        data: {
            referenceNumber: `PAY-${payment.id}`,
            entryDate: invDate,
            description: `Paiement Facture FAC-2026-0001`,
            status: 'VALIDATED',
            journalId: journalMap['BQ'].id,
            fiscalYearId: fiscalYear.id,
            paymentId: payment.id,
            companyId: company.id,
            branchId: branch.id,
            createdById: users.comptable.id,
            currency: 'USD',
            exchangeRate: 2800
        }
    });

    await prisma.entryLine.createMany({
        data: [
            {
                debit: 1392,
                credit: 0,
                debitLocal: 1392 * 2800,
                creditLocal: 0,
                accountId: accountMap['521'].id,
                entryId: pEntry.id,
                companyId: company.id,
                description: 'Encaissement Banque'
            },
            {
                debit: 0,
                credit: 1392,
                debitLocal: 0,
                creditLocal: 1392 * 2800,
                accountId: accountMap['411'].id,
                entryId: pEntry.id,
                companyId: company.id,
                thirdPartyId: clients[0].id,
                description: 'Lettrage Client'
            },
        ]
    });

    // Create a second invoice (partially paid)
    const invoice2 = await prisma.invoice.create({
        data: {
            invoiceNumber: 'FAC-2026-0002',
            issuedAt: new Date('2026-02-05'),
            issuedTime: '14:30:00',
            currency: 'USD',
            exchangeRate: 2800,
            type: 'NORMAL',
            totalAmountExclTax: 2400,
            totalVAT: 384,
            totalAmountInclTax: 2784,
            status: 'PARTIALLY_PAID',
            clientId: clients[1].id,
            createdById: users.gerant.id,
            companyId: company.id,
            branchId: branch2.id,
            sellerLegalName: company.companyName,
            sellerNif: company.taxId,
            invoiceLines: {
                create: [
                    {
                        productId: products[0].id,
                        quantity: 2,
                        unitPrice: 1200,
                        netAmountExclTax: 2400,
                        vatAmount: 384,
                        totalAmountInclTax: 2784,
                        taxId: taxes.tva16.id,
                        companyId: company.id,
                        description: 'Vente 2x Ordinateur Portable Pro'
                    }
                ]
            }
        }
    });

    // Partial payment
    await prisma.payment.create({
        data: {
            amountPaid: 1000,
            paidAt: new Date('2026-02-10'),
            method: 'CASH',
            invoiceId: invoice2.id,
            companyId: company.id,
            branchId: branch2.id
        }
    });

    // Leave request
    await prisma.leave.create({
        data: {
            date: new Date('2026-02-28'),
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-03-05'),
            reason: 'Congés annuels',
            status: 'PENDING',
            employeeId: employees.comptable.id,
            companyId: company.id,
            branchId: branch.id
        }
    });

    // Training Domain
    const trainingDomain = await prisma.trainingDomain.create({
        data: {
            name: 'Comptabilité OHADA',
            description: 'Formation sur le système comptable OHADA',
            companyId: company.id,
            branchId: branch.id
        }
    });

    // Training
    const training = await prisma.training.create({
        data: {
            name: 'Formation SYSCOHADA',
            description: 'Formation complète sur le plan comptable SYSCOHADA',
            numberHours: 24,
            companyId: company.id,
            branchId: branch.id
        }
    });

    // Training Participation
    await prisma.trainingParticipation.create({
        data: {
            employeeId: employees.comptable.id,
            trainingId: training.id,
            companyId: company.id,
            branchId: branch.id
        }
    });

    const budgetLinesCount = await prisma.budgetLine.count({ where: { budgetId: budget.id } });
    const entriesCount = await prisma.accountingEntry.count({ where: { companyId: company.id } });

    console.log(`✅ Tenant ${config.name} seeded with complete data:`);
    console.log(`   ✓ ${Object.keys(roles).length} roles created`);
    console.log(`   ✓ ${Object.keys(users).length} users created`);
    console.log(`   ✓ ${OHADA_ACCOUNTS.length} accounts created`);
    console.log(`   ✓ ${STANDARD_JOURNALS.length} journals created`);
    console.log(`   ✓ ${Object.keys(departments).length} departments created`);
    console.log(`   ✓ ${Object.keys(employees).length} employees created`);
    console.log(`   ✓ ${products.length} products created`);
    console.log(`   ✓ ${clients.length + suppliers.length} third parties created`);
    console.log(`   ✓ ${Object.keys(taxes).length} taxes created`);
    console.log(`   ✓ 2 invoices (1 paid, 1 partially paid)`);
    console.log(`   ✓ 1 purchase order with reception`);
    console.log(`   ✓ 1 budget with ${budgetLinesCount} lines`);
    console.log(`   ✓ ${entriesCount} accounting entries`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

