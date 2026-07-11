from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Vehicule

User = get_user_model()


class VehiculeAPITestCase(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username="client1", password="motdepasse123"
        )
        self.autre_client = User.objects.create_user(
            username="client2", password="motdepasse123"
        )
        self.mecanicien = User.objects.create_user(
            username="mecano1", password="motdepasse123", is_staff=True
        )
        self.vehicule = Vehicule.objects.create(
            proprietaire=self.client_user,
            marque="Toyota",
            modele="Corolla",
            annee=2019,
            plaque_immatriculation="ABC 123",
            kilometrage=45000,
        )

    def test_creation_vehicule(self):
        self.client.force_authenticate(self.client_user)
        payload = {
            "marque": "Honda",
            "modele": "Civic",
            "annee": 2021,
            "plaque_immatriculation": "XYZ 987",
            "kilometrage": 1000,
        }
        response = self.client.post("/api/vehicules/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["proprietaire"], self.client_user.id)

    def test_plaque_invalide_refusee(self):
        self.client.force_authenticate(self.client_user)
        payload = {
            "marque": "Honda",
            "modele": "Civic",
            "annee": 2021,
            "plaque_immatriculation": "12345",  # format non conforme SAAQ
            "kilometrage": 1000,
        }
        response = self.client.post("/api/vehicules/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_ne_voit_que_ses_vehicules(self):
        self.client.force_authenticate(self.autre_client)
        response = self.client.get("/api/vehicules/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resultats = response.data.get("results", response.data)
        self.assertEqual(len(resultats), 0)

    def test_client_ne_peut_pas_voir_vehicule_dautrui(self):
        self.client.force_authenticate(self.autre_client)
        response = self.client.get(f"/api/vehicules/{self.vehicule.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mecanicien_voit_tous_les_vehicules(self):
        self.client.force_authenticate(self.mecanicien)
        response = self.client.get(f"/api/vehicules/{self.vehicule.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_plaque_dupliquee_refusee(self):
        self.client.force_authenticate(self.client_user)
        payload = {
            "marque": "Honda",
            "modele": "Civic",
            "annee": 2021,
            "plaque_immatriculation": "ABC 123",  # déjà utilisée
            "kilometrage": 1000,
        }
        response = self.client.post("/api/vehicules/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_kilometrage_ne_peut_pas_diminuer(self):
        self.client.force_authenticate(self.client_user)
        response = self.client.patch(
            f"/api/vehicules/{self.vehicule.id}/", {"kilometrage": 1000}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_suppression_est_un_soft_delete(self):
        self.client.force_authenticate(self.client_user)
        response = self.client.delete(f"/api/vehicules/{self.vehicule.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.vehicule.refresh_from_db()
        self.assertFalse(self.vehicule.actif)