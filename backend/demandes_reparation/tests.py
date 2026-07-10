from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from vehicules.models import Vehicule

from .models import DemandeReparation

User = get_user_model()


class DemandeReparationAPITestCase(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username="client1", password="motdepasse123")
        self.autre_client = User.objects.create_user(username="client2", password="motdepasse123")
        self.mecanicien = User.objects.create_user(
            username="mecano1", password="motdepasse123", is_staff=True
        )

        self.vehicule_client1 = Vehicule.objects.create(
            proprietaire=self.client_user,
            marque="Toyota",
            modele="Corolla",
            annee=2019,
            plaque_immatriculation="ABC 123",
            kilometrage=45000,
        )
        self.vehicule_client2 = Vehicule.objects.create(
            proprietaire=self.autre_client,
            marque="Honda",
            modele="Civic",
            annee=2020,
            plaque_immatriculation="XYZ 789",
            kilometrage=20000,
        )
        self.vehicule_inactif = Vehicule.objects.create(
            proprietaire=self.client_user,
            marque="Mazda",
            modele="3",
            annee=2015,
            plaque_immatriculation="DEF 456",
            kilometrage=120000,
            actif=False,
        )

    def _payload_valide(self, vehicule_id=None):
        return {
            "vehicule": vehicule_id or self.vehicule_client1.id,
            "titre": "Bruit anormal au freinage",
            "description_probleme": "J'entends un grincement métallique quand je freine à basse vitesse.",
        }

    def test_creation_demande_reussie(self):
        self.client.force_authenticate(self.client_user)
        response = self.client.post("/api/demandes-reparation/", self._payload_valide())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["statut"], DemandeReparation.Statut.EN_ATTENTE)
        self.assertEqual(response.data["client"], self.client_user.id)

    def test_creation_refusee_si_vehicule_dautrui(self):
        self.client.force_authenticate(self.client_user)
        payload = self._payload_valide(vehicule_id=self.vehicule_client2.id)
        response = self.client.post("/api/demandes-reparation/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creation_refusee_si_vehicule_inactif(self):
        self.client.force_authenticate(self.client_user)
        payload = self._payload_valide(vehicule_id=self.vehicule_inactif.id)
        response = self.client.post("/api/demandes-reparation/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_description_trop_courte_refusee(self):
        self.client.force_authenticate(self.client_user)
        payload = self._payload_valide()
        payload["description_probleme"] = "Bruit"
        response = self.client.post("/api/demandes-reparation/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_ne_voit_que_ses_demandes(self):
        DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule_client1,
            titre="Problème A",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        DemandeReparation.objects.create(
            client=self.autre_client,
            vehicule=self.vehicule_client2,
            titre="Problème B",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.get("/api/demandes-reparation/")
        resultats = response.data.get("results", response.data)
        self.assertEqual(len(resultats), 1)

    def test_mecanicien_voit_toutes_les_demandes(self):
        DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule_client1,
            titre="Problème A",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        DemandeReparation.objects.create(
            client=self.autre_client,
            vehicule=self.vehicule_client2,
            titre="Problème B",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        self.client.force_authenticate(self.mecanicien)
        response = self.client.get("/api/demandes-reparation/")
        resultats = response.data.get("results", response.data)
        self.assertEqual(len(resultats), 2)

    def test_gestionnaire_voit_toutes_les_demandes(self):
        from comptes.models import Profil

        gestionnaire = User.objects.create_user(username="gestion1", password="motdepasse123")
        gestionnaire.profil.role = Profil.Role.GESTIONNAIRE
        gestionnaire.profil.save()

        DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule_client1,
            titre="Problème A",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        self.client.force_authenticate(gestionnaire)
        response = self.client.get("/api/demandes-reparation/")
        resultats = response.data.get("results", response.data)
        self.assertEqual(len(resultats), 1)

    def test_modification_autorisee_si_en_attente(self):
        demande = DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule_client1,
            titre="Problème initial",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.patch(
            f"/api/demandes-reparation/{demande.id}/", {"titre": "Problème corrigé"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["titre"], "Problème corrigé")

    def test_modification_refusee_si_en_traitement(self):
        demande = DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule_client1,
            titre="Problème initial",
            description_probleme="Description suffisamment longue pour passer la validation.",
            statut=DemandeReparation.Statut.EN_TRAITEMENT,
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.patch(
            f"/api/demandes-reparation/{demande.id}/", {"titre": "Tentative de modification"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_annulation_reussie_si_en_attente(self):
        demande = DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule_client1,
            titre="Problème initial",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.post(f"/api/demandes-reparation/{demande.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, DemandeReparation.Statut.ANNULEE)
        self.assertIsNotNone(demande.date_annulation)

    def test_annulation_refusee_si_en_traitement(self):
        demande = DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule_client1,
            titre="Problème initial",
            description_probleme="Description suffisamment longue pour passer la validation.",
            statut=DemandeReparation.Statut.EN_TRAITEMENT,
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.post(f"/api/demandes-reparation/{demande.id}/annuler/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_ne_peut_pas_voir_demande_dautrui(self):
        demande = DemandeReparation.objects.create(
            client=self.autre_client,
            vehicule=self.vehicule_client2,
            titre="Problème B",
            description_probleme="Description suffisamment longue pour passer la validation.",
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.get(f"/api/demandes-reparation/{demande.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
