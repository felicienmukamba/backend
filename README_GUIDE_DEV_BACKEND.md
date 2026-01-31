# 📘 Guide du Développeur Backend - MILELE ACCOUNTING SOFTWARE

> **Guide pédagogique complet pour comprendre, maintenir et développer l'API backend du système MILELE**

---

## 📋 Table des Matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Structure du projet](#2-structure-du-projet)
3. [Technologies et bibliothèques](#3-technologies-et-bibliothèques)
4. [Base de données et Prisma](#4-base-de-données-et-prisma)
5. [Modules et fonctionnalités](#5-modules-et-fonctionnalités)
6. [Patterns et bonnes pratiques](#6-patterns-et-bonnes-pratiques)
7. [Configuration et déploiement](#7-configuration-et-déploiement)
8. [Guide de contribution](#8-guide-de-contribution)

---

## 1. Vue d'ensemble du projet

### 1.1 Contexte Métier

**MILELE ACCOUNTING SOFTWARE** (aussi nommé SIGCF - Système Intégré de Gestion Comptable et Financière) est une solution complète de gestion comptable, financière et commerciale conçue spécifiquement pour les entreprises opérant en République Démocratique du Congo (RDC).

#### Conformité et Normes

Le système respecte deux cadres réglementaires essentiels :

- **🏛️ SYSCOHADA (Système Comptable OHADA)** : Norme comptable obligatoire pour les pays de l'OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires). Elle définit le plan comptable, les états financiers (bilan, compte de résultat), et les règles de comptabilisation.

- **🏢 DGI (Direction Générale des Impôts)** : Conformité fiscale pour la RDC, incluant :
  - **DEF (Dispositif Électronique Fiscal)** : Système obligatoire pour la certification et la transmission des factures
  - **MCF (Module de Contrôle Fiscal)** : Mécanisme de signature électronique des factures
  - **ISF (Identifiant Sécurisé Fiscal)** : Identifiant unique attribué à chaque facture par la DGI

### 1.2 Architecture Globale

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js)                    │
│  Interface utilisateur web responsive           │
└────────────────┬────────────────────────────────┘
                 │ HTTP/REST
                 │ JSON
┌────────────────▼────────────────────────────────┐
│           Backend API (NestJS)                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Auth │ Admin │ Sales │ Accounting │ HR  │   │
│  └──────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │ Prisma ORM
┌────────────────▼────────────────────────────────┐
│         PostgreSQL Database                     │
│  Données structurées (Entreprises, Factures,    │
│  Écritures comptables, Utilisateurs, etc.)      │
└─────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Services Externes                       │
│  • API DGI (transmission factures)              │
│  • MCF (signature électronique)                 │
└─────────────────────────────────────────────────┘
```

### 1.3 Stack Technique

- **Framework** : NestJS (Node.js)
- **Langage** : TypeScript
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Authentification** : JWT + Passport
- **Documentation** : Swagger (OpenAPI 3.0)

---

## 2. Structure du projet

Voici l'organisation complète du projet backend :

```
milele-backend/
│
├── prisma/                          # Configuration Prisma ORM
│   ├── schema.prisma               # Définition du schéma de base de données
│   ├── seed.ts                     # Script de données initiales
│   └── migrations/                 # Historique des migrations de schéma
│
├── src/                            # Code source principal
│   ├── main.ts                     # Point d'entrée de l'application
│   ├── app.module.ts               # Module racine NestJS
│   ├── app.controller.ts           # Contrôleur racine
│   ├── app.service.ts              # Service racine
│   │
│   ├── common/                     # Code partagé entre modules
│   │   ├── decorators/             # Décorateurs personnalisés
│   │   │   ├── public.decorator.ts         # @Public() - Désactive l'auth JWT
│   │   │   ├── roles.decorator.ts          # @Roles() - Restrict par rôle
│   │   │   └── permissions.decorator.ts    # @Permissions() - Restrict par permission
│   │   ├── guards/                 # Guards de sécurité
│   │   │   ├── jwt-auth.guard.ts          # Vérifie le JWT
│   │   │   ├── roles.guard.ts             # Vérifie le rôle utilisateur
│   │   │   ├── permissions.guard.ts       # Vérifie les permissions
│   │   │   └── tenancy.guard.ts           # Isolation multi-entreprise
│   │   ├── interceptors/           # Interceptors (middleware)
│   │   │   ├── audit-log.interceptor.ts   # Logs automatiques des actions
│   │   │   └── bigint.interceptor.ts      # Conversion BigInt -> String JSON
│   │   ├── dto/                    # DTOs partagés
│   │   │   └── pagination.dto.ts   # Pagination standardisée
│   │   ├── services/               # Services partagés
│   │   │   └── soft-delete.service.ts     # Gestion du soft delete
│   │   └── common.module.ts        # Module commun
│   │
│   ├── modules/                    # Modules métier
│   │   ├── auth/                   # 🔐 Authentification et sécurité
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/                # DTOs (Login, Register, 2FA, etc.)
│   │   │   ├── guards/             # JWT Guard
│   │   │   ├── strategies/         # Passport strategies (JWT)
│   │   │   └── permissions.ts      # Définition des permissions
│   │   │
│   │   ├── administration/         # 🏢 Gestion administrative
│   │   │   ├── administration.module.ts
│   │   │   ├── companies/          # Gestion des entreprises
│   │   │   ├── branches/           # Gestion des succursales
│   │   │   ├── users/              # Gestion des utilisateurs
│   │   │   ├── roles/              # Gestion des rôles et permissions
│   │   │   ├── audit-logs/         # Logs d'audit
│   │   │   ├── legal/              # Documents légaux
│   │   │   └── setup/              # Configuration initiale
│   │   │
│   │   ├── sales/                  # 💰 Ventes et fiscalité
│   │   │   ├── sales.module.ts
│   │   │   ├── invoices/           # Gestion des factures
│   │   │   ├── payments/           # Gestion des paiements
│   │   │   ├── credit-notes/       # Notes de crédit (avoirs)
│   │   │   └── taxes/              # Gestion des taxes (TVA, etc.)
│   │   │
│   │   ├── accounting/             # 📊 Comptabilité SYSCOHADA
│   │   │   ├── accounting.module.ts
│   │   │   ├── accounts/           # Plan comptable
│   │   │   ├── journals/           # Journaux comptables
│   │   │   ├── entries/            # Écritures comptables
│   │   │   ├── fiscal-years/       # Exercices fiscaux
│   │   │   ├── cost-centers/       # Centres de coûts
│   │   │   └── reports/            # États financiers (bilan, résultat)
│   │   │
│   │   ├── resources/              # 📦 Ressources (Produits, Tiers)
│   │   │   ├── resources.module.ts
│   │   │   ├── products/           # Catalogue produits
│   │   │   ├── third-parties/      # Clients et fournisseurs
│   │   │   ├── stock-movements/    # Mouvements de stock
│   │   │   └── email/              # Service d'envoi d'emails
│   │   │
│   │   ├── dgi/                    # 🏛️ Conformité DGI
│   │   │   ├── dgi.module.ts
│   │   │   └── devices/            # Gestion des DEF (Dispositifs Électroniques Fiscaux)
│   │   │
│   │   ├── hr/                     # 👥 Ressources Humaines
│   │   │   └── hr.module.ts        # Gestion employés, paie, etc.
│   │   │
│   │   ├── budgeting/              # 📈 Gestion budgétaire
│   │   │   └── budgeting.module.ts
│   │   │
│   │   └── sync/                   # 🔄 Synchronisation externe
│   │       └── sync.module.ts      # Sync avec systèmes tiers
│   │
│   └── prisma/                     # Service Prisma (singleton)
│       ├── prisma.module.ts
│       └── prisma.service.ts       # Client Prisma centralisé
│
├── test/                           # Tests E2E
│   └── jest-e2e.json
│
├── dist/                           # Code compilé (généré automatiquement)
│
├── node_modules/                   # Dépendances installées
│
├── docker-compose.yml              # Configuration Docker (PostgreSQL + Backend)
├── Dockerfile                      # Image Docker du backend
├── package.json                    # Dépendances et scripts NPM
├── tsconfig.json                   # Configuration TypeScript
├── nest-cli.json                   # Configuration NestJS CLI
├── eslint.config.mjs               # Configuration ESLint
├── prisma.config.ts                # Configuration Prisma personnalisée
└── README.md                       # Documentation de base
```

### 2.1 Explication des Dossiers Clés

#### `/prisma`
- **Rôle** : Contient toute la configuration de la base de données
- **`schema.prisma`** : Définit les modèles (tables), relations, et indexes
- **`seed.ts`** : Script pour peupler la DB avec des données de test
- **`migrations/`** : Historique versionné des changements de schéma

#### `/src/common`
- **Rôle** : Code réutilisable par tous les modules
- **`decorators/`** : Décorateurs personnalisés pour simplifier le code (exemple : `@Public()`)
- **`guards/`** : Guards qui contrôlent l'accès aux routes (JWT, permissions, rôles)
- **`interceptors/`** : Middleware qui transforme les requêtes/réponses

#### `/src/modules`
- **Rôle** : Organisation modulaire de la logique métier
- Chaque module est isolé et a sa propre logique
- Respecte le pattern **Module → Controller → Service → Repository (Prisma)**

---

## 3. Technologies et bibliothèques

### 3.1 Framework Principal : **NestJS**

```json
"@nestjs/core": "^11.0.1"
```

**Pourquoi NestJS ?**

NestJS est un framework Node.js **progressif** et **modulaire** inspiré d'Angular. Il apporte :

1. **Architecture structurée** : Pattern MVC clair (Modules, Controllers, Services)
2. **TypeScript first** : Type safety complète
3. **Dependency Injection** : Gestion automatique des dépendances
4. **Écosystème riche** : Intégrations natives (Swagger, JWT, validation, etc.)
5. **Scalabilité** : Architecture modulaire qui scale bien

**Concepts clés NestJS utilisés dans le projet :**

- **Modules** : Regroupent les fonctionnalités liées (`@Module()`)
- **Controllers** : Gèrent les routes HTTP (`@Controller()`, `@Get()`, `@Post()`)
- **Services** : Contiennent la logique métier (`@Injectable()`)
- **Guards** : Contrôlent l'accès aux routes (`@UseGuards()`)
- **Interceptors** : Middleware pour transformer req/res (`@UseInterceptors()`)
- **Pipes** : Validation et transformation des données (`@UsePipes()`)

📚 **Documentation** : [https://docs.nestjs.com/](https://docs.nestjs.com/)

---

### 3.2 ORM : **Prisma**

```json
"@prisma/client": "^6.19.1",
"prisma": "^6.19.1"
```

**Pourquoi Prisma ?**

Prisma est un ORM **moderne** et **type-safe** pour Node.js et TypeScript :

1. **Type Safety** : Auto-génération des types TypeScript depuis le schéma
2. **Migration System** : Gestion des migrations de DB versionées
3. **Developer Experience** : Autocomplete dans l'IDE, erreurs à la compilation
4. **Performance** : Requêtes SQL optimisées
5. **Relations** : Gestion élégante des relations entre tables

**Fichiers clés :**

- `prisma/schema.prisma` : Définition du schéma (models, relations)
- `src/prisma/prisma.service.ts` : Client Prisma singleton injecté partout

**Exemple d'utilisation :**

```typescript
// Dans un service
constructor(private prisma: PrismaService) {}

async findAll(companyId: number) {
  return this.prisma.invoice.findMany({
    where: { companyId },
    include: { client: true, invoiceLines: true }
  });
}
```

📚 **Documentation** : [https://www.prisma.io/docs/](https://www.prisma.io/docs/)

---

### 3.3 Base de Données : **PostgreSQL**

**Pourquoi PostgreSQL ?**

PostgreSQL est une base de données **relationnelle** open-source extrêmement puissante :

1. **ACID Compliance** : Garantit l'intégrité des transactions (crucial en comptabilité)
2. **Support JSON** : Stockage de données semi-structurées (config_mcf, permissions)
3. **Performances** : Indexes avancés, requêtes complexes optimisées
4. **Contraintes** : Foreign keys, unique constraints, check constraints
5. **Extensibilité** : Support de types personnalisés, extensions

**Configuration :**

Le projet utilise Docker pour PostgreSQL :
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15-alpine
```

📚 **Documentation** : [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)

---

### 3.4 Authentification et Sécurité

#### **JWT (JSON Web Tokens)**

```json
"@nestjs/jwt": "^11.0.2",
"@nestjs/passport": "^11.0.5",
"passport-jwt": "^4.0.1"
```

**Pourquoi JWT ?**

JWT est un standard pour l'authentification **stateless** (sans session serveur) :

1. **Stateless** : Pas besoin de stockage session côté serveur
2. **Scalable** : Facilite le load balancing entre plusieurs serveurs
3. **Sécurisé** : Signature cryptographique pour vérifier l'authenticité
4. **Portable** : Fonctionne entre différents domaines/services

**Flow d'authentification :**

```
1. POST /auth/login → Vérifie credentials → Retourne JWT
2. Client stocke le JWT
3. Chaque requête → Header: Authorization: Bearer {JWT}
4. JwtAuthGuard vérifie le JWT → Autorise/Refuse
```

#### **Passport**

Middleware d'authentification populaire qui s'intègre avec NestJS. Le projet utilise la stratégie JWT.

#### **Bcryptjs**

```json
"bcryptjs": "^3.0.3"
```

Bibliothèque pour **hasher les mots de passe** de manière sécurisée :

```typescript
import * as bcrypt from 'bcryptjs';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

**Pourquoi hasher ?** Jamais stocker les mots de passe en clair. Bcrypt utilise un algorithme **one-way** avec **salt** automatique.

#### **Speakeasy (2FA)**

```json
"speakeasy": "^2.0.0",
"qrcode": "^1.5.4"
```

Bibliothèque pour l'**authentification à deux facteurs (2FA)** :

1. Génère un secret unique pour chaque utilisateur
2. Génère un QR code que l'utilisateur scanne (Google Authenticator, Authy)
3. Valide les codes OTP (One-Time Password) à 6 chiffres

**Utilisation :**

```typescript
// Générer un secret
const secret = speakeasy.generateSecret({ name: 'MILELE' });

// Vérifier un code
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: code
});
```

📚 **Documentation JWT** : [https://jwt.io/](https://jwt.io/)

---

### 3.5 Validation : **Class Validator & Class Transformer**

```json
"class-validator": "^0.14.3",
"class-transformer": "^0.5.1"
```

**Pourquoi ces bibliothèques ?**

Elles permettent de **valider automatiquement** les données entrantes (DTOs) :

1. **Déclaratif** : Validation via décorateurs (`@IsEmail()`, `@IsString()`)
2. **Type Safety** : Assure que les données matchent les types TypeScript
3. **Messages d'erreur** : Génère automatiquement des messages clairs
4. **Transformation** : Convertit les données (ex: string → number)

**Exemple de DTO :**

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

Avec `ValidationPipe` global, toute requête invalide renvoie automatiquement une erreur 400.

📚 **Documentation** : [https://github.com/typestack/class-validator](https://github.com/typestack/class-validator)

---

### 3.6 Documentation API : **Swagger (OpenAPI)**

```json
"@nestjs/swagger": "^11.2.3",
"swagger-ui-express": "^5.0.1"
```

**Pourquoi Swagger ?**

Swagger génère automatiquement une **documentation interactive** de l'API :

1. **Documentation auto-générée** : À partir des décorateurs NestJS
2. **Interface interactive** : Testez les endpoints directement depuis le navigateur
3. **Standardisé** : Suit la spécification OpenAPI 3.0
4. **Collaboration** : Facilite la communication entre backend et frontend

**Configuration (dans `main.ts`) :**

```typescript
const config = new DocumentBuilder()
  .setTitle('MILELE API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Accès** : [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

📚 **Documentation** : [https://docs.nestjs.com/openapi/introduction](https://docs.nestjs.com/openapi/introduction)

---

### 3.7 Sécurité HTTP : **Helmet**

```json
"helmet": "^8.1.0"
```

**Pourquoi Helmet ?**

Helmet sécurise les applications Express/NestJS en configurant correctement les **headers HTTP** :

- `X-Content-Type-Options: nosniff` : Prévient le MIME sniffing
- `X-Frame-Options: DENY` : Prévient le clickjacking
- `Strict-Transport-Security` : Force HTTPS
- Et bien d'autres protections

**Utilisation dans `main.ts` :**

```typescript
import helmet from 'helmet';
app.use(helmet());
```

📚 **Documentation** : [https://helmetjs.github.io/](https://helmetjs.github.io/)

---

### 3.8 Rate Limiting : **Throttler**

```json
"@nestjs/throttler": "^6.5.0"
```

**Pourquoi Throttler ?**

Protège l'API contre les **attaques par force brute** et les **abus** en limitant le nombre de requêtes par IP :

- Limite : 10 requêtes par minute par défaut
- Prévient le spam, les DDoS légers
- Personnalisable par route

---

### 3.9 Multi-tenancy : **NestJS CLS**

```json
"nestjs-cls": "^6.1.0"
```

**Pourquoi NestJS CLS ?**

CLS (Continuation-Local Storage) permet de stocker des données **contextuelles par requête** (comme le `companyId`) accessibles partout dans le code sans le passer manuellement.

**Utilisation** : Le `TenancyGuard` extrait le `companyId` du JWT et le stocke dans le contexte. Tous les services peuvent y accéder.

```typescript
// Dans un service
const companyId = this.cls.get('companyId');
```

**Pourquoi c'est crucial ?** Dans une application **multi-entreprise**, chaque utilisateur accède uniquement aux données de SON entreprise. CLS automatise cette isolation.

📚 **Documentation** : [https://github.com/Papooch/nestjs-cls](https://github.com/Papooch/nestjs-cls)

---

### 3.10 Calculs Financiers : **Big.js**

```json
"big.js": "^7.0.1"
```

**Pourquoi Big.js ?**

JavaScript utilise des nombres **flottants** (IEEE 754) qui sont **imprécis** pour l'argent :

```javascript
0.1 + 0.2 // = 0.30000000000000004 ❌
```

**Big.js** résout ce problème en utilisant une **arithmétique décimale exacte** :

```typescript
import Big from 'big.js';

const total = new Big('0.1').plus('0.2'); // '0.3' ✅
```

**Crucial en comptabilité** où chaque centime compte !

📚 **Documentation** : [http://mikemcl.github.io/big.js/](http://mikemcl.github.io/big.js/)

---

### 3.11 Requêtes HTTP : **Axios**

```json
"@nestjs/axios": "^4.0.1",
"axios": "^1.13.2"
```

**Pourquoi Axios ?**

Client HTTP pour communiquer avec des APIs externes (API DGI, MCF) :

1. **Promises-based** : Syntaxe async/await
2. **Interceptors** : Middleware pour les requêtes/réponses
3. **Timeout** : Gestion automatique des timeouts
4. **Transformation** : Transformation automatique JSON

**Utilisation :**

```typescript
import { HttpService } from '@nestjs/axios';

async transmitToDGI(invoiceData) {
  const response = await this.httpService.post(
    'https://api.dgi.cd/factures',
    invoiceData
  ).toPromise();
  return response.data;
}
```

📚 **Documentation** : [https://axios-http.com/](https://axios-http.com/)

---

### 3.12 Configuration : **@nestjs/config**

```json
"@nestjs/config": "^4.0.2"
```

**Pourquoi @nestjs/config ?**

Gère les **variables d'environnement** de manière structurée :

1. Charge automatiquement le fichier `.env`
2. Validation des variables obligatoires
3. Type safety pour la config
4. Différents fichiers pour dev/prod

**Utilisation :**

```typescript
// .env
DATABASE_URL=postgresql://...
JWT_SECRET=super_secret

// Dans un service
constructor(private configService: ConfigService) {}

const dbUrl = this.configService.get<string>('DATABASE_URL');
```

📚 **Documentation** : [https://docs.nestjs.com/techniques/configuration](https://docs.nestjs.com/techniques/configuration)

---

### 3.13 Mapped Types

```json
"@nestjs/mapped-types": "^2.1.0"
```

**Pourquoi Mapped Types ?**

Bibliothèque utilitaire pour créer des DTOs dérivés automatiquement :

- `PartialType(CreateDto)` : Rend tous les champs optionnels (pour UPDATE)
- `PickType(CreateDto, ['field'])` : Sélectionne certains champs
- `OmitType(CreateDto, ['field'])` : Exclut certains champs

**Exemple :**

```typescript
export class UpdateUserDto extends PartialType(CreateUserDto) {}
// Tous les champs de CreateUserDto deviennent optionnels
```

---

### 3.14 Tests : **Jest**

```json
"jest": "^30.0.0",
"@nestjs/testing": "^11.0.1"
```

**Pourquoi Jest ?**

Framework de test JavaScript complet :

1. **Test Runner** : Exécute les tests
2. **Mocking** : Mock des dépendances
3. **Coverage** : Couverture de code
4. **Snapshots** : Test des outputs structurés

**Scripts disponibles :**

```bash
npm run test        # Tests unitaires
npm run test:watch  # Mode watch
npm run test:cov    # Avec couverture
npm run test:e2e    # Tests E2E
```

---

### 3.15 Autres Bibliothèques Importantes

#### **TypeScript**
```json
"typescript": "^5.7.3"
```
Langage principal du projet. Ajoute le **typage statique** à JavaScript.

#### **Reflect Metadata**
```json
"reflect-metadata": "^0.2.2"
```
Requis par NestJS pour les **décorateurs** TypeScript. Permet la réflexion à runtime.

#### **RxJS**
```json
"rxjs": "^7.8.1"
```
Programmation réactive. Utilisé par NestJS pour gérer les flux asynchrones.

---

## 4. Base de données et Prisma

### 4.1 Schéma Prisma

Le fichier `prisma/schema.prisma` définit **tous les modèles** de données. Voici les principaux :

#### Architecture des Modèles

```
📦 PACKAGE 1 : ADMINISTRATION
├── Company (Entreprise)
├── Branch (Succursale)
├── User (Utilisateur)
├── Role (Rôle)
└── AuditLog (Journal d'audit)

📦 PACKAGE 2 : VENTES & FISCALITÉ
├── Invoice (Facture)
├── InvoiceLine (Ligne de facture)
├── Tax (Taxe/TVA)
├── Payment (Paiement)
└── CreditNote (Note de crédit)

📦 PACKAGE 3 : COMPTABILITÉ
├── Account (Compte comptable)
├── Journal (Journal comptable)
├── AccountingEntry (Écriture comptable)
├── EntryLine (Ligne d'écriture)
├── FiscalYear (Exercice fiscal)
└── CostCenter (Centre de coûts)

📦 PACKAGE 4 : RESSOURCES
├── ThirdParty (Client/Fournisseur)
├── Product (Produit)
└── StockMovement (Mouvement de stock)

📦 PACKAGE 5 : CONFORMITÉ DGI
├── ElectronicFiscalDevice (DEF)
└── DefTransmission (Transmission DGI)

📦 PACKAGE 6 : ÉTATS FINANCIERS OHADA
├── BalanceSheet (Bilan)
├── IncomeStatement (Compte de résultat)
└── CashFlowStatement (Flux de trésorerie)

📦 PACKAGE 7 : RH & BUDGETING
├── Employee (Employé)
├── PayrollPeriod (Période de paie)
├── Payslip (Bulletin de paie)
├── Budget (Budget)
└── BudgetLine (Ligne budgétaire)
```

### 4.2 Concepts Clés du Schéma

#### Multi-Tenancy (Isolation par Entreprise)

Chaque modèle important a un **`companyId`** :

```prisma
model Invoice {
  id        BigInt  @id @default(autoincrement())
  // ... autres champs
  
  companyId Int
  company   Company @relation(fields: [companyId], references: [id])
}
```

**Pourquoi ?** L'application gère **plusieurs entreprises**. Chaque requête filtre automatiquement par `companyId` pour garantir l'isolation des données.

#### Soft Delete

Certains modèles ont un champ `deletedAt` :

```prisma
model User {
  // ...
  deletedAt DateTime? @map("deleted_at")
}
```

**Pourquoi ?** Au lieu de supprimer physiquement, on marque comme "supprimé". Permet la traçabilité et la récupération.

#### Enums

Le schéma utilise des enums pour les états :

```prisma
enum InvoiceStatus {
  DRAFT     @map("BROUILLON")
  VALIDATED @map("VALIDEE")
  SIGNED    @map("SIGNEE")
  CANCELED  @map("ANNULEE")
}
```

**Pourquoi ?** Type-safety, évite les valeurs invalides, auto-complétion dans l'IDE.

#### Relations

Exemple de relations complexes :

```prisma
model Invoice {
  client         ThirdParty       @relation(fields: [clientId], references: [id])
  invoiceLines   InvoiceLine[]
  payments       Payment[]
  creditNote     CreditNote?      // One-to-One
  accountingEntry AccountingEntry? // One-to-One
}
```

### 4.3 Migrations Prisma

Les migrations permettent de **versionner le schéma** :

```bash
# Créer une migration après modification du schema.prisma
npx prisma migrate dev --name add_2fa_fields

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la DB (attention : supprime toutes les données)
npx prisma migrate reset
```

**Flux de travail :**

1. Modifier `schema.prisma`
2. Exécuter `prisma migrate dev` → Génère SQL + Applique
3. Commit le fichier de migration dans Git
4. En prod, exécuter `prisma migrate deploy`

### 4.4 Seeding

Le fichier `prisma/seed.ts` insère des **données initiales** :

```bash
npx prisma db seed
```

**Utilité** : Créer des rôles par défaut, un utilisateur admin, un plan comptable SYSCOHADA de base, etc.

### 4.5 Prisma Studio

Interface graphique pour explorer la DB :

```bash
npx prisma studio
```

Ouvre [http://localhost:5555](http://localhost:5555) avec une interface pour voir/éditer les données.

---

## 5. Modules et fonctionnalités

### 5.1 Module Auth (🔐 Authentification)

**Chemin** : `src/modules/auth/`

**Responsabilités** :

- Inscription et connexion des utilisateurs
- Génération et validation des JWT
- Authentification à deux facteurs (2FA)
- Gestion du verrouillage de compte (après X tentatives échouées)
- Récupération de mot de passe

**Endpoints principaux :**

```
POST /auth/register         # Créer un compte
POST /auth/login            # Se connecter → JWT
POST /auth/enable-2fa       # Activer 2FA
POST /auth/verify-2fa       # Vérifier code 2FA
POST /auth/refresh          # Rafraîchir le JWT
POST /auth/logout           # Se déconnecter
```

**Guards utilisés :**

- `JwtAuthGuard` : Vérifie que le JWT est valide
- `Public()` decorator : Exempte certaines routes de l'auth (login, register)

**Stratégie JWT :**

Définie dans `strategies/jwt.strategy.ts` :

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, companyId: payload.companyId };
  }
}
```

---

### 5.2 Module Administration (🏢 Gestion Administrative)

**Chemin** : `src/modules/administration/`

**Sous-modules :**

#### **Companies** (`companies/`)
- CRUD des entreprises
- Configuration MCF
- Logo de l'entreprise

#### **Branches** (`branches/`)
- Gestion des succursales
- Association utilisateurs ↔ succursales

#### **Users** (`users/`)
- CRUD utilisateurs
- Activation/Désactivation
- Réinitialisation de mot de passe

#### **Roles** (`roles/`)
- Gestion des rôles (ADMIN, ACCOUNTANT, CASHIER, etc.)
- Gestion des permissions JSON :

```json
{
  "sales": ["view", "create", "edit", "delete"],
  "accounting": ["view", "create"],
  "admin": ["view"]
}
```

#### **Audit Logs** (`audit-logs/`)
- Enregistrement automatique de toutes les actions critiques
- Interceptor `AuditLogInterceptor` qui log :
  - Action (CREATE, UPDATE, DELETE)
  - Table concernée
  - ID de l'objet
  - Anciennes/Nouvelles valeurs (JSON)
  - IP de l'utilisateur

#### **Setup** (`setup/`)
- Configuration initiale de l'entreprise
- Création du premier utilisateur admin
- Import du plan comptable SYSCOHADA

---

### 5.3 Module Sales (💰 Ventes et Fiscalité)

**Chemin** : `src/modules/sales/`

**Sous-modules :**

#### **Invoices** (`invoices/`)

Gestion complète du cycle de vie des factures :

**États d'une facture :**

```
DRAFT → VALIDATED → SIGNED → [CANCELED]
  ↓         ↓          ↓
Éditable  Fixée   Transmise DGI
```

**Flow de création de facture :**

1. Créer en mode DRAFT
2. Valider → Génère une écriture comptable automatiquement
3. Signer avec MCF → Transmission à la DGI → ISF retourné
4. (Optionnel) Annuler → Génère une note de crédit

**Champs fiscaux (DGI) :**

- `deviceNid` : ID du dispositif électronique fiscal
- `fiscalSecurityId` (ISF) : Identifiant unique DGI
- `mcfSignature` : Signature électronique MCF
- `qrCodeData` : QR code pour vérification

#### **Payments** (`payments/`)

Gestion des paiements liés aux factures :

- Modes : ESPÈCES, VIREMENT, MOBILE_MONEY
- Association facture ↔ paiement
- Génération automatique d'écriture comptable

#### **Credit Notes** (`credit-notes/`)

Notes de crédit (avoirs) pour annuler une facture :

- Lien 1-to-1 avec la facture originale
- Motif d'annulation obligatoire
- Signature MCF d'annulation

#### **Taxes** (`taxes/`)

Gestion des taxes (TVA, etc.) :

```typescript
{
  code: 'TVA_16',
  rate: 16,
  label: 'TVA 16%',
  isDeductible: true
}
```

---

### 5.4 Module Accounting (📊 Comptabilité SYSCOHADA)

**Chemin** : `src/modules/accounting/`

**Sous-modules :**

#### **Accounts** (`accounts/`)

Gestion du **plan comptable SYSCOHADA** :

**Classes SYSCOHADA :**

- **Classe 1** : Comptes de capitaux (capital, réserves)
- **Classe 2** : Comptes d'immobilisations
- **Classe 3** : Comptes de stocks
- **Classe 4** : Comptes de tiers (clients, fournisseurs)
- **Classe 5** : Comptes de trésorerie (banque, caisse)
- **Classe 6** : Comptes de charges
- **Classe 7** : Comptes de produits
- **Classe 8** : HAO (Hors Activités Ordinaires)
- **Classe 9** : Comptes analytiques

**Hiérarchie :**

```
1 (Capitaux)
├── 10 (Capital)
│   ├── 101 (Capital social)
│   └── 102 (Apports)
└── 11 (Réserves)
```

#### **Journals** (`journals/`)

Journaux comptables par type d'opération :

- **VT** : Ventes
- **HA** : Achats
- **BQ** : Banque
- **CA** : Caisse
- **OD** : Opérations Diverses
- **PA** : Paie
- etc.

#### **Entries** (`entries/`)

Écritures comptables :

**Principe de la partie double :**

Chaque écriture a au minimum 2 lignes : DÉBIT = CRÉDIT

```
Exemple: Vente de 1000 FC TTC (TVA 16%)
┌─────────────────────────────────────────┐
│ Journal: VT (Ventes)                    │
│ Date: 2026-01-06                        │
├─────────────┬───────┬─────────┬─────────┤
│ Compte      │ Débit │ Crédit  │ Libellé │
├─────────────┼───────┼─────────┼─────────┤
│ 411 Client  │ 1000  │         │ Facture │
│ 701 Ventes  │       │ 862.07  │ HT      │
│ 443 TVA     │       │ 137.93  │ TVA     │
└─────────────┴───────┴─────────┴─────────┘
Total:         1000     1000     ✅
```

**Génération automatique :**

Lorsqu'une facture est validée, une écriture comptable est **automatiquement générée**.

#### **Fiscal Years** (`fiscal-years/`)

Gestion des exercices fiscaux :

```typescript
{
  code: '2026',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  isClosed: false
}
```

**Clôture d'exercice** : Ferme l'exercice, empêche les modifications, génère les reports à nouveau.

#### **Cost Centers** (`cost-centers/`)

Centres de coûts pour la **comptabilité analytique** :

Permet de suivre les dépenses/revenus par centre :

- Succursale A
- Projet X
- Département Marketing
- etc.

#### **Reports** (`reports/`)

Génération des **états financiers OHADA** :

- **Bilan** : Actif (immobilisations, stocks, trésorerie) / Passif (capitaux, dettes)
- **Compte de résultat** : Charges / Produits = Résultat
- **Flux de trésorerie** : Activités opérationnelles, investissement, financement

---

### 5.5 Module Resources (📦 Ressources)

**Chemin** : `src/modules/resources/`

**Sous-modules :**

#### **Products** (`products/`)

Catalogue produits :

- Type : BIEN ou SERVICE
- SKU (référence)
- Prix de vente HT
- Prix d'achat HT
- Stock actuel
- Stock d'alerte
- Code-barres

#### **Third Parties** (`third-parties/`)

Gestion des tiers (clients et fournisseurs) :

```typescript
enum ThirdPartyType {
  CUSTOMER,  // Client
  SUPPLIER   // Fournisseur
}
```

Informations :

- NIF (Numéro d'Identification Fiscale)
- RCCM (Registre de Commerce)
- Adresse, téléphone, email
- Assujetti TVA ?
- Plafond de crédit

#### **Stock Movements** (`stock-movements/`)

Historique des mouvements de stock :

- Type : ENTRÉE ou SORTIE
- Quantité
- Coût Moyen Pondéré (CMP)
- Motif

**Méthode valorisation :** CMP (Coût Moyen Pondéré) conforme OHADA.

---

### 5.6 Module DGI (🏛️ Conformité Fiscale)

**Chemin** : `src/modules/dgi/`

**Sous-module :**

#### **Devices** (`devices/`)

Gestion des **Dispositifs Électroniques Fiscaux (DEF)** :

Types de DEF :

- **PHYSIQUE** : Matériel physique (e-UF, e-MCF)
- **DÉMATÉRIALISÉ** : API intégrée au logiciel

**Configuration :**

```typescript
{
  defNid: 'DEF123456',        // ID DGI
  type: 'DEMATERIALIZED',
  status: 'ACTIVE',
  apiEndpoint: 'https://api.dgi.cd',
  apiKey: '***',
  certificate: '***'
}
```

**Transmission DGI :**

Le modèle `DefTransmission` enregistre chaque tentative d'envoi à la DGI :

- Payload de la requête
- Réponse de la DGI
- Statut (EN_ATTENTE, VALIDÉE, REJETÉE)
- ISF retourné

---

### 5.7 Module HR (👥 Ressources Humaines)

**Chemin** : `src/modules/hr/`

Gestion des employés et de la paie :

- Employés (nom, poste, salaire)
- Périodes de paie (mensuelle, etc.)
- Bulletins de paie (salaire brut, cotisations, net à payer)
- Génération d'écritures comptables pour la paie

---

### 5.8 Module Budgeting (📈 Gestion Budgétaire)

**Chemin** : `src/modules/budgeting/`

Suivi budgétaire par compte et exercice :

- Définir un budget prévisionnel
- Comparer budget vs réel
- Alertes de dépassement

---

### 5.9 Module Sync (🔄 Synchronisation)

**Chemin** : `src/modules/sync/`

Synchronisation avec des systèmes externes :

- Import/Export de données
- Intégration avec d'autres logiciels comptables
- APIs tierces

---

## 6. Patterns et bonnes pratiques

### 6.1 Architecture Modulaire

Chaque fonctionnalité est un **module NestJS** indépendant :

```
Module
  ├── Controller (Routes HTTP)
  ├── Service (Logique métier)
  ├── DTOs (Validation)
  └── Entities (Prisma models)
```

**Avantages :**

- **Séparation des responsabilités**
- **Testabilité** : Mock facilement
- **Réutilisabilité**
- **Scalabilité**

### 6.2 DTOs (Data Transfer Objects)

Les DTOs définissent la **structure des données** entrantes/sortantes :

```typescript
// create-invoice.dto.ts
export class CreateInvoiceDto {
  @IsString()
  internalReference: string;

  @IsInt()
  clientId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines: CreateInvoiceLineDto[];
}
```

**Pourquoi ?**

- **Validation automatique** avec class-validator
- **Documentation Swagger** automatique
- **Type safety**

### 6.3 Guards

Les guards contrôlent **qui** peut accéder à quoi :

#### **JwtAuthGuard**

Vérifie que le JWT est valide. Appliqué globalement.

```typescript
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard }
  ]
})
```

Pour exempter une route :

```typescript
@Public()
@Post('login')
async login() { ... }
```

#### **TenancyGuard**

Extrait le `companyId` du JWT et le stocke dans le contexte CLS.

#### **PermissionsGuard**

Vérifie que l'utilisateur a la permission requise :

```typescript
@Permissions('sales:create')
@Post()
async create() { ... }
```

### 6.4 Interceptors

Les interceptors transforment les requêtes/réponses :

#### **AuditLogInterceptor**

Enregistre automatiquement toutes les actions :

```typescript
@UseInterceptors(AuditLogInterceptor)
@Put(':id')
async update() { ... }
```

#### **BigIntInterceptor**

Convertit les `BigInt` en `string` pour JSON :

```typescript
// PostgreSQL BIGINT → JavaScript BigInt → JSON string
// Sinon : JSON.stringify() crash sur BigInt
```

### 6.5 Service Layer Pattern

Toute la logique métier est dans les **services**, pas dans les contrôleurs :

```typescript
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }
}
```

**Pourquoi ?**

- Contrôleurs **minimalistes** : routing uniquement
- Services **testables** indépendamment
- Réutilisation de la logique

### 6.6 Error Handling

NestJS gère automatiquement les erreurs via des **filters** :

```typescript
throw new NotFoundException('Invoice not found');
throw new BadRequestException('Invalid data');
throw new UnauthorizedException('Access denied');
```

Renvoie automatiquement les bons codes HTTP (404, 400, 401).

### 6.7 Soft Delete

Au lieu de supprimer physiquement :

```typescript
async softDelete(id: number) {
  return this.prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}
```

Toutes les requêtes ajoutent automatiquement `where: { deletedAt: null }`.

---

## 7. Configuration et déploiement

### 7.1 Variables d'Environnement

Créer un fichier `.env` à la racine :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/milele_db?schema=public"

# JWT
JWT_SECRET="votre_secret_super_securise"
JWT_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV=development

# DGI API (optionnel)
DGI_API_URL="https://api.dgi.cd"
DGI_API_KEY="votre_cle_api"
```

### 7.2 Docker Compose

Pour lancer l'environnement complet :

```bash
docker-compose up -d
```

Démarre :

- PostgreSQL sur le port 5432
- Backend sur le port 3000

### 7.3 Scripts NPM

```bash
# Développement
npm run start:dev        # Mode watch (hot reload)

# Build
npm run build            # Compile TypeScript → dist/

# Production
npm run start:prod       # Démarre depuis dist/

# Prisma
npx prisma migrate dev   # Créer/Appliquer migrations
npx prisma generate      # Générer le client Prisma
npx prisma studio        # Interface graphique DB
npx prisma db seed       # Peupler la DB

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E
npm run test:cov         # Couverture

# Linting
npm run lint             # ESLint
npm run format           # Prettier
```

### 7.4 Déploiement en Production

#### Étapes recommandées :

1. **Build** :
   ```bash
   npm run build
   ```

2. **Migrations** :
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed** (optionnel) :
   ```bash
   npx prisma db seed
   ```

4. **Démarrage** :
   ```bash
   npm run start:prod
   ```

#### Variables d'environnement Production :

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="secret_complexe_et_long"
```

#### Recommandations :

- Utiliser un **reverse proxy** (Nginx)
- Activer **HTTPS** (Let's Encrypt)
- Utiliser un **process manager** (PM2)
- Configurer des **logs** (Winston, Pino)
- Monitoring (Prometheus, Grafana)

---

## 8. Guide de contribution

### 8.1 Comment ajouter un nouveau module ?

#### Exemple : Créer un module "Inventory"

1. **Générer le module avec NestJS CLI** :

   ```bash
   nest generate module modules/inventory
   nest generate controller modules/inventory
   nest generate service modules/inventory
   ```

2. **Créer le modèle Prisma** :

   Modifier `prisma/schema.prisma` :

   ```prisma
   model InventoryItem {
     id        Int      @id @default(autoincrement())
     name      String
     quantity  Int
     companyId Int
     company   Company  @relation(fields: [companyId], references: [id])
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

3. **Créer la migration** :

   ```bash
   npx prisma migrate dev --name add_inventory
   ```

4. **Créer les DTOs** :

   `modules/inventory/dto/create-inventory-item.dto.ts` :

   ```typescript
   import { IsString, IsInt, Min } from 'class-validator';

   export class CreateInventoryItemDto {
     @IsString()
     name: string;

     @IsInt()
     @Min(0)
     quantity: number;
   }
   ```

5. **Implémenter le service** :

   ```typescript
   @Injectable()
   export class InventoryService {
     constructor(private prisma: PrismaService) {}

     async create(dto: CreateInventoryItemDto, companyId: number) {
       return this.prisma.inventoryItem.create({
         data: { ...dto, companyId }
       });
     }

     async findAll(companyId: number) {
       return this.prisma.inventoryItem.findMany({
         where: { companyId }
       });
     }
   }
   ```

6. **Implémenter le contrôleur** :

   ```typescript
   @Controller('inventory')
   @ApiTags('Inventory')
   export class InventoryController {
     constructor(private inventoryService: InventoryService) {}

     @Post()
     @Permissions('inventory:create')
     async create(@Body() dto: CreateInventoryItemDto, @Req() req) {
       return this.inventoryService.create(dto, req.user.companyId);
     }

     @Get()
     @Permissions('inventory:view')
     async findAll(@Req() req) {
       return this.inventoryService.findAll(req.user.companyId);
     }
   }
   ```

7. **Importer dans `AppModule`** :

   ```typescript
   @Module({
     imports: [
       // ...
       InventoryModule,
     ],
   })
   export class AppModule {}
   ```

### 8.2 Comment modifier le schéma Prisma ?

1. **Modifier `schema.prisma`**

2. **Créer une migration** :
   ```bash
   npx prisma migrate dev --name nom_descriptif
   ```

3. **Vérifier la migration générée** dans `prisma/migrations/`

4. **Régénérer le client Prisma** (automatique avec migrate dev) :
   ```bash
   npx prisma generate
   ```

5. **Commit la migration** avec le code

### 8.3 Comment écrire des tests ?

#### Test Unitaire (Service) :

```typescript
describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: {
            invoice: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create an invoice', async () => {
    const dto = { /* ... */ };
    jest.spyOn(prisma.invoice, 'create').mockResolvedValue({ id: 1, /* ... */ });

    const result = await service.create(dto, 1);
    expect(result).toBeDefined();
    expect(prisma.invoice.create).toHaveBeenCalled();
  });
});
```

#### Test E2E (Route complète) :

```typescript
describe('InvoicesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/invoices (GET)', () => {
    return request(app.getHttpServer())
      .get('/invoices')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 8.4 Conventions de nommage

#### Fichiers :

- **Modules** : `inventory.module.ts`
- **Controllers** : `inventory.controller.ts`
- **Services** : `inventory.service.ts`
- **DTOs** : `create-inventory.dto.ts`, `update-inventory.dto.ts`
- **Entities** : Définis dans `schema.prisma`

#### Classes :

- **PascalCase** : `InvoiceService`, `CreateInvoiceDto`

#### Variables/Fonctions :

- **camelCase** : `findAll()`, `invoiceId`

#### Constantes :

- **UPPER_SNAKE_CASE** : `DATABASE_URL`, `JWT_SECRET`

#### Routes API :

- **kebab-case** : `/api/third-parties`, `/api/accounting-entries`

### 8.5 Bonnes pratiques

1. **Toujours valider les DTOs** avec class-validator
2. **Toujours filtrer par `companyId`** pour le multi-tenancy
3. **Toujours gérer les erreurs** (try/catch, throw HttpExceptions)
4. **Documenter avec Swagger** (`@ApiTags`, `@ApiOperation`)
5. **Écrire des tests** pour les fonctionnalités critiques
6. **Versionner les migrations Prisma**
7. **Ne jamais commit les secrets** (`.env` dans `.gitignore`)

### 8.6 Debugging

#### Logs :

NestJS utilise un logger intégré :

```typescript
import { Logger } from '@nestjs/common';

export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  async create(dto) {
    this.logger.log('Creating invoice...');
    // ...
  }
}
```

#### Prisma Debug :

Activer les logs Prisma :

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

#### VSCode Debug :

Configuration `.vscode/launch.json` :

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach NestJS",
  "port": 9229
}
```

Puis :

```bash
npm run start:debug
```

---

## 🎯 Conclusion

Ce guide couvre l'essentiel pour comprendre, maintenir et développer l'API backend de MILELE. Vous savez maintenant :

✅ **L'architecture globale** du projet
✅ **Chaque bibliothèque** et pourquoi elle est utilisée
✅ **La structure du code** et des modules
✅ **Le schéma de base de données** Prisma
✅ **Les patterns utilisés** (Guards, Interceptors, DTOs)
✅ **Comment contribuer** (ajouter un module, modifier le schéma, tester)

### 📚 Ressources Complémentaires

- [Documentation NestJS](https://docs.nestjs.com/)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [SYSCOHADA - Plan comptable](https://syscohada.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 🤝 Support

Pour toute question, bug ou suggestion :

1. Consulter la documentation Swagger : [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
2. Lire les fichiers `MODELING.md`, `API_DOCUMENTATION.md`
3. Contacter l'équipe de développement

**Bon développement ! 🚀**
