from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from facturation.models import Facture
from reparations.models import DemandeReparation

User = get_user_model()


class PaiementAPITestCase(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username="client1", password="motdepasse123", role="CLIENT"
        )
        self.autre_client = User.objects.create_user(
            username="client2", password="motdepasse123", role="CLIENT"
        )
        self.gestionnaire = User.objects.create_user(
            username="gest1", password="motdepasse123", role="GESTIONNAIRE"
        )
        self.demande = DemandeReparation.objects.create(
            titre="Freins",
            vehicule="Toyota Corolla",
            description="Changement de plaquettes",
            client=self.client_user,
            statut=DemandeReparation.Statut.TERMINEE,
        )
        self.facture = Facture.objects.create(
            demande=self.demande,
            montant_main_oeuvre=200,
            montant_pieces=0,
        )

    def test_client_peut_payer_sa_facture(self):
        self.client.force_authenticate(self.client_user)
        payload = {
            "facture": self.facture.id,
            "montant": str(self.facture.montant_total),
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.statut, Facture.Statut.PAYEE)

    def test_paiement_partiel_ne_solde_pas_la_facture(self):
        self.client.force_authenticate(self.client_user)
        payload = {
            "facture": self.facture.id,
            "montant": "50.00",
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.statut, Facture.Statut.EMISE)

    def test_client_ne_peut_pas_payer_facture_dautrui(self):
        self.client.force_authenticate(self.autre_client)
        payload = {
            "facture": self.facture.id,
            "montant": str(self.facture.montant_total),
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_gestionnaire_peut_payer_une_facture_dun_client(self):
        self.client.force_authenticate(self.gestionnaire)
        payload = {
            "facture": self.facture.id,
            "montant": str(self.facture.montant_total),
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_paiement_montant_negatif_refuse(self):
        self.client.force_authenticate(self.client_user)
        payload = {
            "facture": self.facture.id,
            "montant": "-10.00",
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_paiement_sur_facture_deja_payee_refuse(self):
        self.facture.statut = Facture.Statut.PAYEE
        self.facture.save(update_fields=["statut"])
        self.client.force_authenticate(self.client_user)
        payload = {
            "facture": self.facture.id,
            "montant": str(self.facture.montant_total),
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_ne_voit_que_ses_paiements(self):
        self.client.force_authenticate(self.client_user)
        self.client.post(
            "/api/paiements/",
            {"facture": self.facture.id, "montant": "50.00", "methode": "carte"},
        )
        self.client.force_authenticate(self.autre_client)
        response = self.client.get("/api/paiements/")
        resultats = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )
        self.assertEqual(len(resultats), 0)
