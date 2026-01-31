import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Prefix for Versioning
  app.setGlobalPrefix('api/v1');

  // Security Middleware - High Security Mode
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Enable CORS
  app.enableCors();

  // Global validation pipe with enhanced settings
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: error.constraints
            ? error.constraints[Object.keys(error.constraints)[0]]
            : 'Erreur de validation',
        }));
        return new BadRequestException({
          message: 'Erreur de validation',
          errors: result,
        });
      },
      stopAtFirstError: true,
    }),
  );




  // Global exception filter for standardized error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response transformation interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger configuration - Enterprise Grade Documentation
  const config = new DocumentBuilder()
    .setTitle('MILELE - Accounting ERP API')
    .setDescription(
      `## 🚀 Système de Gestion Comptable Intelligent - Conforme OHADA

**MILELE** est une solution ERP complète pour la gestion comptable, financière et fiscale des entreprises en Afrique.

### 📊 Modules Principaux

#### 💼 Administration & Sécurité
- **Authentification JWT** - Connexion sécurisée avec refresh tokens
- **Gestion multi-utilisateurs** - Rôles et permissions granulaires
- **Multi-société** - Support complet de plusieurs entités juridiques
- **Audit Trail** - Traçabilité totale de toutes les opérations

#### 📈 Comptabilité OHADA
- **Plan Comptable** - Conforme au référentiel SYSCOHADA
- **Écritures Comptables** - Partie double avec validation automatique
- **Journaux** - VT (Ventes), HA (Achats), BQ (Banque), CA (Caisse), OD (Opérations Diverses)
- **Exercices Fiscaux** - Gestion des périodes avec clôture
- **Rapports Financiers** - Bilan, Compte de Résultat, Balance, Grand Livre

#### 💰 Ventes & Facturation
- **Facturation Électronique** - Intégration DGI/MCF pour la RDC
- **Gestion Clients** - Fiches tiers complètes
- **Notes de Crédit** - Avoirs et remboursements
- **Paiements** - Suivi des règlements

#### 📦 Ressources & Stocks
- **Catalogue Produits** - Produits et services
- **Gestion Stocks** - Entrées, sorties, inventaires
- **Tiers** - Clients et fournisseurs

#### 🎯 Analytique & Budget
- **Centres de Coûts** - Comptabilité analytique
- **Budgets** - Prévisions et suivi

### 🔒 Sécurité

- **Authentification** : JWT Bearer Tokens (Access + Refresh)
- **Autorisation** : RBAC (Role-Based Access Control)
- **Audit** : Logs complets de toutes les actions
- **Conformité** : RGPD et normes OHADA

### 🌍 Standards & Conformité

- ✅ **OHADA/SYSCOHADA** - Comptabilité normalisée
- ✅ **DGI RDC** - Déclarations fiscales automatisées
- ✅ **MCF** - Signature électronique des factures
- ✅ **Multi-devises** - FC, USD, EUR

### 📚 Guide d'utilisation

1. **S'authentifier** : POST /api/auth/login → Récupérer le token
2. **Autoriser** : Cliquer sur "Authorize" ↗️ et coller votre token
3. **Explorer** : Tester librement tous les endpoints
4. **Intégrer** : Utiliser les exemples de code générés

### 🆘 Support

- 📧 Email : support@milele.app
- 📖 Documentation : https://docs.milele.app
- 💬 WhatsApp : +243 XXX XXX XXX

---
**Version** : 1.0.0 | **Environnement** : ${process.env.NODE_ENV || 'development'}`,
    )
    .setVersion('1.0.0 (API v1)')
    .setContact(
      'MILELE Support Team',
      'https://milele.app',
      'support@milele.app',
    )
    .setLicense('Propriétaire - All Rights Reserved', 'https://milele.app/license')
    .setTermsOfService('https://milele.app/terms')
    .setExternalDoc('Documentation complète', 'https://docs.milele.app')
    .addServer('http://localhost:3000', '🔧 Développement Local')
    .addServer('https://api-staging.milele.app', '🧪 Environnement de Test')
    .addServer('https://api.milele.app', '🚀 Production')

    // JWT Bearer Authentication
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '🔑 Entrez votre token JWT obtenu via /api/auth/login\n\nFormat : Bearer <votre_token>',
        in: 'header',
      },
      'JWT-auth',
    )

    // Organized Tags with Emojis
    .addTag('🏠 App', 'Endpoints système : santé, version, statistiques')
    .addTag('🔐 Auth', 'Authentification, connexion, inscription, tokens')
    .addTag('👥 Administration - Users', 'CRUD utilisateurs, profils, modifications')
    .addTag('🎭 Administration - Roles', 'Gestion rôles, permissions, RBAC')
    .addTag('🏢 Administration - Companies', 'Entités juridiques, paramètres entreprise')
    .addTag('🏪 Administration - Branches', 'Succursales et points de vente')
    .addTag('📜 Administration - Audit', 'Logs d\'audit, traçabilité, historique')
    .addTag('⚙️ Administration - Setup', 'Configuration initiale, onboarding')

    .addTag('💰 Sales - Invoices', 'Facturation, émission, validation, MCF/DGI')
    .addTag('💳 Sales - Payments', 'Règlements clients, encaissements')
    .addTag('📊 Sales - Taxes', 'Configuration TVA, taxes, taux applicables')
    .addTag('📝 Sales - Credit Notes', 'Avoirs, remboursements, annulations')

    .addTag('📖 Accounting - Entries', 'Écritures comptables, partie double, validation')
    .addTag('📋 Accounting - Accounts', 'Plan comptable SYSCOHADA, comptes')
    .addTag('📓 Accounting - Journals', 'Journaux VT, HA, BQ, CA, OD')
    .addTag('📅 Accounting - Fiscal Years', 'Exercices fiscaux, ouverture, clôture')
    .addTag('🎯 Accounting - Cost Centers', 'Analytique, centres de coûts')
    .addTag('📈 Accounting - Reports', 'Bilan, Compte de Résultat, Balance, Grand Livre')
    .addTag('📊 Accounting - Dashboard', 'KPIs, indicateurs, statistiques temps réel')

    .addTag('👤 Resources - Third Parties', 'Clients, fournisseurs, contacts')
    .addTag('🛍️ Resources - Products', 'Catalogue produits, services, tarifs')
    .addTag('📦 Resources - Stock', 'Mouvements stocks, inventaires, valorisation')

    .addTag('🏛️ DGI/MCF', 'Intégration fiscale RDC, e-factures, dispositifs')
    .addTag('💼 HR', 'Ressources humaines, employés, paie')
    .addTag('💵 Budgeting', 'Budgets, prévisions, écarts')
    .addTag('🔄 Sync', 'Synchronisation offline, API mobile')

    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Enhanced Swagger UI Options
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'MILELE API - Documentation Interactive',
    customfavIcon: 'https://milele.app/favicon.ico',
    customCss: `
      .swagger-ui .topbar { background-color: #1e293b; }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .info .title small { color: #64748b; }
      .swagger-ui .scheme-container { background: #f1f5f9; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'list',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      tryItOutEnabled: true,
    },
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 MILELE Backend API - Démarré avec succès !`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 URL API         : http://localhost:3000`);
  console.log(`📚 Swagger UI      : http://localhost:3000/api/docs`);
  console.log(`� Swagger JSON    : http://localhost:3000/api/docs-json`);
  console.log(`🌍 Environnement   : ${process.env.NODE_ENV || 'development'}`);
  console.log(`${'='.repeat(60)}\n`);
}
bootstrap();
