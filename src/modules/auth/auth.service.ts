import { Injectable, Logger, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import { EmailService } from '../resources/email/email.service';
import { DEFAULT_ROLES } from './permissions';
import {
    InvalidCredentialsError,
    UserNotFoundError,
    AccountLockedError,
    AccountDisabledError,
    InvalidTwoFactorCodeError,
    TwoFactorNotEnabledError,
    DuplicateEntryError,
    CompanyInactiveError,
    BranchInactiveError
} from '../../common/exceptions';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
    ) { }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            this.logger.warn(`Registration attempt with existing email: ${registerDto.email}`);
            throw new DuplicateEntryError('email', registerDto.email);
        }

        // Use a transaction to ensure Company, Role, and User are created together
        const result = await this.prisma.$transaction(async (prisma) => {
            // 1. Create Company
            const company = await prisma.company.create({
                data: {
                    companyName: registerDto.companyName,
                    rccm: 'PENDING', // Placeholders
                    nationalId: 'PENDING',
                    taxId: 'PENDING',
                    headquartersAddress: 'PENDING',
                    phone: 'PENDING',
                    email: registerDto.email,
                    taxRegime: 'PENDING',
                    taxCenter: 'PENDING',
                },
            });

            // 2. Create standard Roles for the Company
            const roleEntries = Object.entries(DEFAULT_ROLES).filter(([key]) => key !== 'SUPERADMIN');

            let adminRoleId: number | null = null;

            for (const [code, role] of roleEntries) {
                const createdRole = await prisma.role.create({
                    data: {
                        companyId: company.id,
                        code: code,
                        label: role.label,
                        permissions: JSON.stringify(role.permissions),
                    },
                });

                if (code === 'ADMIN_COMPANY') {
                    adminRoleId = createdRole.id;
                }
            }

            if (!adminRoleId) {
                // Fallback or handle error
                throw new Error('ADMIN_COMPANY role not created');
            }

            // 3. Create User
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);

            const user = await prisma.user.create({
                data: {
                    email: registerDto.email,
                    firstName: registerDto.firstName,
                    lastName: registerDto.lastName,
                    username: registerDto.email,
                    passwordHash: hashedPassword,
                    companyId: company.id,
                    roles: {
                        connect: [{ id: adminRoleId }]
                    },
                    isActive: true,
                    twoFactorRecoveryCodes: [],
                },
                include: { roles: true, company: true },
            });

            return { user, verificationToken: null };
        });

        this.logger.log(`User registered successfully: ${result.user.email} (Company: ${result.user.companyId})`);

        const { user } = result;

        // Verification email logic temporarily disabled due to schema changes
        /*
        await this.emailService.sendVerificationEmail(
            user.email,
            user.firstName,
            verificationToken
        );
        */

        return this.generateAuthResponse(user);
    }

    async verifyEmail(userId: number, token: string) {
        // Disabled
        return { message: 'Email logic disabled' };
    }

    async resendVerificationEmail(email: string) {
        // Disabled
        return { message: 'Email logic disabled' };
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto | { mfaRequired: boolean; mfaToken: string }> {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
            include: { roles: true, company: true },
        });

        if (!user) {
            this.logger.warn(`Login failed: User not found for email ${loginDto.email}`);
            throw new InvalidCredentialsError();
        }

        // SaaS SECURITY: Check if Company is active
        if (user.company && !user.company.isActive) {
            this.logger.warn(`Login blocked: Company ${user.company.companyName} is not active. User: ${user.email}`);
            throw new CompanyInactiveError();
        }

        // Optional: Check if Branch is active (if user restricted to branch)
        if (user.branchId) {
            const branch = await this.prisma.branch.findUnique({ where: { id: user.branchId } });
            if (branch && !branch.isActive) {
                this.logger.warn(`Login blocked: Branch ${branch.name} is not active. User: ${user.email}`);
                throw new BranchInactiveError();
            }
        }

        // Check if account is locked
        if (user.lockedUntil && new Date() < user.lockedUntil) {
            const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            this.logger.warn(`Login attempt on locked account: ${user.email}`);
            throw new AccountLockedError(remainingMinutes);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            // Increment failed login attempts
            const failedAttempts = user.failedLoginAttempts + 1;
            const updateData: any = { failedLoginAttempts: failedAttempts };

            // Lock account after 5 failed attempts
            if (failedAttempts >= 5) {
                updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });

            this.logger.warn(`Login failed: Invalid password for ${user.email}. Failed attempts: ${failedAttempts}`);
            throw new InvalidCredentialsError();
        }

        // Reset failed login attempts on successful password verification
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                },
            });
        }

        // Check if user is active
        if (!user.isActive) {
            this.logger.warn(`Login attempt on inactive account: ${user.email}`);
            throw new AccountDisabledError();
        }

        // Check if 2FA is enabled

        // Check if 2FA is enabled
        if (user.isTwoFactorEnabled) {
            const mfaToken = this.jwtService.sign(
                { sub: user.id, type: 'mfa' },
                { expiresIn: '5m' },
            );
            return {
                mfaRequired: true,
                mfaToken,
            };
        }

        return this.generateAuthResponse(user);
    }

    private async generateAuthResponse(user: any): Promise<AuthResponseDto> {
        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // Generate tokens
        const payload = {
            sub: user.id,
            email: user.email,
            roleCodes: user.roles.map((r: any) => r.code),
            companyId: user.companyId || user.company?.id,
            branchId: user.branchId,
            isSaaSAdmin: user.isSaaSAdmin,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 3600,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isSaaSAdmin: user.isSaaSAdmin,
                roles: user.roles.map((r: any) => ({
                    id: r.id,
                    code: r.code,
                    label: r.label,
                    permissions: r.permissions,
                })),
                company: {
                    id: user.company.id,
                    companyName: user.company.companyName,
                    taxId: user.company.taxId,
                },
            },
        };
    }

    async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
        try {
            const payload = this.jwtService.verify(refreshToken);

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                include: { roles: true, company: true },
            });

            if (!user || !user.isActive) {
                this.logger.warn(`Refresh token failed: User not found or inactive (ID: ${payload.sub})`);
                throw new InvalidCredentialsError();
            }

            if (user.company && !user.company.isActive) {
                this.logger.warn(`Refresh failed: Company inactive (ID: ${user.companyId})`);
                throw new CompanyInactiveError();
            }

            return this.generateAuthResponse(user);
        } catch (error) {
            this.logger.error(`Refresh token error: ${error.message}`);
            throw new InvalidCredentialsError();
        }
    }

    async getProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                lastLogin: true,
                isTwoFactorEnabled: true,
                twoFactorRecoveryCodes: true,
                roles: {
                    select: {
                        id: true,
                        code: true,
                        label: true,
                        permissions: true,
                    },
                },
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UserNotFoundError(userId.toString());
        }

        return user;
    }

    async updateProfile(userId: number, dto: UpdateProfileDto) {
        const data: any = {
            firstName: dto.firstName,
            lastName: dto.lastName,
        };

        if (dto.password) {
            data.passwordHash = await bcrypt.hash(dto.password, 10);
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
            include: { roles: true, company: true },
        });

        return this.getProfile(user.id);
    }

    // 2FA Methods

    async generateTwoFactorSecret(userId: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();

        const secret = speakeasy.generateSecret({
            name: `Milele:${user.email}`,
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });

        const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url!);

        return {
            secret: secret.base32,
            qrCodeDataUrl,
        };
    }

    private generateRecoveryCodes(): string[] {
        return Array.from({ length: 10 }, () =>
            crypto.randomBytes(5).toString('hex').toUpperCase(),
        );
    }

    async turnOnTwoFactorAuthentication(userId: number, code: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            throw new BadRequestException('2FA secret not generated');
        }

        const isCodeValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
        });

        if (!isCodeValid) {
            throw new BadRequestException('Code 2FA invalide');
        }

        const recoveryCodes = this.generateRecoveryCodes();

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: true,
                twoFactorRecoveryCodes: recoveryCodes,
            },
        });

        return { recoveryCodes };
    }

    async verifyTwoFactorCode(userId: number, code: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            throw new BadRequestException('2FA secret not generated');
        }

        return speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
        });
    }

    async turnOffTwoFactorAuthentication(userId: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null
            },
        });
    }

    async authenticateTwoFactor(mfaToken: string, code: string): Promise<AuthResponseDto> {
        let payload: any;
        try {
            payload = this.jwtService.verify(mfaToken);
            if (payload.type !== 'mfa') throw new Error();
        } catch (e) {
            throw new UnauthorizedException('Token MFA invalide ou expiré');
        }

        const userId = payload.sub;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: true, company: true }
        });

        if (!user || !user.isTwoFactorEnabled) {
            throw new UnauthorizedException('2FA non configuré');
        }

        // Try TOTP code
        const isTotpValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret!,
            encoding: 'base32',
            token: code,
        });

        if (isTotpValid) {
            return this.generateAuthResponse(user);
        }

        // Try Recovery Code


        throw new UnauthorizedException('Code 2FA ou de récupération invalide');
    }

    // Password Reset Methods

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Don't reveal if user exists BUT we should be careful. 
            // Common practice: "If this email is registered, you will receive..."
            // For now we return generic message.
            return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = this.jwtService.sign(
            { sub: user.id, type: 'password-reset' },
            { expiresIn: '1h' }
        );

        await this.emailService.sendPasswordResetEmail(user.email, resetToken);

        return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
    }

    async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
        let payload: any;
        try {
            payload = this.jwtService.verify(resetToken);
            if (payload.type !== 'password-reset') throw new Error();
        } catch (e) {
            throw new UnauthorizedException('Token de réinitialisation invalide ou expiré');
        }

        const userId = payload.sub;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });

        return { message: 'Mot de passe réinitialisé avec succès' };
    }
}
