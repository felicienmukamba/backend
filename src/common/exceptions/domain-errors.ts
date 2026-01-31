import { BusinessException } from './business.exception';

/**
 * Domain-specific business exceptions for the application
 * Each exception has a unique code for client-side handling and i18n
 */

// ========== Invoice Errors ==========

export class InvoiceNotFoundError extends BusinessException {
    constructor(id: number) {
        super('INVOICE_NOT_FOUND', `Invoice with ID ${id} not found`, 404, { invoiceId: id });
    }
}

export class InvoiceAlreadyValidatedError extends BusinessException {
    constructor(invoiceId: number) {
        super(
            'INVOICE_ALREADY_VALIDATED',
            `Invoice ${invoiceId} is already validated and cannot be modified`,
            400,
            { invoiceId },
        );
    }
}

export class InvoiceValidationRequiredError extends BusinessException {
    constructor(invoiceId: number) {
        super(
            'INVOICE_VALIDATION_REQUIRED',
            `Invoice ${invoiceId} must be validated before this operation`,
            400,
            { invoiceId },
        );
    }
}

// ========== Product/Stock Errors ==========

export class ProductNotFoundError extends BusinessException {
    constructor(id: number) {
        super('PRODUCT_NOT_FOUND', `Product with ID ${id} not found`, 404, { productId: id });
    }
}

export class InsufficientStockError extends BusinessException {
    constructor(productId: number, requested: number, available: number) {
        super(
            'INSUFFICIENT_STOCK',
            `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
            400,
            {
                productId,
                requested,
                available,
            },
        );
    }
}

// ========== Third Party Errors ==========

export class ThirdPartyNotFoundError extends BusinessException {
    constructor(id: number) {
        super('THIRD_PARTY_NOT_FOUND', `Third party with ID ${id} not found`, 404, { thirdPartyId: id });
    }
}

export class DuplicateTaxIdError extends BusinessException {
    constructor(taxId: string) {
        super('DUPLICATE_TAX_ID', `A third party with tax ID ${taxId} already exists`, 409, { taxId });
    }
}

// ========== Accounting Errors ==========

export class AccountNotFoundError extends BusinessException {
    constructor(accountNumber: string) {
        super('ACCOUNT_NOT_FOUND', `Account ${accountNumber} not found`, 404, { accountNumber });
    }
}

export class UnbalancedEntryError extends BusinessException {
    constructor(debitTotal: number, creditTotal: number) {
        super(
            'UNBALANCED_ENTRY',
            `Accounting entry is unbalanced. Debit: ${debitTotal}, Credit: ${creditTotal}`,
            400,
            {
                debitTotal,
                creditTotal,
                difference: Math.abs(debitTotal - creditTotal),
            },
        );
    }
}

export class FiscalYearClosedError extends BusinessException {
    constructor(fiscalYearCode: string) {
        super(
            'FISCAL_YEAR_CLOSED',
            `Fiscal year ${fiscalYearCode} is closed and cannot be modified`,
            400,
            { fiscalYearCode },
        );
    }
}

export class EntryNotFoundError extends BusinessException {
    constructor(id: number | bigint) {
        super('ENTRY_NOT_FOUND', `Accounting entry with ID ${id} not found`, 404, { entryId: id.toString() });
    }
}

export class InvalidEntryStatusError extends BusinessException {
    constructor(currentStatus: string, requiredStatus: string) {
        super(
            'INVALID_ENTRY_STATUS',
            `Entry status is ${currentStatus}, but must be ${requiredStatus} for this operation`,
            400,
            { currentStatus, requiredStatus }
        );
    }
}

// ========== Authentication/Authorization Errors ==========

export class UserNotFoundError extends BusinessException {
    constructor(identifier: string) {
        super('USER_NOT_FOUND', `User ${identifier} not found`, 404, { identifier });
    }
}

export class InvalidCredentialsError extends BusinessException {
    constructor() {
        super('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }
}

export class InsufficientPermissionsError extends BusinessException {
    constructor(requiredPermission: string) {
        super(
            'INSUFFICIENT_PERMISSIONS',
            `You do not have permission to perform this action. Required: ${requiredPermission}`,
            403,
            { requiredPermission },
        );
    }
}

export class AccountLockedError extends BusinessException {
    constructor(remainingMinutes: number) {
        super(
            'ACCOUNT_LOCKED',
            `Account locked. Try again in ${remainingMinutes} minute(s).`,
            401,
            { remainingMinutes }
        );
    }
}

export class AccountDisabledError extends BusinessException {
    constructor() {
        super('ACCOUNT_DISABLED', 'Votre compte utilisateur est désactivé. Veuillez contacter votre administrateur.', 401);
    }
}

export class CompanyInactiveError extends BusinessException {
    constructor() {
        super('COMPANY_INACTIVE', "Votre entreprise n'est pas encore activée. Veuillez patienter pendant que le super-administrateur valide votre inscription.", 401);
    }
}

export class BranchInactiveError extends BusinessException {
    constructor() {
        super('BRANCH_INACTIVE', "Cette succursale n'est pas encore activée. Veuillez contacter votre administrateur.", 401);
    }
}

export class InvalidTwoFactorCodeError extends BusinessException {
    constructor() {
        super('INVALID_2FA_CODE', 'Invalid or expired 2FA code', 401);
    }
}

export class TwoFactorNotEnabledError extends BusinessException {
    constructor() {
        super('2FA_NOT_ENABLED', '2FA is not enabled for this user', 400);
    }
}

// ========== DGI/Compliance Errors ==========

export class DGITransmissionError extends BusinessException {
    constructor(invoiceId: number, reason: string) {
        super('DGI_TRANSMISSION_FAILED', `Failed to transmit invoice ${invoiceId} to DGI: ${reason}`, 500, {
            invoiceId,
            reason,
        });
    }
}

export class ElectronicDeviceNotReadyError extends BusinessException {
    constructor(deviceId: number) {
        super(
            'ELECTRONIC_DEVICE_NOT_READY',
            `Electronic fiscal device ${deviceId} is not ready or connected`,
            503,
            { deviceId },
        );
    }
}

// ========== Validation Errors ==========

export class InvalidDateRangeError extends BusinessException {
    constructor(startDate: Date, endDate: Date) {
        super('INVALID_DATE_RANGE', `Start date must be before end date`, 400, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
    }
}

export class DuplicateEntryError extends BusinessException {
    constructor(field: string, value: any) {
        super('DUPLICATE_ENTRY', `A record with ${field} '${value}' already exists`, 409, {
            field,
            value,
        });
    }
}
