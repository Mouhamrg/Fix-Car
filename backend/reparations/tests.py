"""Tests des demandes de reparation (#64)."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import DemandeReparation

User = get_user_model()


def creer_demande(client, **surcharges):
    """Fabrique une demande de reparation avec des valeurs par defaut raisonnables."""
    donnees = {
        'titre': 'Bruit moteur',
        'vehicule': 'Honda Civic 2018',
        'description': 'Bruit metallique au demarrage.',
        'client': client,
    }
    donnees.update(surcharges)
    return DemandeReparation.objects.create(**donnees)


class DemandeReparationModelTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='testuser', password='x')

    def test_statut_par_defaut_en_attente(self):
        demande = creer_demande(self.client_user)
        self.assertEqual(demande.statut, DemandeReparation.Statut.EN_ATTENTE)

    def test_str_contient_titre_et_vehicule(self):
        demande = creer_demande(self.client_user)
        self.assertEqual(str(demande), 'Bruit moteur — Honda Civic 2018')

    def test_tri_par_date_creation_decroissante(self):
        ancienne = creer_demande(self.client_user, titre='Ancienne demande')
        recente = creer_demande(self.client_user, titre='Recente demande')
        self.assertEqual(list(DemandeReparation.objects.all()), [recente, ancienne])


class DemandeReparationApiTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='testuser', password='x', first_name='Jean', last_name='Tremblay'
        )
        self.autre_client = User.objects.create_user(username='julie', password='x')
        self.demande = creer_demande(self.client_user)
        self.url_liste = '/api/demandes/'
        self.url_detail = f'/api/demandes/{self.demande.id}/'

    def payload(self, **surcharges):
        donnees = {
            'titre': 'Vidange',
            'vehicule': 'Toyota Corolla 2021',
            'description': "Vidange d'huile requise.",
        }
        donnees.update(surcharges)
        return donnees

    # --- Authentification ---

    def test_acces_refuse_sans_authentification(self):
        for methode, url in [
            (self.client.get, self.url_liste),
            (self.client.post, self.url_liste),
            (self.client.put, self.url_detail),
            (self.client.delete, self.url_detail),
        ]:
            reponse = methode(url)
            self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Lecture ---

    def test_tout_utilisateur_authentifie_voit_les_demandes(self):
        self.client.force_authenticate(self.autre_client)
        reponse = self.client.get(self.url_liste)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reponse.data), 1)
        self.assertEqual(reponse.data[0]['titre'], 'Bruit moteur')

    def test_client_nom_utilise_le_nom_complet(self):
        self.client.force_authenticate(self.client_user)
        reponse = self.client.get(self.url_detail)
        self.assertEqual(reponse.data['client_nom'], 'Jean Tremblay')

    def test_client_nom_retombe_sur_le_nom_utilisateur(self):
        demande = creer_demande(self.autre_client)
        self.client.force_authenticate(self.client_user)
        reponse = self.client.get(f'/api/demandes/{demande.id}/')
        self.assertEqual(reponse.data['client_nom'], 'julie')

    # --- Création ---

    def test_creation_assigne_le_client_connecte(self):
        self.client.force_authenticate(self.autre_client)
        reponse = self.client.post(self.url_liste, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['client'], self.autre_client.id)
        self.assertEqual(reponse.data['statut'], 'en_attente')

    def test_creation_ignore_un_client_fourni_dans_la_requete(self):
        self.client.force_authenticate(self.autre_client)
        reponse = self.client.post(
            self.url_liste, self.payload(client=self.client_user.id)
        )
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['client'], self.autre_client.id)

    def test_creation_ignore_un_statut_fourni_dans_la_requete(self):
        self.client.force_authenticate(self.client_user)
        reponse = self.client.post(self.url_liste, self.payload(statut='terminee'))
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['statut'], 'en_attente')

    def test_creation_refuse_un_champ_obligatoire_manquant(self):
        self.client.force_authenticate(self.client_user)
        donnees = self.payload()
        del donnees['titre']
        reponse = self.client.post(self.url_liste, donnees)
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('titre', reponse.data)

    # --- Modification ---

    def test_auteur_peut_modifier_sa_demande(self):
        self.client.force_authenticate(self.client_user)
        reponse = self.client.put(
            self.url_detail, self.payload(titre='Bruit moteur persistant')
        )
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.demande.refresh_from_db()
        self.assertEqual(self.demande.titre, 'Bruit moteur persistant')

    def test_non_auteur_ne_peut_pas_modifier(self):
        self.client.force_authenticate(self.autre_client)
        reponse = self.client.put(self.url_detail, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)

    # --- Suppression ---

    def test_auteur_peut_supprimer_sa_demande(self):
        self.client.force_authenticate(self.client_user)
        reponse = self.client.delete(self.url_detail)
        self.assertEqual(reponse.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DemandeReparation.objects.filter(id=self.demande.id).exists())

    def test_non_auteur_ne_peut_pas_supprimer(self):
        self.client.force_authenticate(self.autre_client)
        reponse = self.client.delete(self.url_detail)
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(DemandeReparation.objects.filter(id=self.demande.id).exists())
