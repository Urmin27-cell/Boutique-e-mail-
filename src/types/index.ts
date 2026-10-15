/**
 * Types & Data Models for BOUTIQUE E-MAIL
 */

export type UserRole = 'utilisateur' | 'vendeur' | 'admin';
export type AccountStatus = 'actif' | 'suspendu' | 'bloque' | 'supprime';
export type SubscriptionStatus = 'aucun' | 'essai_gratuit' | 'en_attente_confirmation' | 'actif' | 'expire' | 'refuse';
export type ListingStatus = 'disponible' | 'reserve' | 'vendu' | 'masque' | 'suspendu';
export type OrderStatus = 'en_attente_paiement' | 'en_attente_verification' | 'paiement_confirme' | 'paiement_refuse' | 'annulee';
export type EmailProOrderStatus = 'en_attente' | 'en_cours' | 'termine' | 'annule';

export interface UserProfile {
  uid: string;
  nomComplet: string;
  email: string;
  telephone: string;
  role: UserRole;
  statutCompte: AccountStatus;
  dateCreation: string;
  dateSuspension?: string;
  motifSuspension?: string;
  nombreNotesPositives: number;
  nombreNotesNegatives: number;
  badgeBleu: boolean;
  dateDebutEssai?: string;
  dateFinEssai?: string;
  statutAbonnement: SubscriptionStatus;
  dateDebutAbonnement?: string;
  dateFinAbonnement?: string;
}

export interface EmailListing {
  listingId: string;
  vendeurUid: string;
  vendeurNom: string;
  vendeurTelephone: string;
  adresseEmail: string;
  adresseEmailNormalisee: string;
  description: string;
  prix: number; // en Ariary
  numeroPaiement: string;
  nomTitulairePaiement: string;
  statutAnnonce: ListingStatus;
  dateCreation: string;
  reservationCommandeId?: string;
  badgeBleuVendeur: boolean;
  notesPositives: number;
  notesNegatives: number;
}

export interface EncryptedCredential {
  listingId: string;
  vendeurUid: string;
  encryptedPassword: string;
  authorizedBuyerUid?: string;
  orderId?: string;
  dateCreation: string;
}

export interface Order {
  orderId: string;
  reference: string;
  acheteurUid: string;
  acheteurNom: string;
  acheteurEmail: string;
  vendeurUid: string;
  vendeurNom: string;
  vendeurTelephone?: string;
  listingId: string;
  adresseEmailVendue: string;
  prix: number;
  numeroPaiement: string;
  nomTitulairePaiement: string;
  preuvePaiementUrl?: string;
  statutCommande: OrderStatus;
  motifRefus?: string;
  dateCreation: string;
  datePaiementEnvoye?: string;
  dateConfirmation?: string;
  confirmedByUid?: string;
}

export interface SalesHistory {
  saleId: string;
  orderId: string;
  listingId: string;
  vendeurUid: string;
  vendeurNom: string;
  acheteurUid: string;
  acheteurNom: string;
  adresseEmail: string;
  prixFinal: number;
  dateVente: string;
  statutVente: string;
}

export interface SellerRating {
  ratingId: string;
  vendeurUid: string;
  auteurUid: string;
  auteurNom: string;
  orderId?: string;
  typeNote: 'positive' | 'negative';
  dateCreation: string;
}

export interface SubscriptionRequest {
  requestId: string;
  utilisateurUid: string;
  utilisateurNom: string;
  utilisateurEmail: string;
  montant: number; // 2500 Ar
  preuvePaiementUrl: string;
  statut: 'en_attente_confirmation' | 'actif' | 'refuse';
  motifRefus?: string;
  dateCreation: string;
  dateConfirmation?: string;
  dateDebutAbonnement?: string;
  dateFinAbonnement?: string;
  adminUid?: string;
}

export interface ReactivationRequest {
  requestId: string;
  utilisateurUid: string;
  utilisateurNom: string;
  utilisateurEmail: string;
  montant: number; // 20000 Ar
  preuvePaiementUrl: string;
  statut: 'en_attente_confirmation' | 'actif' | 'refuse';
  motifRefus?: string;
  dateCreation: string;
  dateConfirmation?: string;
  adminUid?: string;
}

export interface EmailProListing {
  listingId: string;
  prestataireUid: string;
  nomPrestataire: string;
  contact: string;
  prix: number;
  description: string;
  statut: 'disponible' | 'masque';
  dateCreation: string;
}

export interface EmailProOrder {
  orderId: string;
  reference: string;
  clientUid: string;
  clientNom: string;
  clientEmail: string;
  prestataireUid: string;
  nomPrestataire: string;
  domaineDemande: string;
  contactClient: string;
  description: string;
  prix: number;
  statut: EmailProOrderStatus;
  dateCreation: string;
}

export interface AppNotification {
  notificationId: string;
  destinataireUid: string;
  titre: string;
  message: string;
  type: 'commande' | 'paiement' | 'validation' | 'suspension' | 'abonnement' | 'info';
  lu: boolean;
  dateCreation: string;
  referenceDocumentId?: string;
}

export interface AdminAuditLog {
  logId: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  cibleUid?: string;
  referenceDocumentId?: string;
  details?: string;
  dateCreation: string;
}
