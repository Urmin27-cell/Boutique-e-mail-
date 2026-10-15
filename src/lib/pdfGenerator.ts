import { jsPDF } from 'jspdf';
import { Order } from '../types';

interface PdfGenerateOptions {
  order: Order;
  decryptedPassword: string;
  description?: string;
}

export function generateOfficialEmailPurchasePdf({ order, decryptedPassword, description }: PdfGenerateOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background tint header
  doc.setFillColor(37, 99, 235); // #2563eb royal blue
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative header line
  doc.setFillColor(29, 78, 216); // #1d4ed8
  doc.rect(0, 42, pageWidth, 4, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BOUTIQUE E-MAIL', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text("CERTIFICAT OFFICIEL D'ACHAT & ACCÈS SÉCURISÉ", 14, 28);
  doc.setFontSize(9);
  doc.text(`Émis le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 35);

  // Status Badge
  doc.setFillColor(220, 252, 231); // Green bg
  doc.roundedRect(pageWidth - 75, 12, 60, 20, 3, 3, 'F');
  doc.setTextColor(22, 101, 52); // Green text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAIEMENT CONFIRMÉ', pageWidth - 70, 22);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TRANSACTION VALIDÉE', pageWidth - 69, 28);

  // Main Card Details
  let y = 58;

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Détails de la Transaction', 14, y);

  y += 8;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, y, pageWidth - 14, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Référence de commande :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.reference || order.orderId, 65, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text("Date de l'achat :", 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(order.dateConfirmation || order.dateCreation).toLocaleDateString('fr-FR'), 65, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Acheteur légitime :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${order.acheteurNom} (${order.acheteurEmail})`, 65, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Vendeur du compte :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.vendeurNom, 65, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Montant total payé :', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`${order.prix.toLocaleString('fr-FR')} Ariary (Ar)`, 65, y);

  // Big Highlight Card for Acquired Email and Secure Password
  y += 16;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, y, pageWidth - 28, 52, 4, 4, 'FD');

  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('IDENTIFIANTS OFFICIELS DU COMPTE E-MAIL', 20, y + 12);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Adresse e-mail :', 20, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.adresseEmailVendue, 65, y + 24);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Mot de passe :', 20, y + 36);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(220, 38, 38); // red highlight for secret
  doc.text(decryptedPassword || 'Non disponible', 65, y + 36);

  if (description) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const splitDesc = doc.splitTextToSize(`Notes : ${description}`, pageWidth - 42);
    doc.text(splitDesc, 20, y + 46);
  }

  // Security Recommendations
  y += 66;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CONSIGNES CRITIQUES DE SÉCURITÉ :', 14, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  const tips = [
    '1. Connectez-vous sans délai sur le compte e-mail acheté et modifiez immédiatement le mot de passe.',
    '2. Mettez à jour le numéro de téléphone et l\'adresse e-mail de récupération du compte.',
    '3. Activez la validation en deux étapes (2FA) pour garantir votre protection absolue.',
    '4. Conservez ce document dans un endroit sûr et confidentiel. Ne le transmettez à personne.',
    '5. En cas de problème ou de question, contactez le support officiel WhatsApp au +261 32 39 116 54.'
  ];

  tips.forEach((tip) => {
    const wrapped = doc.splitTextToSize(tip, pageWidth - 28);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5.2;
  });

  // Footer seal
  const footerY = pageHeight - 20;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Ce document PDF est strictement confidentiel et délivré à l\'acheteur exclusif.', 14, footerY);
  doc.text('BOUTIQUE E-MAIL © Tous droits réservés - Plateforme Sécurisée', pageWidth - 14, footerY, { align: 'right' });

  // Save the document with clean filename
  const safeRef = (order.reference || order.orderId).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`BoutiqueEmail_Certificat_${safeRef}.pdf`);
}
