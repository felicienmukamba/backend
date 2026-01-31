# MILELE Accounting Software - Backend

> **API NestJS pour le logiciel de comptabilité MILELE**

Backend robuste et scalable avec NestJS, Prisma, PostgreSQL, et architecture modulaire conforme aux standards OHADA/DGI.

---

## 📚 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Stack Technique](#-stack-technique)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Scripts Disponibles](#-scripts-disponibles)
- [Structure du Projet](#-structure-du-projet)
- [Base de Données](#-base-de-données)
- [Modules Métier](#-modules-métier)
- [Authentification & Sécurité](#-authentification--sécurité)
- [API Documentation](#-api-documentation)
- [Tests](#-tests)
- [Déploiement](#-déploiement)

---

## 🎯 Vue d'ensemble

MILELE Backend est une API RESTful construite avec NestJS qui gère :

- ✅ **Comptabilité OHADA** (SYSCOHADA révisé)
- ✅ **Conformité DGI RDC** (DEF, MCF, ISF)
- ✅ **Facturation électronique**
- ✅ **Gestion RH et Paie**
- ✅ **Multi-tenant** avec isolation totale
- ✅ **Audit Logs** complets
- ✅ **RBAC** (Role-Based Access Control)

---

## 🛠 Stack Technique

### Core Framework
- **NestJS 10** - Framework Node.js progressif
- **TypeScript** - Typage statique
- **Prisma** - ORM moderne

### Base de Données
- **PostgreSQL** - Base de données relationnelle
- **Redis** (optionnel) - Cache et sessions

### Authentification
- **Passport.js** - Stratégies d'authentification
- **JWT** - JSON Web Tokens
- **bcrypt** - Hashage de mots de passe

### Validation
- **class-validator** - Validation des DTOs
- **class-transformer** - Transformation des données

### Documentation
- **Swagger** - Documentation API interactive

### Tests
- **Jest** - Framework de tests

---

## 🏗 Architecture

### Architecture Modulaire

```
src/
├── main.ts                  # Point d'entrée
├── app.module.ts            # Module racine
├── prisma/                  # Service Prisma global
├── modules/                 # Modules métier
│   ├── auth/
│   ├── administration/
│   │   ├── users/
│   │   ├── roles/
│   │   └── branches/
│   ├── accounting/
│   │   ├── accounts/
│   │   ├── journal-entries/
│   │   └── reports/
│   ├── sales/
│   │   ├── invoices/
│   │   ├── customers/
│   │   └── payments/
│   ├── hr/
│   │   ├── employees/
│   │   ├── payroll/
│   │   └── leaves/
│   ├── dgi/
│   │   ├── declarations/
│   │   └── transmissions/
│   ├── budgeting/
│   ├── resources/
│   └── sync/
└── common/                  # Code partagé
    ├── guards/
    ├── decorators/
    ├── filters/
    └── interceptors/
```

### Principes Architecturaux

1. **Séparation des préoccupations** (Controller → Service → Repository)
2. **Injection de dépendances** (NestJS DI)
3. **Validation en amont** (DTOs + class-validator)
4. **Gestion d'erreurs centralisée** (Exception Filters)
5. **Logging structuré**

---

## 🚀 Installation

### Prérequis

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** >= 9.x

### Étapes

```bash
# 1. Cloner le repository
git clone <repo-url>
cd milele-backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env

# 4. Configurer les variables d'environnement
# Éditer .env avec vos valeurs

# 5. Créer la base de données
createdb milele_db

# 6. Exécuter les migrations Prisma
npx prisma migrate dev

# 7. Seeder la base de données (optionnel)
npx prisma db seed

# 8. Lancer le serveur de développement
npm run start:dev
```

L'API sera disponible sur `http://localhost:3000`

### Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/milele_db"

# JWT
JWT_SECRET="votre-secret-très-sécurisé"
JWT_EXPIRES_IN="1d"

# API
PORT=3000
NODE_ENV=development

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📜 Scripts Disponibles

```bash
# Développement
npm run start:dev              # Hot-reload avec Nest
npm run start:debug            # Mode debug

# Build
npm run build                  # Compile TypeScript
npm run start:prod             # Lance en production

# Prisma
npx prisma studio              # Interface graphique pour la DB
npx prisma migrate dev         # Créer/appliquer migrations
npx prisma generate            # Générer le client Prisma
npx prisma db seed             # Seeder la DB

# Tests
npm run test                   # Tests unitaires
npm run test:watch             # Watch mode
npm run test:cov               # Couverture de code
npm run test:e2e               # Tests E2E

# Linting & Formatting
npm run lint                   # ESLint
npm run format                 # Prettier
```

---

## 📁 Structure du Projet

### Module Exemple : `modules/auth/`

```
auth/
├── auth.module.ts             # Configuration du module
├── auth.controller.ts         # Routes HTTP
├── auth.service.ts            # Logique métier
├── dto/
│   ├── login.dto.ts           # DTO pour login
│   └── register.dto.ts        # DTO pour register
├── guards/
│   ├── jwt-auth.guard.ts      # Protection JWT
│   └── roles.guard.ts         # Protection RBAC
├── strategies/
│   └── jwt.strategy.ts        # Stratégie Passport JWT
└── permissions.ts             # Définition des permissions
```

### Controller Example

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return user;
  }
}
```

### Service Example

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { sub: user.id, email: user.email, roleId: user.roleId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }
}
```

---

## 🗄 Base de Données

### Schéma Prisma

Le fichier `prisma/schema.prisma` définit tous les modèles :

```prisma
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  firstName    String
  lastName     String
  username     String
  passwordHash String
  isActive     Boolean  @default(true)
  
  roleId    Int
  role      Role     @relation(fields: [roleId], references: [id])
  
  companyId Int
  company   Company  @relation(fields: [companyId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Role {
  id          Int    @id @default(autoincrement())
  code        String // 'ADMIN', 'ACCOUNTANT', etc.
  label       String
  permissions Json   // { "invoices:read": true, ... }
  
  users User[]
  
  companyId Int
  company   Company @relation(fields: [companyId], references: [id])
  
  @@unique([code, companyId])
}
```

### Migrations

```bash
# Créer une migration
npx prisma migrate dev --name add_audit_logs

# Appliquer en production
npx prisma migrate deploy

# Réinitialiser la DB (DEV ONLY)
npx prisma migrate reset
```

### Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Créer une entreprise par défaut
  const company = await prisma.company.create({
    data: {
      companyName: 'MILELE SAS',
      rccm: 'CD/KIN/RCCM/XXX',
      nationalId: 'XXX',
      taxId: 'A123456789',
      // ...
    },
  });

  // Créer un rôle admin
  const adminRole = await prisma.role.create({
    data: {
      code: 'ADMIN',
      label: 'Administrateur',
      permissions: { '*': true },
      companyId: company.id,
    },
  });

  // Créer un utilisateur admin
  await prisma.user.create({
    data: {
      email: 'admin@milele.app',
      username: 'admin',
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: await bcrypt.hash('password123', 10),
      roleId: adminRole.id,
      companyId: company.id,
    },
  });
}

main();
```

---

## 📦 Modules Métier

### Administration
- **Users** : Gestion des utilisateurs
- **Roles** : Gestion des rôles et permissions
- **Branches** : Gestion des succursales
- **Audit Logs** : Traçabilité complète

### Accounting (OHADA)
- **Chart of Accounts** : Plan comptable SYSCOHADA
- **Journal Entries** : Écritures comptables
- **Ledger** : Grand livre
- **Reports** : Bilan, Compte de résultat, Trésorerie

### Sales
- **Invoices** : Facturation conforme DGI
- **Customers** : Gestion des clients
- **Payments** : Encaissements

### HR
- **Employees** : Gestion du personnel
- **Payroll** : Paie et bulletins
- **Leaves** : Gestion des congés

### DGI Compliance
- **Declarations** : Déclarations fiscales
- **DEF Transmissions** : Dispositif Électronique Fiscal
- **MCF Signatures** : Machine à Calculer Fiscale

---

## 🔐 Authentification & Sécurité

### JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true, company: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

### Guards

**JwtAuthGuard** : Vérifie le token JWT
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtectedData() {
  return { message: 'Accès autorisé' };
}
```

**RolesGuard** : Vérifie les permissions
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@Get('admin-only')
getAdminData() {
  return { message: 'Admin uniquement' };
}
```

### Permissions

```typescript
// modules/auth/permissions.ts
export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  INVOICES_READ: 'invoices:read',
  INVOICES_WRITE: 'invoices:write',
  INVOICES_VALIDATE: 'invoices:validate',
  // ...
};

export const DEFAULT_ROLES = {
  ADMIN: {
    label: 'Administrateur',
    permissions: ['*'], // Tous les droits
  },
  ACCOUNTANT: {
    label: 'Comptable',
    permissions: [
      PERMISSIONS.ACCOUNTS_READ,
      PERMISSIONS.ACCOUNTS_WRITE,
      PERMISSIONS.ENTRIES_READ,
      // ...
    ],
  },
};
```

---

## 📚 API Documentation

### Swagger UI

Accédez à la documentation interactive Swagger :

```
http://localhost:3000/api
```

### Exemples de Requêtes

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Créer une facture**
```http
POST /invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": 1,
  "currency": "USD",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 100
    }
  ]
}
```

---

## 🧪 Tests

### Tests Unitaires

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should validate user credentials', async () => {
    const result = await service.login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result).toHaveProperty('accessToken');
  });
});
```

### Tests E2E

```typescript
describe('Auth API (e2e)', () => {
  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
      });
  });
});
```

---

## 🚢 Déploiement

### Build Production

```bash
npm run build
npm run start:prod
```

### Variables d'Environnement Production

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@prod-server:5432/milele_prod"
JWT_SECRET="secret-très-sécurisé-en-production"
PORT=3000
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Plateformes Recommandées

- **AWS ECS / EC2**
- **Google Cloud Run**
- **DigitalOcean App Platform**
- **Heroku**

---

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/nouvelle-fonctionnalite`
2. Commiter : `git commit -m "feat: ajoute X"`
3. Pusher : `git push origin feature/nouvelle-fonctionnalite`
4. Ouvrir une Pull Request

---

## 📞 Support

Pour toute question :
- **Email** : dev@milele.app
- **Documentation** : docs.milele.app

---

## 📄 License

Propriétaire - MILELE SAS © 2026

---

## 🚀 Dernières Mises à Jour (Janvier 2026)

### 🧩 Core & Stabilité
- **Amélioration des Imports Excel** : 
    - Nettoyage automatique des caractères invisibles et BOM.
    - Traitement ligne par ligne pour permettre des imports partiels en cas d'erreurs localisées.
    - Déduction automatique de la classe comptable via le numéro de compte.
### 💰 Module Ventes & Totaux
- **Sécurisation de la Sérialisation (Fix `[object Object]` - Solution Blindée)** :
    - **Problème** : Les objets `Decimal` de Prisma perdaient leurs méthodes de conversion lors du passage par l'API, arrivant sur le frontend comme des objets bruts non-numériques.
    - **Solution** : Le `TransformInterceptor` a été optimisé pour détecter récursivement toute structure ressemblant à un `Decimal` (via constructeur ou propriétés `d, s, e`) et la convertir en `Number` nativement.
- **Calculs Serveur** : Recalcul systématique des totaux pour assurer l'intégrité avant signature fiscale DGI.


- **Centralisation du CompanyID** : Standardisation de la récupération du `companyId` via le contexte d'authentification pour éviter les erreurs de contexte.

