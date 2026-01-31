import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

export const createExtendedPrismaClient = (prisma: PrismaClient, cls: ClsService) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async findMany({ model, args, query }) {
                    if (model === 'Company' || model === 'Branch') {
                        return query(args);
                    }

                    const companyId = cls.get('companyId');
                    const branchId = cls.get('branchId');

                    if (companyId) {
                        args.where = { ...args.where, companyId };
                    }

                    // IF branchId is explicitly provided (not undefined and not null)
                    // Apply branch filtering.
                    // If branchId is null/undefined, it means Super Admin context (Global).
                    if (branchId !== undefined && branchId !== null) {
                        const sharedModels = ['Role', 'Account', 'FiscalYear', 'JournalType', 'InvoiceType', 'InvoiceStatus', 'PaymentMethod', 'AccountType', 'JournalType', 'EntryStatus', 'ThirdPartyType', 'ProductType', 'StockMovementType', 'PurchaseOrderStatus', 'DefType', 'DefStatus', 'TransmissionStatus'];
                        if (!sharedModels.includes(model)) {
                            args.where = { ...args.where, branchId };
                        }
                    }
                    return query(args);
                },
                async findFirst({ model, args, query }) {
                    if (model === 'Company' || model === 'Branch') return query(args);

                    const companyId = cls.get('companyId');
                    const branchId = cls.get('branchId');

                    if (companyId) {
                        args.where = { ...args.where, companyId };
                    }
                    if (branchId !== undefined && branchId !== null) {
                        const sharedModels = ['Role', 'Account', 'FiscalYear'];
                        if (!sharedModels.includes(model)) {
                            args.where = { ...args.where, branchId };
                        }
                    }
                    return query(args);
                },
                async findUnique({ model, args, query }) {
                    if (model === 'Company' || model === 'Branch') return query(args);

                    const companyId = cls.get('companyId');
                    const branchId = cls.get('branchId');

                    if (companyId) {
                        let where = { ...args.where };
                        const keys = Object.keys(where);
                        if (keys.length === 1 && typeof where[keys[0]] === 'object' && where[keys[0]] !== null) {
                            where = { ...where[keys[0]] };
                        }

                        const filter: any = { companyId };
                        const sharedModels = ['Role', 'Account', 'FiscalYear'];
                        if (branchId !== undefined && branchId !== null && !sharedModels.includes(model)) {
                            filter.branchId = branchId;
                        }

                        const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
                        const modelDelegate = (prisma as any)[modelKey];

                        if (modelDelegate && typeof modelDelegate.findFirst === 'function') {
                            return modelDelegate.findFirst({
                                where: { ...where, ...filter }
                            });
                        }

                        // Fallback to query if model mapping fails
                        return query(args);
                    }
                    return query(args);
                },
                async count({ model, args, query }) {
                    if (model === 'Company' || model === 'Branch') return query(args);

                    const companyId = cls.get('companyId');
                    const branchId = cls.get('branchId');

                    if (companyId) {
                        args.where = { ...args.where, companyId };
                    }
                    if (branchId !== undefined && branchId !== null) {
                        const sharedModels = ['Role', 'Account', 'FiscalYear'];
                        if (!sharedModels.includes(model)) {
                            args.where = { ...args.where, branchId };
                        }
                    }
                    return query(args);
                },

                async create({ model, args, query }) {
                    if (model === 'Company' || model === 'Branch') return query(args);

                    const companyId = cls.get('companyId');
                    const branchId = cls.get('branchId');

                    if (companyId) {
                        args.data = args.data || {};
                        if (!(args.data as any).companyId && !(args.data as any).company) {
                            (args.data as any).company = { connect: { id: Number(companyId) } };
                        }

                        if (branchId !== undefined && branchId !== null) {
                            const sharedModels = ['Role', 'Account', 'FiscalYear'];
                            if (!sharedModels.includes(model)) {
                                if (!(args.data as any).branchId && !(args.data as any).branch) {
                                    (args.data as any).branch = { connect: { id: Number(branchId) } };
                                }
                            }
                        }
                    }
                    return query(args);
                },
                async createMany({ model, args, query }) {
                    if (model === 'Company' || model === 'Branch') return query(args);

                    const companyId = cls.get('companyId');
                    const branchId = cls.get('branchId');

                    if (companyId) {
                        const sharedModels = ['Role', 'Account', 'FiscalYear'];
                        const hasBranch = branchId !== undefined && branchId !== null && !sharedModels.includes(model);

                        if (Array.isArray(args.data)) {
                            args.data.forEach((item: any) => {
                                item.companyId = companyId;
                                if (hasBranch) item.branchId = branchId;
                            });
                        } else if (args.data) {
                            (args.data as any).companyId = companyId;
                            if (hasBranch) (args.data as any).branchId = branchId;
                        }
                    }
                    return query(args);
                }
            },
        },
    });
};

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;
