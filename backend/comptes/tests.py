from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Utilisateur


class UtilisateurTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = Utilisateur.objects.create_user(
            username='testuser',
            password='MotDePasse123!',
            email='test@test.com',
            role='CLIENT'
        )

    def test_inscription(self):
        response = self.client.post('/api/comptes/inscription/', {
            'email': 'nouveau@test.com',
            'password': 'MotDePasse123!',
            'password2': 'MotDePasse123!',
            'first_name': 'Nouveau',
            'last_name': 'User',
            'telephone': '1234567890'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_inscription_mots_de_passe_differents(self):
        response = self.client.post('/api/comptes/inscription/', {
            'email': 'diff@test.com',
            'password': 'MotDePasse123!',
            'password2': 'AutreMotDePasse456!',
            'first_name': 'Test',
            'last_name': 'User',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inscription_username_genere_automatiquement(self):
        response = self.client.post('/api/comptes/inscription/', {
            'email': 'auto.genere@test.com',
            'password': 'MotDePasse123!',
            'password2': 'MotDePasse123!',
            'first_name': 'Auto',
            'last_name': 'Genere',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        nouveau = Utilisateur.objects.get(email='auto.genere@test.com')
        self.assertEqual(nouveau.username, 'auto.genere')

    def test_inscription_role_invalide(self):
        response = self.client.post('/api/comptes/inscription/', {
            'email': 'nouveau2@test.com',
            'password': 'MotDePasse123!',
            'password2': 'MotDePasse123!',
            'first_name': 'Nouveau',
            'last_name': 'User',
            'role': 'ADMINISTRATEUR',
            'telephone': '1234567890'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        nouveau = Utilisateur.objects.get(email='nouveau2@test.com')
        self.assertEqual(nouveau.role, 'CLIENT')

    def test_liste_non_authentifie(self):
        response = self.client.get('/api/comptes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_liste_authentifie(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/comptes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_desactiver_compte(self):
        admin = Utilisateur.objects.create_user(
            username='admin_desactivation', password='MotDePasse123!', role='ADMINISTRATEUR'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/comptes/{self.user.id}/desactiver/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_desactiver_compte_refuse_pour_non_admin(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f'/api/comptes/{self.user.id}/desactiver/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_changer_role_admin(self):
        admin = Utilisateur.objects.create_user(
            username='admin',
            password='MotDePasse123!',
            role='ADMINISTRATEUR'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.patch(
            f'/api/comptes/{self.user.id}/changer-role/',
            {'role': 'MECANICIEN'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'MECANICIEN')

    def test_changer_role_non_admin(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f'/api/comptes/{self.user.id}/changer-role/',
            {'role': 'MECANICIEN'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reactiver_compte(self):
        admin = Utilisateur.objects.create_user(
            username='admin2',
            password='MotDePasse123!',
            role='ADMINISTRATEUR'
        )
        self.user.is_active = False
        self.user.save()
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/comptes/{self.user.id}/reactiver/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

    def test_filtrer_par_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/comptes/?role=client')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_inscription_client(self):
        response = self.client.post('/api/comptes/inscription/', {
            'email': 'nouveau3@test.com',
            'password': 'MotDePasse123!',
            'password2': 'MotDePasse123!',
            'first_name': 'Nouveau',
            'last_name': 'User',
            'role': 'CLIENT',
            'telephone': '1234567890'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        nouveau = Utilisateur.objects.get(email='nouveau3@test.com')
        self.assertEqual(nouveau.role, 'CLIENT')

    def test_suppression_native_refusee_pour_non_admin(self):
        autre = Utilisateur.objects.create_user(
            username='autre', password='MotDePasse123!', role='CLIENT'
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/comptes/{autre.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Utilisateur.objects.filter(id=autre.id).exists())

    def test_suppression_native_autorisee_pour_admin(self):
        admin = Utilisateur.objects.create_user(
            username='admin3', password='MotDePasse123!', role='ADMINISTRATEUR'
        )
        cible = Utilisateur.objects.create_user(
            username='cible', password='MotDePasse123!', role='CLIENT'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.delete(f'/api/comptes/{cible.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Utilisateur.objects.filter(id=cible.id).exists())

    def test_creer_compte_mecanicien_par_gestionnaire(self):
        gestionnaire = Utilisateur.objects.create_user(
            username='gest1', password='MotDePasse123!', role='GESTIONNAIRE'
        )
        self.client.force_authenticate(user=gestionnaire)
        response = self.client.post('/api/comptes/creer/', {
            'username': 'mecano1',
            'email': 'mecano1@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Meca',
            'last_name': 'Nicien',
            'telephone': '1234567890',
            'role': 'MECANICIEN',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['role'], 'MECANICIEN')

    def test_creer_compte_mecanicien_par_admin(self):
        admin = Utilisateur.objects.create_user(
            username='admin_creation1', password='MotDePasse123!', role='ADMINISTRATEUR'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post('/api/comptes/creer/', {
            'username': 'mecano2',
            'email': 'mecano2@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Meca',
            'last_name': 'Nicien2',
            'telephone': '1234567890',
            'role': 'MECANICIEN',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_creer_compte_mecanicien_par_client_refuse(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/comptes/creer/', {
            'username': 'mecano3',
            'email': 'mecano3@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Meca',
            'last_name': 'Nicien3',
            'telephone': '1234567890',
            'role': 'MECANICIEN',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creer_compte_gestionnaire_par_gestionnaire(self):
        gestionnaire = Utilisateur.objects.create_user(
            username='gest2', password='MotDePasse123!', role='GESTIONNAIRE'
        )
        self.client.force_authenticate(user=gestionnaire)
        response = self.client.post('/api/comptes/creer/', {
            'username': 'gest3',
            'email': 'gest3@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Gestion',
            'last_name': 'Naire',
            'telephone': '1234567890',
            'role': 'GESTIONNAIRE',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_creer_compte_administrateur_par_gestionnaire_refuse(self):
        gestionnaire = Utilisateur.objects.create_user(
            username='gest4', password='MotDePasse123!', role='GESTIONNAIRE'
        )
        self.client.force_authenticate(user=gestionnaire)
        response = self.client.post('/api/comptes/creer/', {
            'username': 'admin4',
            'email': 'admin4@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Admin',
            'last_name': 'Istrateur',
            'telephone': '1234567890',
            'role': 'ADMINISTRATEUR',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creer_compte_administrateur_par_admin(self):
        admin = Utilisateur.objects.create_user(
            username='admin_createur', password='MotDePasse123!', role='ADMINISTRATEUR'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post('/api/comptes/creer/', {
            'username': 'admin5',
            'email': 'admin5@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Admin',
            'last_name': 'Istrateur2',
            'telephone': '1234567890',
            'role': 'ADMINISTRATEUR',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_creer_compte_client_redirige_vers_inscription(self):
        gestionnaire = Utilisateur.objects.create_user(
            username='gest5', password='MotDePasse123!', role='GESTIONNAIRE'
        )
        self.client.force_authenticate(user=gestionnaire)
        response = self.client.post('/api/comptes/creer/', {
            'username': 'client6',
            'email': 'client6@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Client',
            'last_name': 'Test',
            'telephone': '1234567890',
            'role': 'CLIENT',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creer_compte_non_authentifie_refuse(self):
        response = self.client.post('/api/comptes/creer/', {
            'username': 'mecano7',
            'email': 'mecano7@test.com',
            'password': 'MotDePasse123!',
            'role': 'MECANICIEN',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_connexion_par_username(self):
        response = self.client.post('/api/token/', {
            'identifiant': 'testuser',
            'password': 'MotDePasse123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_connexion_par_email(self):
        response = self.client.post('/api/token/', {
            'identifiant': 'test@test.com',
            'password': 'MotDePasse123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_connexion_par_telephone(self):
        self.user.telephone = '5145550001'
        self.user.save()
        response = self.client.post('/api/token/', {
            'identifiant': '5145550001',
            'password': 'MotDePasse123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_connexion_identifiant_invalide(self):
        response = self.client.post('/api/token/', {
            'identifiant': 'inexistant@test.com',
            'password': 'MotDePasse123!',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)