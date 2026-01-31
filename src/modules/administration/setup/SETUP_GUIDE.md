# Système d'Initialisation (Onboarding)

Ce module permet de configurer le système lors de sa première utilisation. Il crée l'entreprise par défaut, le super-administrateur, et l'exercice fiscal initial.

## Fichiers Clés

- **Logic (Service)** : [`src/modules/administration/setup/setup.service.ts`](file:///d:/MILELE%20SOFTEWAR/milele-backend/src/modules/administration/setup/setup.service.ts)
- **Route (Controller)** : [`src/modules/administration/setup/setup.controller.ts`](file:///d:/MILELE%20SOFTEWAR/milele-backend/src/modules/administration/setup/setup.controller.ts)
- **Validation (DTO)** : [`src/modules/administration/setup/dto/initialize.dto.ts`](file:///d:/MILELE%20SOFTEWAR/milele-backend/src/modules/administration/setup/dto/initialize.dto.ts)

## Paramètres de l'Initialisation

Les données envoyées lors de l'onboarding sont validées par le fichier `initialize.dto.ts`. Voici les champs principaux :

| Champ | Description | Exemple |
| :--- | :--- | :--- |
| `adminFirstName` | Prénom de l'admin | Félicien |
| `adminLastName` | Nom de l'admin | MUKAMBA |
| `adminEmail` | Email de connexion | admin@milele.cd |
| `adminPassword` | Mot de passe | StrongPassword123 |
| `companyName` | Nom de l'entreprise | MILELE SARL |
| `taxId` | NIF (Numéro d'Identification Fiscale) | A1234567B |

## Comment Modifier

### 1. Changer la Logique d'Initialisation
Si vous voulez changer ce qui est créé par défaut (ex: ajouter des journaux comptables ou d'autres rôles), modifiez la méthode `initialize()` dans le fichier :
[`src/modules/administration/setup/setup.service.ts`](file:///d:/MILELE%20SOFTEWAR/milele-backend/src/modules/administration/setup/setup.service.ts)

### 2. Ajouter ou Supprimer des Champs
Si vous voulez que l'utilisateur saisisse plus d'informations (ex: logo, devise par défaut), vous devez :
1. Ajouter le champ dans [`src/modules/administration/setup/dto/initialize.dto.ts`](file:///d:/MILELE%20SOFTEWAR/milele-backend/src/modules/administration/setup/dto/initialize.dto.ts)
2. Mettre à jour la logique de création dans [`src/modules/administration/setup/setup.service.ts`](file:///d:/MILELE%20SOFTEWAR/milele-backend/src/modules/administration/setup/setup.service.ts)

### 3. Changer la Route (URL)
La route est définie par le `@Controller('admin')` et `@Post('initialize')` dans :
[`src/modules/administration/setup/setup.controller.ts`](file:///d:/MILELE%20SOFTEWAR/milele-backend/src/modules/administration/setup/setup.controller.ts)

L'URL complète actuelle est : `POST /api/v1/admin/initialize`
