from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from comptes.models import Profil
from demandes_reparation.models import DemandeReparation
from vehicules.models import Vehicule

from .models import Affectation

User = get_user_model()


class AffectationAPITestCase(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username="client1", password="motdepasse123")

        self.gestionnaire = User.objects.create_user(
            username="gestion1", password="motdepasse123"
        )
        self.gestionnaire.profil.role = Profil.Role.GESTIONNAIRE
        self.gestionnaire.profil.save()

        self.mecanicien1 = User.objects.create_user(
            username="mecano1", password="motdepasse123"
        )
        self.mecanicien1.profil.role = Profil.Role.MECANICIEN
        self.mecanicien1.profil.save()

        self.mecanicien2 = User.objects.create_user(
            username="mecano2", password="motdepasse123"
        )
        self.mecanicien2.profil.role = Profil.Role.MECANICIEN
        self.mecanicien2.profil.disponible = False
        self.mecanicien2.profil.save()

        self.administrateur = User.objects.create_superuser(
            username="admin1", password="motdepasse123", email="admin1@example.com"
        )

        self.vehicule = Vehicule.objects.create(
            proprietaire=self.client_user,
            marque="Toyota",
            modele="Corolla",
            annee=2019,
            plaque_immatriculation="ABC 123",
            kilometrage=45000,
        )
        self.demande = DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=self.vehicule,
            titre="Bruit au freinage",
            description_probleme="Grincement métallique en freinant à basse vitesse.",
        )

    def test_gestionnaire_peut_affecter(self):
        self.client.force_authenticate(self.gestionnaire)
        response = self.client.post(
            "/api/affectations/",
            {"demande": self.demande.id, "mecanicien": self.mecanicien1.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.demande.refresh_from_db()
        self.assertEqual(self.demande.statut, DemandeReparation.Statut.EN_TRAITEMENT)

    def test_administrateur_peut_affecter(self):
        self.client.force_authenticate(self.administrateur)
        response = self.client.post(
            "/api/affectations/",
            {"demande": self.demande.id, "mecanicien": self.mecanicien1.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_mecanicien_ne_peut_pas_affecter(self):
        self.client.force_authenticate(self.mecanicien1)
        response = self.client.post(
            "/api/affectations/",
            {"demande": self.demande.id, "mecanicien": self.mecanicien1.id},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_na_pas_acces_au_module(self):
        self.client.force_authenticate(self.client_user)
        response = self.client.get("/api/affectations/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_utilisateur_non_mecanicien_refuse(self):
        self.client.force_authenticate(self.gestionnaire)
        response = self.client.post(
            "/api/affectations/",
            {"demande": self.demande.id, "mecanicien": self.client_user.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_affectation_refusee(self):
        Affectation.objects.create(
            demande=self.demande, mecanicien=self.mecanicien1, affecte_par=self.gestionnaire
        )
        self.client.force_authenticate(self.gestionnaire)
        response = self.client.post(
            "/api/affectations/",
            {"demande": self.demande.id, "mecanicien": self.mecanicien2.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reaffectation_via_patch(self):
        affectation = Affectation.objects.create(
            demande=self.demande, mecanicien=self.mecanicien1, affecte_par=self.gestionnaire
        )
        self.client.force_authenticate(self.gestionnaire)
        response = self.client.patch(
            f"/api/affectations/{affectation.id}/", {"mecanicien": self.mecanicien2.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        affectation.refresh_from_db()
        self.assertEqual(affectation.mecanicien, self.mecanicien2)

    def test_affectation_impossible_si_demande_terminee(self):
        self.demande.statut = DemandeReparation.Statut.TERMINEE
        self.demande.save()
        self.client.force_authenticate(self.gestionnaire)
        response = self.client.post(
            "/api/affectations/",
            {"demande": self.demande.id, "mecanicien": self.mecanicien1.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mecanicien_voit_seulement_ses_affectations(self):
        Affectation.objects.create(
            demande=self.demande, mecanicien=self.mecanicien1, affecte_par=self.gestionnaire
        )
        vehicule2 = Vehicule.objects.create(
            proprietaire=self.client_user,
            marque="Honda",
            modele="Civic",
            annee=2020,
            plaque_immatriculation="XYZ 789",
            kilometrage=10000,
        )
        demande2 = DemandeReparation.objects.create(
            client=self.client_user,
            vehicule=vehicule2,
            titre="Problème moteur",
            description_probleme="Le moteur cale fréquemment au démarrage.",
        )
        Affectation.objects.create(
            demande=demande2, mecanicien=self.mecanicien2, affecte_par=self.gestionnaire
        )

        self.client.force_authenticate(self.mecanicien1)
        response = self.client.get("/api/affectations/")
        resultats = response.data.get("results", response.data)
        self.assertEqual(len(resultats), 1)
        self.assertEqual(resultats[0]["mecanicien"], self.mecanicien1.id)

    def test_liste_mecaniciens_disponibles(self):
        self.client.force_authenticate(self.gestionnaire)
        response = self.client.get("/api/affectations/mecaniciens-disponibles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertTrue(response.data[0]["disponible"])

    def test_mecanicien_peut_refuser_son_affectation(self):
        affectation = Affectation.objects.create(
            demande=self.demande, mecanicien=self.mecanicien1, affecte_par=self.gestionnaire
        )
        self.demande.statut = DemandeReparation.Statut.EN_TRAITEMENT
        self.demande.save()

        self.client.force_authenticate(self.mecanicien1)
        response = self.client.post(f"/api/affectations/{affectation.id}/refuser/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.demande.refresh_from_db()
        self.assertEqual(self.demande.statut, DemandeReparation.Statut.EN_ATTENTE)
        self.assertFalse(Affectation.objects.filter(id=affectation.id).exists())

    def test_mecanicien_ne_peut_pas_refuser_affectation_dautrui(self):
        affectation = Affectation.objects.create(
            demande=self.demande, mecanicien=self.mecanicien1, affecte_par=self.gestionnaire
        )
        self.client.force_authenticate(self.mecanicien2)
        response = self.client.post(f"/api/affectations/{affectation.id}/refuser/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
