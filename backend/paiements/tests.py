from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from reparations.models import DemandeReparation

from .models import Facture, Paiement

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
        )
        self.facture = Facture.objects.create(
            demande=self.demande,
            montant=200,
        )

    def test_client_ne_voit_que_ses_factures(self):
        self.client.force_authenticate(self.autre_client)
        response = self.client.get("/api/factures/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resultats = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )
        self.assertEqual(len(resultats), 0)

    def test_client_ne_peut_pas_voir_facture_dautrui(self):
        self.client.force_authenticate(self.autre_client)
        response = self.client.get(f"/api/factures/{self.facture.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_gestionnaire_voit_toutes_les_factures(self):
        self.client.force_authenticate(self.gestionnaire)
        response = self.client.get(f"/api/factures/{self.facture.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_client_ne_peut_pas_creer_de_facture(self):
        self.client.force_authenticate(self.client_user)
        payload = {"demande": self.demande.id, "montant": "150.00"}
        response = self.client.post("/api/factures/", payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_gestionnaire_peut_creer_une_facture(self):
        self.client.force_authenticate(self.gestionnaire)
        payload = {"demande": self.demande.id, "montant": "150.00"}
        response = self.client.post("/api/factures/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_peut_payer_sa_facture(self):
        self.client.force_authenticate(self.client_user)
        payload = {
            "facture": self.facture.id,
            "montant": "200.00",
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
        self.assertEqual(self.facture.statut, Facture.Statut.EN_ATTENTE)

    def test_client_ne_peut_pas_payer_facture_dautrui(self):
        self.client.force_authenticate(self.autre_client)
        payload = {
            "facture": self.facture.id,
            "montant": "200.00",
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

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
            "montant": "200.00",
            "methode": "carte",
        }
        response = self.client.post("/api/paiements/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
