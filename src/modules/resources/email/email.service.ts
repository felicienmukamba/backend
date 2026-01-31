
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            this.logger.log('SMTP Connection established successfully');
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                this.logger.warn('SMTP Connection failed (Development mode: Email features may be unavailable)');
            } else {
                this.logger.error('SMTP Connection failed', error);
            }
        }
    }

    async sendMail(to: string, subject: string, html: string) {
        try {
            const fromName = process.env.SMTP_FROM_NAME || 'Milele Notifications';
            const fromEmail = process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER || 'no-reply@milele.com';

            const info = await this.transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            this.logger.error('Error sending email', error);
            throw error;
        }
    }

    async sendVerificationEmail(to: string, name: string, token: string) {
        const verificationUrl = `${process.env.FRONTEND_URL}/auth/email/verify/${token}`; // We'll adjust the URL structure if needed

        // In a real app, use a template engine like Handlebars or EJS
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Bienvenue chez Milele, ${name}!</h2>
        <p>Merci de vous être inscrit. Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmer mon email</a>
        </div>
        <p style="color: #666; font-size: 14px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur : <br> <a href="${verificationUrl}">${verificationUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
      </div>
    `;

        return this.sendMail(to, 'Confirmez votre adresse email - Milele', html);
    }

    async sendPasswordResetEmail(to: string, token: string) {
        // Frontend URL for password reset
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
        </div>
        <p style="color: #666; font-size: 14px;">Ce lien expirera dans 1 heure.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
      </div>
    `;

        return this.sendMail(to, 'Réinitialisation de mot de passe - Milele', html);
    }
}
