"""Tests de la gestion des interventions mécaniques (#67)."""
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Intervention

User = get_user_model()


def creer_intervention(mecanicien, **surcharges):
    """Fabrique une intervention avec des valeurs par défaut raisonnables."""
    donnees = {
        'titre': 'Changement de freins',
        'vehicule': 'Honda Civic 2019 — ABC 123',
        'description': 'Remplacement des plaquettes avant.',
        'date_intervention': date(2026, 7, 1),
        'duree_heures': Decimal('1.50'),
        'mecanicien': mecanicien,
    }
    donnees.update(surcharges)
    return Intervention.objects.create(**donnees)


class InterventionModelTests(APITestCase):
    def setUp(self):
        self.mecanicien = User.objects.create_user(username='marc', password='x')

    def test_statut_par_defaut_en_cours(self):
        intervention = creer_intervention(self.mecanicien)
        self.assertEqual(intervention.statut, Intervention.Statut.EN_COURS)

    def test_str_contient_titre_et_vehicule(self):
        intervention = creer_intervention(self.mecanicien)
        self.assertEqual(
            str(intervention),
            'Changement de freins — Honda Civic 2019 — ABC 123',
        )

    def test_tri_par_date_intervention_decroissante(self):
        ancienne = creer_intervention(
            self.mecanicien, date_intervention=date(2026, 6, 1)
        )
        recente = creer_intervention(
            self.mecanicien, date_intervention=date(2026, 7, 5)
        )
        self.assertEqual(list(Intervention.objects.all()), [recente, ancienne])


class InterventionApiTests(APITestCase):
    def setUp(self):
        self.mecanicien = User.objects.create_user(
            username='marc', password='x', first_name='Marc', last_name='Tremblay'
        )
        self.autre_mecanicien = User.objects.create_user(username='julie', password='x')
        self.intervention = creer_intervention(self.mecanicien)
        self.url_liste = '/api/interventions/'
        self.url_detail = f'/api/interventions/{self.intervention.id}/'

    def payload(self, **surcharges):
        donnees = {
            'titre': 'Vidange',
            'vehicule': 'Toyota Corolla 2021 — XYZ 456',
            'description': "Vidange d'huile et remplacement du filtre.",
            'date_intervention': '2026-07-06',
            'duree_heures': '0.75',
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

    def test_tout_utilisateur_authentifie_voit_les_interventions(self):
        self.client.force_authenticate(self.autre_mecanicien)
        reponse = self.client.get(self.url_liste)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reponse.data), 1)
        self.assertEqual(reponse.data[0]['titre'], 'Changement de freins')

    def test_mecanicien_nom_utilise_le_nom_complet(self):
        self.client.force_authenticate(self.mecanicien)
        reponse = self.client.get(self.url_detail)
        self.assertEqual(reponse.data['mecanicien_nom'], 'Marc Tremblay')

    def test_mecanicien_nom_retombe_sur_le_nom_utilisateur(self):
        intervention = creer_intervention(self.autre_mecanicien)
        self.client.force_authenticate(self.mecanicien)
        reponse = self.client.get(f'/api/interventions/{intervention.id}/')
        self.assertEqual(reponse.data['mecanicien_nom'], 'julie')

    # --- Création ---

    def test_creation_assigne_le_mecanicien_connecte(self):
        self.client.force_authenticate(self.autre_mecanicien)
        reponse = self.client.post(self.url_liste, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['mecanicien'], self.autre_mecanicien.id)
        self.assertEqual(reponse.data['statut'], 'en_cours')

    def test_creation_ignore_un_mecanicien_fourni_dans_la_requete(self):
        self.client.force_authenticate(self.autre_mecanicien)
        reponse = self.client.post(
            self.url_liste, self.payload(mecanicien=self.mecanicien.id)
        )
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['mecanicien'], self.autre_mecanicien.id)

    def test_creation_refuse_un_statut_invalide(self):
        self.client.force_authenticate(self.mecanicien)
        reponse = self.client.post(self.url_liste, self.payload(statut='annulee'))
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('statut', reponse.data)

    def test_creation_refuse_un_champ_obligatoire_manquant(self):
        self.client.force_authenticate(self.mecanicien)
        donnees = self.payload()
        del donnees['titre']
        reponse = self.client.post(self.url_liste, donnees)
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('titre', reponse.data)

    def test_pieces_utilisees_est_optionnel(self):
        self.client.force_authenticate(self.mecanicien)
        reponse = self.client.post(self.url_liste, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data['pieces_utilisees'], '')

    # --- Modification ---

    def test_auteur_peut_modifier_son_intervention(self):
        self.client.force_authenticate(self.mecanicien)
        reponse = self.client.put(
            self.url_detail, self.payload(titre='Freins — terminé', statut='terminee')
        )
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.intervention.refresh_from_db()
        self.assertEqual(self.intervention.titre, 'Freins — terminé')
        self.assertEqual(self.intervention.statut, Intervention.Statut.TERMINEE)

    def test_non_auteur_ne_peut_pas_modifier(self):
        self.client.force_authenticate(self.autre_mecanicien)
        reponse = self.client.put(self.url_detail, self.payload())
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)

    # --- Suppression ---

    def test_auteur_peut_supprimer_son_intervention(self):
        self.client.force_authenticate(self.mecanicien)
        reponse = self.client.delete(self.url_detail)
        self.assertEqual(reponse.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Intervention.objects.filter(id=self.intervention.id).exists())

    def test_non_auteur_ne_peut_pas_supprimer(self):
        self.client.force_authenticate(self.autre_mecanicien)
        reponse = self.client.delete(self.url_detail)
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Intervention.objects.filter(id=self.intervention.id).exists())
