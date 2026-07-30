"""Tests de la génération des factures (#12)."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from diagnostics.models import Diagnostic
from reparations.models import DemandeReparation, TypeReparation

from .models import Facture

User = get_user_model()


def creer_demande(client_user, **surcharges):
    donnees = {
        'titre': 'Changement de freins',
        'vehicule': 'Honda Civic 2019 — ABC 123',
        'description': 'Remplacement des plaquettes avant.',
        'client': client_user,
    }
    donnees.update(surcharges)
    return DemandeReparation.objects.create(**donnees)


class FactureModelTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='alice', password='x')
        self.demande = creer_demande(self.client_user)

    def test_calcul_tps_tvq_total(self):
        facture = Facture.objects.create(
            demande=self.demande,
            montant_main_oeuvre=Decimal('200.00'),
            montant_pieces=Decimal('100.00'),
        )
        self.assertEqual(facture.tps, Decimal('15.00'))
        self.assertEqual(facture.tvq, Decimal('29.93'))
        self.assertEqual(facture.montant_total, Decimal('344.93'))

    def test_numero_genere_au_format_attendu(self):
        facture = Facture.objects.create(
            demande=self.demande,
            montant_main_oeuvre=Decimal('50.00'),
            montant_pieces=Decimal('0.00'),
        )
        annee = facture.date_emission.year
        self.assertEqual(facture.numero, f'FAC-{annee}-0001')

    def test_numeros_sequentiels_par_annee(self):
        demande2 = creer_demande(self.client_user, titre='Vidange')
        facture1 = Facture.objects.create(
            demande=self.demande, montant_main_oeuvre=Decimal('50.00'), montant_pieces=Decimal('0.00')
        )
        facture2 = Facture.objects.create(
            demande=demande2, montant_main_oeuvre=Decimal('30.00'), montant_pieces=Decimal('0.00')
        )
        annee = facture1.date_emission.year
        self.assertEqual(facture1.numero, f'FAC-{annee}-0001')
        self.assertEqual(facture2.numero, f'FAC-{annee}-0002')

    def test_statut_par_defaut_emise(self):
        facture = Facture.objects.create(
            demande=self.demande, montant_main_oeuvre=Decimal('50.00'), montant_pieces=Decimal('0.00')
        )
        self.assertEqual(facture.statut, Facture.Statut.EMISE)

    def test_une_seule_facture_par_demande(self):
        Facture.objects.create(
            demande=self.demande, montant_main_oeuvre=Decimal('50.00'), montant_pieces=Decimal('0.00')
        )
        with self.assertRaises(Exception):
            Facture.objects.create(
                demande=self.demande, montant_main_oeuvre=Decimal('10.00'), montant_pieces=Decimal('0.00')
            )


class FactureApiTests(APITestCase):
    """Tests de lecture des factures. La création manuelle a été retirée
    (#12, changement de conception validé par le PO) : seule l'action
    /generer/ (voir FactureGenerationApiTests) crée des factures."""

    def setUp(self):
        self.client_user = User.objects.create_user(username='alice', password='x')
        self.gestionnaire = User.objects.create_user(username='gestion1', password='x')
        self.demande = creer_demande(
            self.client_user, statut=DemandeReparation.Statut.TERMINEE
        )
        self.url_liste = '/api/factures/'

    # --- Authentification ---

    def test_acces_refuse_sans_authentification(self):
        for methode, url in [
            (self.client.get, self.url_liste),
            (self.client.post, self.url_liste),
        ]:
            reponse = methode(url)
            self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Création manuelle retirée ---

    def test_creation_manuelle_non_autorisee(self):
        self.client.force_authenticate(self.gestionnaire)
        reponse = self.client.post(self.url_liste, {
            'demande': self.demande.id,
            'montant_main_oeuvre': '200.00',
            'montant_pieces': '100.00',
        })
        self.assertEqual(reponse.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # --- Lecture ---

    def test_utilisateur_authentifie_voit_les_factures(self):
        Facture.objects.create(
            demande=self.demande,
            montant_main_oeuvre=Decimal('200.00'),
            montant_pieces=Decimal('100.00'),
        )
        self.client.force_authenticate(self.gestionnaire)
        reponse = self.client.get(self.url_liste)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reponse.data), 1)


class FactureGenerationApiTests(APITestCase):
    """Tests de POST /api/factures/generer/ (#12, action client)."""

    def setUp(self):
        self.client_user = User.objects.create_user(username='alice', password='x')
        self.autre_client = User.objects.create_user(username='bob', password='x')
        self.mecanicien = User.objects.create_user(username='mario', password='x')
        self.demande = creer_demande(
            self.client_user, statut=DemandeReparation.Statut.TERMINEE
        )
        self.url = '/api/factures/generer/'

    def creer_diagnostic(self, cout_estime):
        return Diagnostic.objects.create(
            demande=self.demande,
            mecanicien=self.mecanicien,
            notes_techniques='Observations.',
            travaux_a_effectuer='Remplacement des plaquettes.',
            cout_estime=cout_estime,
        )

    def creer_type_reparation(self, nom, prix_standard):
        return TypeReparation.objects.create(
            nom=nom,
            duree_estimee_heures=Decimal('1.00'),
            prix_standard=prix_standard,
        )

    def test_generation_refusee_sans_authentification(self):
        reponse = self.client.post(self.url, {'demande': self.demande.id})
        self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_generation_reussie_sans_diagnostic_montant_zero(self):
        self.client.force_authenticate(self.client_user)
        reponse = self.client.post(self.url, {'demande': self.demande.id})
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['montant_main_oeuvre'], '0.00')
        self.assertEqual(reponse.data['montant_pieces'], '0.00')
        self.assertEqual(reponse.data['tps'], '0.00')
        self.assertEqual(reponse.data['tvq'], '0.00')
        self.assertEqual(reponse.data['montant_total'], '0.00')

    def test_generation_montant_main_oeuvre_somme_des_types_lies(self):
        """Si le diagnostic préconise des types de réparation, leur
        prix_standard remplace le cout_estime saisi à la main (#12)."""
        diagnostic = self.creer_diagnostic(Decimal('999.00'))
        vidange = self.creer_type_reparation('Vidange', Decimal('80.00'))
        freins = self.creer_type_reparation('Changement de freins', Decimal('150.00'))
        diagnostic.types_reparation.set([vidange, freins])

        self.client.force_authenticate(self.client_user)
        reponse = self.client.post(self.url, {'demande': self.demande.id})

        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['montant_main_oeuvre'], '230.00')
        self.assertEqual(reponse.data['montant_pieces'], '0.00')
        self.assertEqual(reponse.data['tps'], '11.50')
        self.assertEqual(reponse.data['tvq'], '22.94')
        self.assertEqual(reponse.data['montant_total'], '264.44')

    def test_generation_reprend_le_cout_du_diagnostic_si_aucun_type_lie(self):
        """Fallback sur cout_estime quand le diagnostic n'a aucun type
        de réparation préconisé (#12)."""
        self.creer_diagnostic(Decimal('200.00'))
        self.client.force_authenticate(self.client_user)
        reponse = self.client.post(self.url, {'demande': self.demande.id})
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['montant_main_oeuvre'], '200.00')
        self.assertEqual(reponse.data['montant_pieces'], '0.00')
        self.assertEqual(reponse.data['tps'], '10.00')
        self.assertEqual(reponse.data['tvq'], '19.95')
        self.assertEqual(reponse.data['montant_total'], '229.95')

    def test_generation_refusee_si_demande_non_terminee(self):
        demande_en_attente = creer_demande(self.client_user, titre='Pas prete')
        self.client.force_authenticate(self.client_user)
        reponse = self.client.post(self.url, {'demande': demande_en_attente.id})
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_generation_refusee_pour_demande_dun_autre_client(self):
        self.client.force_authenticate(self.autre_client)
        reponse = self.client.post(self.url, {'demande': self.demande.id})
        self.assertEqual(reponse.status_code, status.HTTP_404_NOT_FOUND)

    def test_generation_refusee_si_deja_facturee(self):
        self.client.force_authenticate(self.client_user)
        self.client.post(self.url, {'demande': self.demande.id})
        reponse = self.client.post(self.url, {'demande': self.demande.id})
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)


class FacturePdfApiTests(APITestCase):
    """Tests de GET /api/factures/{id}/pdf/ (#12)."""

    def setUp(self):
        self.client_user = User.objects.create_user(username='alice', password='x')
        self.demande = creer_demande(
            self.client_user, statut=DemandeReparation.Statut.TERMINEE
        )
        self.facture = Facture.objects.create(
            demande=self.demande,
            montant_main_oeuvre=Decimal('200.00'),
            montant_pieces=Decimal('100.00'),
        )
        self.url = f'/api/factures/{self.facture.id}/pdf/'

    def test_telechargement_refuse_sans_authentification(self):
        reponse = self.client.get(self.url)
        self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_telechargement_reussi(self):
        self.client.force_authenticate(self.client_user)
        reponse = self.client.get(self.url)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse['Content-Type'], 'application/pdf')
        self.assertIn(self.facture.numero, reponse['Content-Disposition'])
        self.assertTrue(reponse.content.startswith(b'%PDF'))

    def test_telechargement_facture_inexistante(self):
        self.client.force_authenticate(self.client_user)
        reponse = self.client.get('/api/factures/9999/pdf/')
        self.assertEqual(reponse.status_code, status.HTTP_404_NOT_FOUND)