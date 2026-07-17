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
            'username': 'nouveau',
            'email': 'nouveau@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Nouveau',
            'last_name': 'User',
            'role': 'CLIENT',
            'telephone': '1234567890'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

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

    def test_inscription_role_invalide(self):
        response = self.client.post('/api/comptes/inscription/', {
            'username': 'nouveau2',
            'email': 'nouveau2@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Nouveau',
            'last_name': 'User',
            'role': 'ADMINISTRATEUR',
            'telephone': '1234567890'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_inscription_client(self):
        response = self.client.post('/api/comptes/inscription/', {
            'username': 'nouveau3',
            'email': 'nouveau3@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Nouveau',
            'last_name': 'User',
            'role': 'CLIENT',
            'telephone': '1234567890'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        nouveau = Utilisateur.objects.get(username='nouveau3')
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