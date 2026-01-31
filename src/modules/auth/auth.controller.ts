import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiExtraModels,
    getSchemaPath,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiUnauthorizedResponse,
    ApiConflictResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TwoFactorDto, TwoFactorLoginDto } from './dto/two-factor.dto';

@ApiTags('🔐 Auth')
@Controller('auth')
@ApiExtraModels(AuthResponseDto)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @ApiOperation({
        summary: 'Créer un nouveau compte entreprise',
        description: 'Enregistre une nouvelle entreprise et crée le premier utilisateur administrateur. Envoie un email de vérification.',
    })
    @ApiBody({ type: RegisterDto, description: 'Informations d\'inscription' })
    @ApiCreatedResponse({
        description: 'Compte créé avec succès. L\'utilisateur doit vérifier son email.',
        type: AuthResponseDto,
    })
    @ApiConflictResponse({ description: 'Cet email est déjà utilisé.' })
    @ApiBadRequestResponse({ description: 'Données invalides (mot de passe trop court, email invalide, etc.).' })
    @Throttle({ short: { ttl: 60000, limit: 3 } }) // 3 registration attempts per minute
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Get('email/verify/:id/:hash')
    @Public()
    @ApiOperation({
        summary: 'Vérifier l\'adresse email',
        description: 'Confirme l\'adresse email de l\'utilisateur via le lien sécurisé envoyé par mail.',
    })
    @ApiOkResponse({ description: 'Email vérifié avec succès. Le compte est maintenant actif.' })
    @ApiBadRequestResponse({ description: 'Lien de vérification invalide ou expiré.' })
    async verifyEmail(
        @Param('id') userId: string,
        @Param('hash') token: string,
    ) {
        return this.authService.verifyEmail(+userId, token);
    }

    @Post('email/verification-notification')
    @Public()
    @ApiOperation({
        summary: 'Renvoyer l\'email de vérification',
        description: 'Envoie un nouveau lien de vérification si le précédent a expiré ou n\'a pas été reçu.',
    })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', example: 'user@example.com' } } } })
    @ApiOkResponse({ description: 'Email de vérification envoyé.' })
    async resendVerification(@Body() body: { email: string }) {
        return this.authService.resendVerificationEmail(body.email);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Public()
    @ApiOperation({
        summary: 'Connexion utilisateur',
        description: 'Authentifie un utilisateur par email/mot de passe. Retourne soit les tokens JWT, soit une demande MFA.',
    })
    @ApiBody({ type: LoginDto })
    @ApiOkResponse({
        description: 'Connexion réussie ou MFA requis.',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(AuthResponseDto) },
                {
                    title: 'MFARequired',
                    type: 'object',
                    properties: {
                        mfaRequired: { type: 'boolean', example: true, description: 'Indique que le 2FA est requis' },
                        mfaToken: { type: 'string', example: 'eyJhbGciOiJIUz...', description: 'Token temporaire pour valider le 2FA' },
                    },
                },
            ],
        },
    })
    @ApiUnauthorizedResponse({ description: 'Email ou mot de passe incorrect, ou email non vérifié.' })
    @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 login attempts per minute
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @Public()
    @ApiOperation({
        summary: 'Rafraîchir les tokens d\'accès',
        description: 'Obtient un nouveau token d\'accès (et refresh token) à partir d\'un refresh token valide.',
    })
    @ApiBody({ type: RefreshTokenDto })
    @ApiOkResponse({
        description: 'Tokens rafraîchis avec succès.',
        type: AuthResponseDto,
    })
    @ApiUnauthorizedResponse({ description: 'Refresh token invalide, expiré ou révoqué.' })
    async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Get('me')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Récupérer le profil courant',
        description: 'Retourne les informations détaillées de l\'utilisateur connecté et de son entreprise.',
    })
    @ApiOkResponse({ description: 'Profil utilisateur récupéré.' })
    @ApiUnauthorizedResponse({ description: 'Non authentifié.' })
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @Patch('profile')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Mettre à jour le profil',
        description: 'Modifie les informations personnelles de l\'utilisateur connecté.',
    })
    @ApiOkResponse({ description: 'Profil mis à jour.' })
    @ApiUnauthorizedResponse({ description: 'Non authentifié.' })
    async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.userId, dto);
    }

    @Post('logout')
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Déconnexion sécurisée',
        description: 'Invalide le refresh token en cours (si implémenté côté serveur) et déconnecte l\'utilisateur.',
    })
    @ApiOkResponse({ description: 'Déconnexion réussie.' })
    async logout() {
        return {
            message: 'Déconnexion réussie',
        };
    }

    // =================================================================================================
    // 🔐 TWO FACTOR AUTHENTICATION (2FA)
    // =================================================================================================

    @Post('2fa/generate')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Générer un secret 2FA (TOTP)',
        description: 'Crée un nouveau secret TOTP et retourne le QR Code à scanner avec Google Authenticator.',
    })
    @ApiOkResponse({
        description: 'Secret généré. Contient l\'URL du QR code et le secret en texte.',
        schema: {
            properties: {
                secret: { type: 'string', example: 'JBSWY3DPEHPK3PXP' },
                otpauthUrl: { type: 'string', example: 'otpauth://totp/MILELE:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MILELE' },
                qrCodeDataUrl: { type: 'string', description: 'Image Base64 du QR Code' }
            }
        }
    })
    async generate2fa(@Request() req) {
        return this.authService.generateTwoFactorSecret(req.user.userId);
    }

    @Post('2fa/turn-on')
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Activer la 2FA',
        description: 'Confirme le code TOTP et active officiellement la 2FA pour le compte.',
    })
    @ApiBody({ type: TwoFactorDto })
    @ApiOkResponse({ description: 'Authentification à deux facteurs activée avec succès.' })
    @ApiUnauthorizedResponse({ description: 'Code 2FA invalide.' })
    async turnOn2fa(@Request() req, @Body() body: TwoFactorDto) {
        return this.authService.turnOnTwoFactorAuthentication(req.user.userId, body.code);
    }

    @Post('2fa/verify')
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Vérifier un code 2FA',
        description: 'Vérifie simplement si un code est valide (sans activer/désactiver quoi que ce soit).',
    })
    @ApiBody({ type: TwoFactorDto })
    @ApiOkResponse({
        description: 'Résultat de la vérification.',
        schema: { properties: { isValid: { type: 'boolean', example: true } } }
    })
    async verify2fa(@Request() req, @Body() body: TwoFactorDto) {
        const isValid = await this.authService.verifyTwoFactorCode(req.user.userId, body.code);
        return { isValid };
    }

    @Post('2fa/turn-off')
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Désactiver la 2FA',
        description: 'Désactive complètement l\'authentification à deux facteurs pour l\'utilisateur.',
    })
    @ApiOkResponse({ description: '2FA désactivé avec succès.' })
    async turnOff2fa(@Request() req) {
        await this.authService.turnOffTwoFactorAuthentication(req.user.userId);
        return { message: '2FA désactivé avec succès' };
    }

    @Post('2fa/authenticate')
    @HttpCode(HttpStatus.OK)
    @Public()
    @ApiOperation({
        summary: 'Finaliser connexion avec 2FA',
        description: 'Deuxième étape de connexion : échange le mfaToken temporaire + code TOTP contre les tokens d\'accès finaux.',
    })
    @ApiBody({ type: TwoFactorLoginDto })
    @ApiOkResponse({
        description: 'Connexion 2FA réussie.',
        type: AuthResponseDto
    })
    @ApiUnauthorizedResponse({ description: 'Code 2FA incorrect ou session expirée.' })
    async authenticate2fa(@Body() body: TwoFactorLoginDto) {
        return this.authService.authenticateTwoFactor(body.mfaToken, body.code);
    }

    @Get('2fa/recovery-codes')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Récupérer codes de secours',
        description: 'Affiche les codes de récupération 2FA non utilisés (à sauvegarder en lieu sûr).',
    })
    @ApiOkResponse({
        description: 'Liste des codes de récupération.',
        schema: {
            properties: {
                recoveryCodes: {
                    type: 'array',
                    items: { type: 'string', example: 'a1b2-c3d4' }
                }
            }
        }
    })
    async getRecoveryCodes(@Request() req) {
        const user = await this.authService.getProfile(req.user.userId);
        // Cast to any because permissions/types might hide recovery codes field
        return { recoveryCodes: (user as any).twoFactorRecoveryCodes };
    }

    // =================================================================================================
    // 🔑 PASSWORD MANAGEMENT
    // =================================================================================================

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @Public()
    @ApiOperation({
        summary: 'Mot de passe oublié',
        description: 'Initie la procédure de réinitialisation. Envoie un email avec un lien temporaire.',
    })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', example: 'user@example.com' } } } })
    @ApiOkResponse({ description: 'Si l\'email existe, un lien de réinitialisation a été envoyé.' })
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @Public()
    @ApiOperation({
        summary: 'Définir nouveau mot de passe',
        description: 'Finalise la réinitialisation avec le token reçu par email et le nouveau mot de passe.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['resetToken', 'newPassword'],
            properties: {
                resetToken: { type: 'string', description: 'Token reçu par email' },
                newPassword: { type: 'string', format: 'password', minLength: 8, description: 'Nouveau mot de passe sécurisé' }
            }
        }
    })
    @ApiOkResponse({ description: 'Mot de passe modifié avec succès.' })
    @ApiBadRequestResponse({ description: 'Token invalide ou expiré.' })
    async resetPassword(@Body() body: { resetToken: string; newPassword: string }) {
        return this.authService.resetPassword(body.resetToken, body.newPassword);
    }
}

