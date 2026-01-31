import { z } from 'zod';

/**
 * Configuration schema with validation
 * All environment variables are validated at application startup
 */
export const ConfigSchema = z.object({
    // Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    // Database
    DATABASE_URL: z.string().url(),

    // JWT Authentication
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_EXPIRATION: z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),

    // CORS
    CORS_ORIGINS: z
        .string()
        .default('http://localhost:3001')
        .transform((val) => val.split(',').map((origin) => origin.trim())),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // Email (Optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // DGI Integration (Optional)
    DGI_API_URL: z.string().url().optional(),
    DGI_API_KEY: z.string().optional(),
    DGI_TIMEOUT: z.coerce.number().int().positive().default(30000),

    // Rate Limiting
    THROTTLE_TTL: z.coerce.number().int().positive().default(60),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),

    // File Upload
    MAX_FILE_SIZE: z.coerce.number().int().positive().default(5242880), // 5MB
    UPLOAD_PATH: z.string().default('./uploads'),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

/**
 * Validates configuration at startup
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: Record<string, unknown>): AppConfig {
    const result = ConfigSchema.safeParse(config);

    if (!result.success) {
        const errors = result.error.issues.map(
            (err) => `${err.path.join('.')}: ${err.message}`
        );
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    return result.data;
}
