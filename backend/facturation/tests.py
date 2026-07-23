"""Tests de la génération des factures (#12)."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from reparations.models import DemandeReparation

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
    def setUp(self):
        self.client_user = User.objects.create_user(username='alice', password='x')
        self.gestionnaire = User.objects.create_user(username='gestion1', password='x')
        self.demande = creer_demande(
            self.client_user, statut=DemandeReparation.Statut.TERMINEE
        )
        self.url_liste = '/api/factures/'

    def payload(self, **surcharges):
        donnees = {
            'demande': self.demande.id,
            'montant_main_oeuvre': '200.00',
            'montant_pieces': '100.00',
        }
        donnees.update(surcharges)
        return donnees

    # --- Authentification ---

    def test_acces_refuse_sans_authentification(self):
        for methode, url in [
            (self.client.get, self.url_liste),
            (self.client.post, self.url_liste),
        ]:
            reponse = methode(url)
            self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Création ---

    def test_creation_calcule_les_taxes(self):
        self.client.force_authenticate(self.gestionnaire)
        reponse = self.client.post(self.url_liste, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['tps'], '15.00')
        self.assertEqual(reponse.data['tvq'], '29.93')
        self.assertEqual(reponse.data['montant_total'], '344.93')

    def test_champs_calcules_non_modifiables_via_lapi(self):
        self.client.force_authenticate(self.gestionnaire)
        reponse = self.client.post(self.url_liste, self.payload(
            numero='FAC-9999-9999',
            tps='0.00',
            tvq='0.00',
            montant_total='0.00',
            statut=Facture.Statut.PAYEE,
        ))
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(reponse.data['numero'], 'FAC-9999-9999')
        self.assertEqual(reponse.data['tps'], '15.00')
        self.assertEqual(reponse.data['montant_total'], '344.93')
        self.assertEqual(reponse.data['statut'], Facture.Statut.EMISE)

    def test_double_facturation_refusee(self):
        self.client.force_authenticate(self.gestionnaire)
        self.client.post(self.url_liste, self.payload())
        reponse = self.client.post(self.url_liste, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('demande', reponse.data)

    def test_facturation_demande_annulee_refusee(self):
        # 'annulee' n'est pas une valeur choisie par DemandeReparation.Statut
        # aujourd'hui (voir docs/mcd.md RG5) ; on force la valeur en base pour
        # vérifier que la garde préventive du serializer réagit bien le jour
        # où ce statut existera.
        DemandeReparation.objects.filter(id=self.demande.id).update(statut='annulee')
        self.demande.refresh_from_db()

        self.client.force_authenticate(self.gestionnaire)
        reponse = self.client.post(self.url_liste, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('demande', reponse.data)

    # --- Lecture ---

    def test_utilisateur_authentifie_voit_les_factures(self):
        self.client.force_authenticate(self.gestionnaire)
        self.client.post(self.url_liste, self.payload())
        reponse = self.client.get(self.url_liste)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reponse.data), 1)


    def test_facturation_demande_non_terminee_refusee(self):
        demande_en_attente = creer_demande(self.client_user, titre='Pas prête')
        self.client.force_authenticate(self.gestionnaire)
        reponse = self.client.post(
            self.url_liste, self.payload(demande=demande_en_attente.id)
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('demande', reponse.data)

    def test_facturation_demande_terminee_acceptee(self):
        self.demande.statut = DemandeReparation.Statut.TERMINEE
        self.demande.save()
        self.client.force_authenticate(self.gestionnaire)
        reponse = self.client.post(self.url_liste, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)