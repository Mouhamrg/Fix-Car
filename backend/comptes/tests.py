from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Profil

User = get_user_model()


class InscriptionAPITestCase(APITestCase):
    def test_inscription_reussie(self):
        payload = {
            "username": "client1",
            "email": "client1@example.com",
            "password": "MotDePasseSolide123!",
            "password2": "MotDePasseSolide123!",
            "first_name": "Julie",
            "last_name": "Tremblay",
            "telephone": "514-123-4567",
            "code_postal": "H2X 1Y6",
        }
        response = self.client.post("/api/comptes/inscription/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="client1")
        self.assertTrue(user.check_password("MotDePasseSolide123!"))
        self.assertEqual(user.profil.role, Profil.Role.CLIENT)

    def test_mots_de_passe_differents_refuses(self):
        payload = {
            "username": "client2",
            "email": "client2@example.com",
            "password": "MotDePasseSolide123!",
            "password2": "AutreChose456!",
        }
        response = self.client.post("/api/comptes/inscription/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mot_de_passe_trop_simple_refuse(self):
        payload = {
            "username": "client3",
            "email": "client3@example.com",
            "password": "12345678",
            "password2": "12345678",
        }
        response = self.client.post("/api/comptes/inscription/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_duplique_refuse(self):
        User.objects.create_user(
            username="existant", email="dup@example.com", password="MotDePasseSolide123!"
        )
        payload = {
            "username": "nouveauclient",
            "email": "dup@example.com",
            "password": "MotDePasseSolide123!",
            "password2": "MotDePasseSolide123!",
        }
        response = self.client.post("/api/comptes/inscription/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_telephone_invalide_refuse(self):
        payload = {
            "username": "client4",
            "email": "client4@example.com",
            "password": "MotDePasseSolide123!",
            "password2": "MotDePasseSolide123!",
            "telephone": "123",
        }
        response = self.client.post("/api/comptes/inscription/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfilAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="client1", email="client1@example.com", password="MotDePasseSolide123!"
        )
        # Le signal post_save a déjà créé un Profil vide : on le met à jour
        # plutôt que d'en créer un second (OneToOne = contrainte UNIQUE).
        self.user.profil.telephone = "514-123-4567"
        self.user.profil.save()

    def test_acces_profil_sans_authentification_refuse(self):
        response = self.client.get("/api/comptes/profil/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_consultation_de_son_propre_profil(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/comptes/profil/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "client1")

    def test_mise_a_jour_du_profil(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            "/api/comptes/profil/", {"ville": "Montréal", "telephone": "438-987-6543"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profil.refresh_from_db()
        self.assertEqual(self.user.profil.ville, "Montréal")

    def test_impossible_de_sattribuer_un_role(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/comptes/profil/", {"role": "GESTIONNAIRE"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profil.refresh_from_db()
        self.assertEqual(self.user.profil.role, Profil.Role.CLIENT)

    def test_mecanicien_peut_modifier_sa_disponibilite(self):
        mecanicien = User.objects.create_user(username="mecano1", password="MotDePasseSolide123!")
        mecanicien.profil.role = Profil.Role.MECANICIEN
        mecanicien.profil.save()

        self.client.force_authenticate(mecanicien)
        response = self.client.patch("/api/comptes/profil/", {"disponible": False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mecanicien.profil.refresh_from_db()
        self.assertFalse(mecanicien.profil.disponible)


class ChangementMotDePasseAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="client1", email="client1@example.com", password="AncienMotDePasse123!"
        )

    def test_changement_reussi(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/comptes/changer-mot-de-passe/",
            {
                "ancien_mot_de_passe": "AncienMotDePasse123!",
                "nouveau_mot_de_passe": "NouveauMotDePasse456!",
                "nouveau_mot_de_passe2": "NouveauMotDePasse456!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NouveauMotDePasse456!"))

    def test_ancien_mot_de_passe_incorrect(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/comptes/changer-mot-de-passe/",
            {
                "ancien_mot_de_passe": "MauvaisMotDePasse",
                "nouveau_mot_de_passe": "NouveauMotDePasse456!",
                "nouveau_mot_de_passe2": "NouveauMotDePasse456!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
