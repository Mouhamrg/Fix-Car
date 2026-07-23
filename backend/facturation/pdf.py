"""Génération du PDF d'une facture (#12)."""
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

STATUTS = {
    'emise': 'Émise',
    'payee': 'Payée',
    'annulee': 'Annulée',
}


def generer_pdf_facture(facture) -> bytes:
    """Construit le PDF d'une facture et retourne son contenu en bytes."""
    tampon = io.BytesIO()
    document = SimpleDocTemplate(
        tampon,
        pagesize=letter,
        topMargin=25 * mm,
        bottomMargin=25 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    titre_style = ParagraphStyle(
        'Titre', parent=styles['Title'], textColor=colors.black, spaceAfter=2 * mm,
    )
    sous_titre_style = ParagraphStyle(
        'SousTitre', parent=styles['Normal'], textColor=colors.black, fontSize=12,
    )
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], textColor=colors.black)

    demande = facture.demande
    client = demande.client

    elements = [
        Paragraph('FixMyCar', titre_style),
        Paragraph(f'Facture {facture.numero}', sous_titre_style),
        Spacer(1, 8 * mm),
        Paragraph(f"Client : {client.get_full_name() or client.username}", normal_style),
        Paragraph(f"Véhicule : {demande.vehicule}", normal_style),
        Paragraph(f"Demande : {demande.titre}", normal_style),
        Paragraph(f"Date d'émission : {facture.date_emission.strftime('%Y-%m-%d')}", normal_style),
        Paragraph(f"Statut : {STATUTS.get(facture.statut, facture.statut)}", normal_style),
        Spacer(1, 10 * mm),
    ]

    sous_total = facture.montant_main_oeuvre + facture.montant_pieces
    donnees_table = [
        ['Description', 'Montant'],
        ["Main-d'œuvre", f'{facture.montant_main_oeuvre:.2f} $'],
        ['Pièces', f'{facture.montant_pieces:.2f} $'],
        ['Sous-total', f'{sous_total:.2f} $'],
        ['TPS (5 %)', f'{facture.tps:.2f} $'],
        ['TVQ (9,975 %)', f'{facture.tvq:.2f} $'],
        ['Total', f'{facture.montant_total:.2f} $'],
    ]

    table = Table(donnees_table, colWidths=[100 * mm, 50 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.black),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(table)

    document.build(elements)
    return tampon.getvalue()
