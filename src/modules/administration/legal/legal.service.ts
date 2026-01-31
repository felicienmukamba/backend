import { Injectable } from '@nestjs/common';

@Injectable()
export class LegalService {
    getFactureNormaliseeInfo() {
        return {
            objectives: [
                'Garantir la traçabilité des transactions',
                'Lutter contre la fraude fiscale',
                'Accroître la mobilisation des recettes de l’État',
                'Moderniser l’Administration des Impôts',
            ],
            concernedParties: [
                'Les entreprises privées',
                'Les organisations non gouvernementales',
                'Les acteurs d’exécution de la dépense publique au niveau du Pouvoir central, des Provinces et des Entités Territoriales Décentralisées',
                'Les entreprises publiques',
                'Les établissements publics et les autres organismes publics',
            ],
            mandatoryMentions: [
                'L’identité du vendeur ou prestataire avec des indications sur le RCCM, le NIF et l’adresse complète',
                'L’identité du client et son numéro impôt',
                'La date et le numéro de série de la facture',
                'La désignation et la quantité de biens ou prestations',
                'Le prix unitaire et le prix global de chaque type de marchandises vendues et/ou exportées, des services rendus ou des travaux immobiliers',
                'Les prix hors taxe sur la valeur ajoutée des biens livrés ou des services rendus',
                'Le taux de la taxe sur la valeur ajoutée appliqué et le montant correspondant de la taxe',
                'Le montant non taxable de l’opération',
                'Le montant des opérations toutes taxes comprises',
                'Le montant de tous autres impôts et taxes, le cas échéant',
                'Le numéro d’identification du dispositif électronique fiscal utilisé pour la facturation',
                'Le code d’authentification de la transaction par le dispositif électronique fiscal et le code QR',
            ],
        };
    }
}
