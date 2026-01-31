-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('NORMAL', 'AVOIR');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('BROUILLON', 'VALIDEE', 'SIGNEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ESPECES', 'VIREMENT', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('VT', 'HA', 'BQ', 'CA', 'OD', 'PA', 'IM', 'ST', 'FO', 'CL', 'SO', 'FI', 'AN');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('PROVISOIRE', 'VALIDEE');

-- CreateEnum
CREATE TYPE "ThirdPartyType" AS ENUM ('CLIENT', 'FOURNISSEUR');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BIEN', 'SERVICE');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTREE', 'SORTIE');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('BROUILLON', 'ENVOYE', 'PARTIELLEMENT_RECU', 'RECU', 'ANNULE');

-- CreateEnum
CREATE TYPE "DefType" AS ENUM ('PHYSIQUE', 'DEMATERIALISE');

-- CreateEnum
CREATE TYPE "DefStatus" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU', 'REVOQUE');

-- CreateEnum
CREATE TYPE "TransmissionStatus" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'VALIDEE', 'REJETEE', 'TIMEOUT');

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "raison_sociale" TEXT NOT NULL,
    "rccm" TEXT NOT NULL,
    "id_nat" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "adresse_siege" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "regime_fiscal" TEXT NOT NULL,
    "centre_fiscal" TEXT NOT NULL,
    "logo" BYTEA,
    "config_mcf" JSONB,
    "est_actif" BOOLEAN NOT NULL DEFAULT false,
    "devise_par_defaut" TEXT NOT NULL DEFAULT 'USD',
    "fuseau_horaire" TEXT NOT NULL DEFAULT 'Africa/Kinshasa',
    "format_date" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "debut_exercice_fiscal" TEXT NOT NULL DEFAULT '01-01',
    "couleur_primaire" TEXT NOT NULL DEFAULT '#8b5cf6',
    "couleur_secondaire" TEXT NOT NULL DEFAULT '#06b6d4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "nom_succursale" TEXT NOT NULL,
    "code_succursale" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "ville" TEXT,
    "companyId" INTEGER NOT NULL,
    "est_principale" BOOLEAN NOT NULL DEFAULT false,
    "est_actif" BOOLEAN NOT NULL DEFAULT false,
    "devise_par_defaut" TEXT NOT NULL DEFAULT 'USD',
    "fuseau_horaire" TEXT NOT NULL DEFAULT 'Africa/Kinshasa',
    "format_date" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "debut_exercice_fiscal" TEXT NOT NULL DEFAULT '01-01',
    "couleur_primaire" TEXT NOT NULL DEFAULT '#8b5cf6',
    "couleur_secondaire" TEXT NOT NULL DEFAULT '#06b6d4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "est_saas_admin" BOOLEAN NOT NULL DEFAULT false,
    "dernier_login" TIMESTAMP(3),
    "two_factor_secret" TEXT,
    "est_2fa_active" BOOLEAN NOT NULL DEFAULT false,
    "codes_recuperation_2fa" JSONB NOT NULL DEFAULT '[]',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "permissions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_adresse" TEXT,
    "user_agent" TEXT,
    "userId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" BIGSERIAL NOT NULL,
    "numero_facture" TEXT NOT NULL,
    "reference_interne" TEXT,
    "date_emission" TIMESTAMP(3) NOT NULL,
    "heure_emission" TEXT NOT NULL,
    "type_facture" "InvoiceType" NOT NULL,
    "devise" TEXT NOT NULL,
    "taux_change" DECIMAL(10,4) NOT NULL,
    "montant_ht" DECIMAL(15,2) NOT NULL,
    "montant_tva" DECIMAL(15,2) NOT NULL,
    "montant_ttc" DECIMAL(15,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'BROUILLON',
    "id_dispositif" TEXT,
    "def_nid" TEXT,
    "isf" TEXT,
    "compteur_facture" BIGINT,
    "compteur_jour" INTEGER,
    "mcf_signature" TEXT,
    "mcf_date_signature" TEXT,
    "mcf_compteur_signature" TEXT,
    "cnf_code" TEXT,
    "code_qr_data" TEXT,
    "nom_vendeur" TEXT NOT NULL DEFAULT '',
    "adresse_vendeur" TEXT NOT NULL DEFAULT '',
    "nif_vendeur" TEXT NOT NULL DEFAULT '',
    "rccm_vendeur" TEXT,
    "telephone_vendeur" TEXT NOT NULL DEFAULT '',
    "observation" TEXT,
    "deleted_at" TIMESTAMP(3),
    "clientId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" BIGSERIAL NOT NULL,
    "quantite" DECIMAL(15,3) NOT NULL,
    "prix_unitaire" DECIMAL(15,2) NOT NULL,
    "taux_remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montant_remise" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "montant_ht_net" DECIMAL(15,2) NOT NULL,
    "montant_tva" DECIMAL(15,2) NOT NULL,
    "montant_ttc" DECIMAL(15,2) NOT NULL,
    "description_produit" TEXT NOT NULL,
    "invoiceId" BIGINT NOT NULL,
    "productId" INTEGER NOT NULL,
    "taxId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tax" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "taux" DOUBLE PRECISION NOT NULL,
    "libelle" TEXT NOT NULL,
    "est_deductible" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" BIGSERIAL NOT NULL,
    "date_paiement" TIMESTAMP(3) NOT NULL,
    "montant_paye" DECIMAL(15,2) NOT NULL,
    "mode" "PaymentMethod" NOT NULL,
    "reference_paiement_externe" TEXT,
    "observation" TEXT,
    "invoiceId" BIGINT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" BIGSERIAL NOT NULL,
    "numero_note" TEXT NOT NULL,
    "date_emission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif_annulation" TEXT NOT NULL,
    "signature_mcf_annulation" TEXT,
    "invoiceId" BIGINT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "numero_compte" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "classe_compte" INTEGER NOT NULL,
    "compte_parent_id" INTEGER,
    "niveau" INTEGER NOT NULL,
    "est_bilan" BOOLEAN NOT NULL DEFAULT false,
    "est_compte_resultat" BOOLEAN NOT NULL DEFAULT false,
    "est_hao" BOOLEAN NOT NULL DEFAULT false,
    "est_analytique" BOOLEAN NOT NULL DEFAULT false,
    "type" "AccountType" NOT NULL,
    "est_lettrable" BOOLEAN NOT NULL DEFAULT false,
    "est_auxiliaire" BOOLEAN NOT NULL DEFAULT false,
    "sens_normal" TEXT NOT NULL DEFAULT 'DEBIT',
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type_journal" "JournalType" NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" BIGSERIAL NOT NULL,
    "numero_piece" TEXT NOT NULL,
    "date_ecriture" TIMESTAMP(3) NOT NULL,
    "libelle_ecriture" TEXT NOT NULL,
    "etat" "EntryStatus" NOT NULL DEFAULT 'PROVISOIRE',
    "deleted_at" TIMESTAMP(3),
    "devise" TEXT NOT NULL DEFAULT 'FC',
    "taux_change" DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    "journalId" INTEGER NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "invoiceId" BIGINT,
    "paymentId" BIGINT,
    "createdById" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payslipId" TEXT,
    "branchId" INTEGER,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryLine" (
    "id" BIGSERIAL NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "debit_local" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "credit_local" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "libelle_ligne" TEXT NOT NULL,
    "lettre_lettrage" TEXT,
    "date_lettrage" TIMESTAMP(3),
    "entryId" BIGINT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "thirdPartyId" INTEGER,
    "costCenterId" INTEGER,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "EntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "est_cloture" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "centre_parent_id" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'PRINCIPAL',
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdParty" (
    "id" SERIAL NOT NULL,
    "type" "ThirdPartyType" NOT NULL,
    "nom_raison_sociale" TEXT NOT NULL,
    "nif" TEXT,
    "rccm" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "est_assujetti_tva" BOOLEAN NOT NULL DEFAULT false,
    "plafond_credit" DECIMAL(15,2),
    "deleted_at" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "ThirdParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "reference_sku" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "type_produit" "ProductType" NOT NULL,
    "prix_vente_ht" DECIMAL(15,2) NOT NULL,
    "prix_achat_ht" DECIMAL(15,2) NOT NULL,
    "stock_actuel" INTEGER NOT NULL DEFAULT 0,
    "stock_alerte" INTEGER NOT NULL DEFAULT 0,
    "code_barre" TEXT,
    "deleted_at" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" BIGSERIAL NOT NULL,
    "date_mouvement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type_mouvement" "StockMovementType" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "cout_unitaire_cmp" DECIMAL(15,2) NOT NULL,
    "motif" TEXT,
    "productId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "third_party_id" INTEGER,
    "reference_document" TEXT,
    "stock_reception_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" VARCHAR(36) NOT NULL,
    "numero_commande" TEXT NOT NULL,
    "fournisseur_id" INTEGER NOT NULL,
    "date_commande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_livraison_prevue" TIMESTAMP(3),
    "statut" "PurchaseOrderStatus" NOT NULL DEFAULT 'BROUILLON',
    "montant_total" DECIMAL(15,2) NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "company_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "branchId" INTEGER,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" VARCHAR(36) NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(15,2) NOT NULL,
    "quantite_recue" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReception" (
    "id" VARCHAR(36) NOT NULL,
    "numero_reception" TEXT NOT NULL,
    "purchase_order_id" TEXT,
    "fournisseur_id" INTEGER NOT NULL,
    "date_reception" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_document" TEXT,
    "notes" TEXT,
    "company_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "branchId" INTEGER,

    CONSTRAINT "StockReception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicFiscalDevice" (
    "id" SERIAL NOT NULL,
    "def_nid" TEXT NOT NULL,
    "numero_serie" TEXT,
    "type_def" "DefType" NOT NULL,
    "statut" "DefStatus" NOT NULL DEFAULT 'ACTIF',
    "url_api" TEXT,
    "cle_api" TEXT,
    "certificat" TEXT,
    "total_factures" BIGINT NOT NULL DEFAULT 0,
    "derniere_facture_date" TIMESTAMP(3),
    "date_activation" TIMESTAMP(3) NOT NULL,
    "derniere_synchro" TIMESTAMP(3),
    "date_expiration" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "ElectronicFiscalDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefTransmission" (
    "id" BIGSERIAL NOT NULL,
    "invoiceId" BIGINT NOT NULL,
    "defId" INTEGER,
    "status" "TransmissionStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "id_facture_dgi" TEXT,
    "isf" TEXT,
    "code_qr" TEXT,
    "url_pdf" TEXT,
    "payload_requete" JSONB NOT NULL,
    "payload_reponse" JSONB,
    "message_erreur" TEXT,
    "code_erreur" TEXT,
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 1,
    "date_transmission" TIMESTAMP(3),
    "date_validation" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefTransmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceSheet" (
    "id" SERIAL NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "immo_incorporelles" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "immo_corporelles" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "immo_financieres" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_actif_immobilise" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "stocks" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "creances" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_actif_circulant" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "tresorerie_actif" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_actif" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "capital" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "reserves" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "report_a_nouveau" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "resultat_exercice" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "subventions_investissement" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "provisions_reglementees" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_capitaux_propres" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "emprunts_obligations" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "dettes_financieres_lt" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "provisions_risques_charges" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_dettes_financieres" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "dettes_circulantes" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "fournisseurs" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "dettes_fiscales_sociales" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_passif_circulant" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "tresorerie_passif" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_passif" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BalanceSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeStatement" (
    "id" SERIAL NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "chiffre_affaires" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "production_stockee" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "production_immobilisee" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "reprises_provisions" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "autres_produits" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_produits_ao" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "achats_consommes" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "variation_stocks" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "achats_stockes" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "marge_commerciale" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "autres_achats" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "transports" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "services_exterieurs" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "impots_taxes" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "autres_charges" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "valeur_ajoutee" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "charges_personnel" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "charges_sociales" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "excedent_brut_exploitation" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "autres_produits_exploitation" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "autres_charges_exploitation" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "dotations_amortissements" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "dotations_provisions" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "resultat_exploitation" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "produits_financiers" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "charges_financieres" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "resultat_financier" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "resultat_ao" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "produits_hao" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "charges_hao" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "resultat_hao" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "participation_salaries" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "impots_sur_benefices" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "resultat_net" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlowStatement" (
    "id" SERIAL NOT NULL,
    "fiscalYearId" INTEGER NOT NULL,
    "cafg" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "variation_bfr" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "flux_tresorerie_activite" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "acquisition_immobilisations" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "cession_immobilisations" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "flux_tresorerie_investissement" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "augmentation_capital" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "emprunts_nouveaux" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "remboursement_emprunts" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "dividendes_verses" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "flux_tresorerie_financement" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "variation_tresorerie" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "tresorerie_debut" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "tresorerie_fin" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashFlowStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" VARCHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" VARCHAR(36) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "taxDependents" INTEGER NOT NULL DEFAULT 0,
    "cnssNumber" TEXT,
    "tinNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" VARCHAR(36) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" VARCHAR(36) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "workedHours" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDomain" (
    "id" VARCHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "TrainingDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" VARCHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "numberHours" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingParticipation" (
    "id" VARCHAR(36) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "TrainingParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" VARCHAR(36) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" VARCHAR(36) NOT NULL,
    "grossSalary" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "netSalary" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "paymentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "employeeId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipLine" (
    "id" VARCHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "baseAmount" DECIMAL(15,2),
    "rate" DOUBLE PRECISION,
    "payslipId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "PayslipLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" VARCHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fiscalYearId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" VARCHAR(36) NOT NULL,
    "forecastAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "realizedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "accountId" INTEGER NOT NULL,
    "budgetId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_succursale_companyId_key" ON "Branch"("code_succursale", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_companyId_key" ON "Role"("code", "companyId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "AuditLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_horodatage_idx" ON "AuditLog"("horodatage");

-- CreateIndex
CREATE INDEX "AuditLog_branchId_idx" ON "AuditLog"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_isf_key" ON "Invoice"("isf");

-- CreateIndex
CREATE INDEX "Invoice_date_emission_companyId_idx" ON "Invoice"("date_emission", "companyId");

-- CreateIndex
CREATE INDEX "Invoice_status_companyId_idx" ON "Invoice"("status", "companyId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_companyId_idx" ON "Invoice"("clientId", "companyId");

-- CreateIndex
CREATE INDEX "Invoice_branchId_idx" ON "Invoice"("branchId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_createdById_idx" ON "Invoice"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_numero_facture_companyId_key" ON "Invoice"("numero_facture", "companyId");

-- CreateIndex
CREATE INDEX "InvoiceLine_companyId_idx" ON "InvoiceLine"("companyId");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_productId_idx" ON "InvoiceLine"("productId");

-- CreateIndex
CREATE INDEX "InvoiceLine_taxId_idx" ON "InvoiceLine"("taxId");

-- CreateIndex
CREATE INDEX "Tax_companyId_idx" ON "Tax"("companyId");

-- CreateIndex
CREATE INDEX "Tax_branchId_idx" ON "Tax"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Tax_code_companyId_key" ON "Tax"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Tax_code_branchId_key" ON "Tax"("code", "branchId");

-- CreateIndex
CREATE INDEX "Payment_branchId_idx" ON "Payment"("branchId");

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_invoiceId_key" ON "CreditNote"("invoiceId");

-- CreateIndex
CREATE INDEX "CreditNote_companyId_idx" ON "CreditNote"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_numero_note_companyId_key" ON "CreditNote"("numero_note", "companyId");

-- CreateIndex
CREATE INDEX "Account_classe_compte_companyId_idx" ON "Account"("classe_compte", "companyId");

-- CreateIndex
CREATE INDEX "Account_compte_parent_id_idx" ON "Account"("compte_parent_id");

-- CreateIndex
CREATE INDEX "Account_niveau_companyId_idx" ON "Account"("niveau", "companyId");

-- CreateIndex
CREATE INDEX "Account_companyId_idx" ON "Account"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_numero_compte_companyId_key" ON "Account"("numero_compte", "companyId");

-- CreateIndex
CREATE INDEX "Journal_branchId_idx" ON "Journal"("branchId");

-- CreateIndex
CREATE INDEX "Journal_companyId_idx" ON "Journal"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_code_companyId_key" ON "Journal"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingEntry_invoiceId_key" ON "AccountingEntry"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingEntry_paymentId_key" ON "AccountingEntry"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingEntry_payslipId_key" ON "AccountingEntry"("payslipId");

-- CreateIndex
CREATE INDEX "AccountingEntry_numero_piece_companyId_idx" ON "AccountingEntry"("numero_piece", "companyId");

-- CreateIndex
CREATE INDEX "AccountingEntry_date_ecriture_companyId_idx" ON "AccountingEntry"("date_ecriture", "companyId");

-- CreateIndex
CREATE INDEX "AccountingEntry_etat_companyId_idx" ON "AccountingEntry"("etat", "companyId");

-- CreateIndex
CREATE INDEX "AccountingEntry_branchId_idx" ON "AccountingEntry"("branchId");

-- CreateIndex
CREATE INDEX "AccountingEntry_companyId_idx" ON "AccountingEntry"("companyId");

-- CreateIndex
CREATE INDEX "AccountingEntry_createdById_idx" ON "AccountingEntry"("createdById");

-- CreateIndex
CREATE INDEX "AccountingEntry_fiscalYearId_idx" ON "AccountingEntry"("fiscalYearId");

-- CreateIndex
CREATE INDEX "AccountingEntry_journalId_idx" ON "AccountingEntry"("journalId");

-- CreateIndex
CREATE INDEX "EntryLine_accountId_idx" ON "EntryLine"("accountId");

-- CreateIndex
CREATE INDEX "EntryLine_companyId_idx" ON "EntryLine"("companyId");

-- CreateIndex
CREATE INDEX "EntryLine_costCenterId_idx" ON "EntryLine"("costCenterId");

-- CreateIndex
CREATE INDEX "EntryLine_entryId_idx" ON "EntryLine"("entryId");

-- CreateIndex
CREATE INDEX "EntryLine_thirdPartyId_idx" ON "EntryLine"("thirdPartyId");

-- CreateIndex
CREATE INDEX "FiscalYear_companyId_idx" ON "FiscalYear"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_code_companyId_key" ON "FiscalYear"("code", "companyId");

-- CreateIndex
CREATE INDEX "CostCenter_centre_parent_id_idx" ON "CostCenter"("centre_parent_id");

-- CreateIndex
CREATE INDEX "CostCenter_type_companyId_idx" ON "CostCenter"("type", "companyId");

-- CreateIndex
CREATE INDEX "CostCenter_companyId_idx" ON "CostCenter"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_code_companyId_key" ON "CostCenter"("code", "companyId");

-- CreateIndex
CREATE INDEX "ThirdParty_nom_raison_sociale_companyId_idx" ON "ThirdParty"("nom_raison_sociale", "companyId");

-- CreateIndex
CREATE INDEX "ThirdParty_type_companyId_idx" ON "ThirdParty"("type", "companyId");

-- CreateIndex
CREATE INDEX "ThirdParty_email_companyId_idx" ON "ThirdParty"("email", "companyId");

-- CreateIndex
CREATE INDEX "ThirdParty_branchId_idx" ON "ThirdParty"("branchId");

-- CreateIndex
CREATE INDEX "ThirdParty_companyId_idx" ON "ThirdParty"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdParty_nif_companyId_key" ON "ThirdParty"("nif", "companyId");

-- CreateIndex
CREATE INDEX "Product_designation_companyId_idx" ON "Product"("designation", "companyId");

-- CreateIndex
CREATE INDEX "Product_type_produit_companyId_idx" ON "Product"("type_produit", "companyId");

-- CreateIndex
CREATE INDEX "Product_code_barre_companyId_idx" ON "Product"("code_barre", "companyId");

-- CreateIndex
CREATE INDEX "Product_branchId_idx" ON "Product"("branchId");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_reference_sku_companyId_key" ON "Product"("reference_sku", "companyId");

-- CreateIndex
CREATE INDEX "StockMovement_branchId_idx" ON "StockMovement"("branchId");

-- CreateIndex
CREATE INDEX "StockMovement_companyId_idx" ON "StockMovement"("companyId");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_stock_reception_id_idx" ON "StockMovement"("stock_reception_id");

-- CreateIndex
CREATE INDEX "StockMovement_third_party_id_idx" ON "StockMovement"("third_party_id");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_numero_commande_key" ON "PurchaseOrder"("numero_commande");

-- CreateIndex
CREATE INDEX "PurchaseOrder_fournisseur_id_company_id_idx" ON "PurchaseOrder"("fournisseur_id", "company_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_statut_company_id_idx" ON "PurchaseOrder"("statut", "company_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_date_commande_company_id_idx" ON "PurchaseOrder"("date_commande", "company_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_branchId_idx" ON "PurchaseOrder"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_company_id_idx" ON "PurchaseOrder"("company_id");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_purchase_order_id_idx" ON "PurchaseOrderLine"("purchase_order_id");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_product_id_idx" ON "PurchaseOrderLine"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "StockReception_numero_reception_key" ON "StockReception"("numero_reception");

-- CreateIndex
CREATE INDEX "StockReception_fournisseur_id_company_id_idx" ON "StockReception"("fournisseur_id", "company_id");

-- CreateIndex
CREATE INDEX "StockReception_purchase_order_id_idx" ON "StockReception"("purchase_order_id");

-- CreateIndex
CREATE INDEX "StockReception_date_reception_company_id_idx" ON "StockReception"("date_reception", "company_id");

-- CreateIndex
CREATE INDEX "StockReception_branchId_idx" ON "StockReception"("branchId");

-- CreateIndex
CREATE INDEX "StockReception_company_id_idx" ON "StockReception"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicFiscalDevice_def_nid_key" ON "ElectronicFiscalDevice"("def_nid");

-- CreateIndex
CREATE INDEX "ElectronicFiscalDevice_companyId_statut_idx" ON "ElectronicFiscalDevice"("companyId", "statut");

-- CreateIndex
CREATE INDEX "ElectronicFiscalDevice_def_nid_idx" ON "ElectronicFiscalDevice"("def_nid");

-- CreateIndex
CREATE INDEX "ElectronicFiscalDevice_branchId_idx" ON "ElectronicFiscalDevice"("branchId");

-- CreateIndex
CREATE INDEX "DefTransmission_invoiceId_idx" ON "DefTransmission"("invoiceId");

-- CreateIndex
CREATE INDEX "DefTransmission_status_companyId_idx" ON "DefTransmission"("status", "companyId");

-- CreateIndex
CREATE INDEX "DefTransmission_isf_idx" ON "DefTransmission"("isf");

-- CreateIndex
CREATE INDEX "DefTransmission_defId_idx" ON "DefTransmission"("defId");

-- CreateIndex
CREATE INDEX "DefTransmission_companyId_idx" ON "DefTransmission"("companyId");

-- CreateIndex
CREATE INDEX "BalanceSheet_companyId_idx" ON "BalanceSheet"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceSheet_fiscalYearId_companyId_key" ON "BalanceSheet"("fiscalYearId", "companyId");

-- CreateIndex
CREATE INDEX "IncomeStatement_companyId_idx" ON "IncomeStatement"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeStatement_fiscalYearId_companyId_key" ON "IncomeStatement"("fiscalYearId", "companyId");

-- CreateIndex
CREATE INDEX "CashFlowStatement_companyId_idx" ON "CashFlowStatement"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CashFlowStatement_fiscalYearId_companyId_key" ON "CashFlowStatement"("fiscalYearId", "companyId");

-- CreateIndex
CREATE INDEX "Department_branchId_idx" ON "Department"("branchId");

-- CreateIndex
CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_isActive_companyId_idx" ON "Employee"("isActive", "companyId");

-- CreateIndex
CREATE INDEX "Employee_hireDate_idx" ON "Employee"("hireDate");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Leave_branchId_idx" ON "Leave"("branchId");

-- CreateIndex
CREATE INDEX "Leave_companyId_idx" ON "Leave"("companyId");

-- CreateIndex
CREATE INDEX "Leave_employeeId_idx" ON "Leave"("employeeId");

-- CreateIndex
CREATE INDEX "Attendance_branchId_idx" ON "Attendance"("branchId");

-- CreateIndex
CREATE INDEX "Attendance_companyId_idx" ON "Attendance"("companyId");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_idx" ON "Attendance"("employeeId");

-- CreateIndex
CREATE INDEX "TrainingDomain_branchId_idx" ON "TrainingDomain"("branchId");

-- CreateIndex
CREATE INDEX "TrainingDomain_companyId_idx" ON "TrainingDomain"("companyId");

-- CreateIndex
CREATE INDEX "Training_branchId_idx" ON "Training"("branchId");

-- CreateIndex
CREATE INDEX "Training_companyId_idx" ON "Training"("companyId");

-- CreateIndex
CREATE INDEX "TrainingParticipation_branchId_idx" ON "TrainingParticipation"("branchId");

-- CreateIndex
CREATE INDEX "TrainingParticipation_companyId_idx" ON "TrainingParticipation"("companyId");

-- CreateIndex
CREATE INDEX "TrainingParticipation_employeeId_idx" ON "TrainingParticipation"("employeeId");

-- CreateIndex
CREATE INDEX "TrainingParticipation_trainingId_idx" ON "TrainingParticipation"("trainingId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_branchId_idx" ON "PayrollPeriod"("branchId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_companyId_idx" ON "PayrollPeriod"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_month_year_companyId_key" ON "PayrollPeriod"("month", "year", "companyId");

-- CreateIndex
CREATE INDEX "Payslip_branchId_idx" ON "Payslip"("branchId");

-- CreateIndex
CREATE INDEX "Payslip_companyId_idx" ON "Payslip"("companyId");

-- CreateIndex
CREATE INDEX "Payslip_employeeId_idx" ON "Payslip"("employeeId");

-- CreateIndex
CREATE INDEX "Payslip_periodId_idx" ON "Payslip"("periodId");

-- CreateIndex
CREATE INDEX "PayslipLine_companyId_idx" ON "PayslipLine"("companyId");

-- CreateIndex
CREATE INDEX "PayslipLine_payslipId_idx" ON "PayslipLine"("payslipId");

-- CreateIndex
CREATE INDEX "Budget_branchId_idx" ON "Budget"("branchId");

-- CreateIndex
CREATE INDEX "Budget_companyId_idx" ON "Budget"("companyId");

-- CreateIndex
CREATE INDEX "Budget_fiscalYearId_idx" ON "Budget"("fiscalYearId");

-- CreateIndex
CREATE INDEX "BudgetLine_accountId_idx" ON "BudgetLine"("accountId");

-- CreateIndex
CREATE INDEX "BudgetLine_branchId_idx" ON "BudgetLine"("branchId");

-- CreateIndex
CREATE INDEX "BudgetLine_budgetId_idx" ON "BudgetLine"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetLine_companyId_idx" ON "BudgetLine"("companyId");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_compte_parent_id_fkey" FOREIGN KEY ("compte_parent_id") REFERENCES "Account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryLine" ADD CONSTRAINT "EntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryLine" ADD CONSTRAINT "EntryLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryLine" ADD CONSTRAINT "EntryLine_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryLine" ADD CONSTRAINT "EntryLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "AccountingEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryLine" ADD CONSTRAINT "EntryLine_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_centre_parent_id_fkey" FOREIGN KEY ("centre_parent_id") REFERENCES "CostCenter"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdParty" ADD CONSTRAINT "ThirdParty_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdParty" ADD CONSTRAINT "ThirdParty_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stock_reception_id_fkey" FOREIGN KEY ("stock_reception_id") REFERENCES "StockReception"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_third_party_id_fkey" FOREIGN KEY ("third_party_id") REFERENCES "ThirdParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReception" ADD CONSTRAINT "StockReception_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReception" ADD CONSTRAINT "StockReception_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReception" ADD CONSTRAINT "StockReception_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReception" ADD CONSTRAINT "StockReception_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectronicFiscalDevice" ADD CONSTRAINT "ElectronicFiscalDevice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectronicFiscalDevice" ADD CONSTRAINT "ElectronicFiscalDevice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefTransmission" ADD CONSTRAINT "DefTransmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefTransmission" ADD CONSTRAINT "DefTransmission_defId_fkey" FOREIGN KEY ("defId") REFERENCES "ElectronicFiscalDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefTransmission" ADD CONSTRAINT "DefTransmission_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceSheet" ADD CONSTRAINT "BalanceSheet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceSheet" ADD CONSTRAINT "BalanceSheet_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeStatement" ADD CONSTRAINT "IncomeStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeStatement" ADD CONSTRAINT "IncomeStatement_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowStatement" ADD CONSTRAINT "CashFlowStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowStatement" ADD CONSTRAINT "CashFlowStatement_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDomain" ADD CONSTRAINT "TrainingDomain_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDomain" ADD CONSTRAINT "TrainingDomain_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipation" ADD CONSTRAINT "TrainingParticipation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipation" ADD CONSTRAINT "TrainingParticipation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipation" ADD CONSTRAINT "TrainingParticipation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipation" ADD CONSTRAINT "TrainingParticipation_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipLine" ADD CONSTRAINT "PayslipLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipLine" ADD CONSTRAINT "PayslipLine_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
