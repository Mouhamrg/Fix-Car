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
            role='client'
        )

    def test_inscription(self):
        response = self.client.post('/api/comptes/inscription/', {
            'username': 'nouveau',
            'email': 'nouveau@test.com',
            'password': 'MotDePasse123!',
            'first_name': 'Nouveau',
            'last_name': 'User',
            'role': 'client',
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
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f'/api/comptes/{self.user.id}/desactiver/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_changer_role_admin(self):
        admin = Utilisateur.objects.create_user(
            username='admin',
            password='MotDePasse123!',
            role='administrateur'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.patch(
            f'/api/comptes/{self.user.id}/changer-role/',
            {'role': 'mecanicien'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'mecanicien')

    def test_changer_role_non_admin(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f'/api/comptes/{self.user.id}/changer-role/',
            {'role': 'mecanicien'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reactiver_compte(self):
        admin = Utilisateur.objects.create_user(
            username='admin2',
            password='MotDePasse123!',
            role='administrateur'
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