from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import RendezVous

Utilisateur = get_user_model()


def date_future(jours=3):
    d = timezone.now() + timedelta(days=jours)
    return d.replace(minute=0, second=0, microsecond=0)


class RendezVousAPITests(APITestCase):
    def setUp(self):
        self.client_a = Utilisateur.objects.create_user(
            username="client_a", password="MotDePasse123!"
        )
        self.client_b = Utilisateur.objects.create_user(
            username="client_b", password="MotDePasse123!"
        )
        self.url_liste = "/api/rendez-vous/"

    def _creer_rdv(self, proprietaire, statut=RendezVous.Statut.DEMANDE):
        return RendezVous.objects.create(
            client=proprietaire,
            date_heure=date_future(),
            motif="Bruit suspect au freinage",
            statut=statut,
        )

    def _url_detail(self, rdv):
        return f"{self.url_liste}{rdv.pk}/"

    # ---- Cas nominaux ----

    def test_client_cree_un_rendez_vous(self):
        self.client.force_authenticate(self.client_a)
        reponse = self.client.post(
            self.url_liste,
            {"date_heure": date_future().isoformat(), "motif": "Changement d'huile"},
        )
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data["statut"], RendezVous.Statut.DEMANDE)
        self.assertEqual(reponse.data["client"], self.client_a.pk)

    def test_client_modifie_son_rendez_vous(self):
        rdv = self._creer_rdv(self.client_a)
        self.client.force_authenticate(self.client_a)
        reponse = self.client.patch(self._url_detail(rdv), {"motif": "Changement de pneus"})
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["motif"], "Changement de pneus")

    def test_client_annule_son_rendez_vous(self):
        rdv = self._creer_rdv(self.client_a)
        self.client.force_authenticate(self.client_a)
        reponse = self.client.post(self._url_detail(rdv) + "annuler/")
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["statut"], RendezVous.Statut.ANNULE)


        # ---- Controle d'acces ----

    def test_acces_refuse_sans_authentification(self):
        reponse = self.client.get(self.url_liste)
        self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_client_ne_voit_que_ses_rendez_vous(self):
        self._creer_rdv(self.client_a)
        self._creer_rdv(self.client_b)
        self.client.force_authenticate(self.client_a)
        reponse = self.client.get(self.url_liste)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reponse.data), 1)

    def test_client_ne_modifie_pas_le_rdv_d_un_autre(self):
        rdv = self._creer_rdv(self.client_b)
        self.client.force_authenticate(self.client_a)
        reponse = self.client.patch(self._url_detail(rdv), {"motif": "Piratage"})
        # 404 et non 403 : le queryset filtre masque meme l'existence
        # du RDV d'autrui — voulu (pas de fuite d'information).
        self.assertEqual(reponse.status_code, status.HTTP_404_NOT_FOUND)

    def test_le_champ_client_du_json_est_ignore(self):
        # "client" est en read_only : meme fourni, il doit etre ignore
        # et le RDV assigne a l'utilisateur authentifie.
        self.client.force_authenticate(self.client_a)
        reponse = self.client.post(
            self.url_liste,
            {
                "client": self.client_b.pk,
                "date_heure": date_future().isoformat(),
                "motif": "Tentative d'usurpation",
            },
        )
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data["client"], self.client_a.pk)

    # ---- Transitions d'etat (DoD) ----

    def test_annuler_un_rdv_deja_annule_echoue(self):
        rdv = self._creer_rdv(self.client_a, statut=RendezVous.Statut.ANNULE)
        self.client.force_authenticate(self.client_a)
        reponse = self.client.post(self._url_detail(rdv) + "annuler/")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_modifier_un_rdv_annule_echoue(self):
        rdv = self._creer_rdv(self.client_a, statut=RendezVous.Statut.ANNULE)
        self.client.force_authenticate(self.client_a)
        reponse = self.client.patch(self._url_detail(rdv), {"motif": "Trop tard"})
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_completer_un_rdv_non_confirme_echoue(self):
        rdv = self._creer_rdv(self.client_a)  # statut demande
        self.client.force_authenticate(self.client_a)
        reponse = self.client.post(self._url_detail(rdv) + "completer/")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_modification_d_un_rdv_confirme_repasse_a_demande(self):
        rdv = self._creer_rdv(self.client_a, statut=RendezVous.Statut.CONFIRME)
        self.client.force_authenticate(self.client_a)
        reponse = self.client.patch(
            self._url_detail(rdv), {"date_heure": date_future(jours=7).isoformat()}
        )
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["statut"], RendezVous.Statut.DEMANDE)

    # ---- Cas limites ----

    def test_date_dans_le_passe_refusee(self):
        self.client.force_authenticate(self.client_a)
        reponse = self.client.post(
            self.url_liste,
            {
                "date_heure": (timezone.now() - timedelta(days=1)).isoformat(),
                "motif": "Machine a voyager dans le temps",
            },
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_motif_manquant_refuse(self):
        self.client.force_authenticate(self.client_a)
        reponse = self.client.post(
            self.url_liste, {"date_heure": date_future().isoformat()}
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)


    def test_date_hors_creneau_de_15_minutes_refusee(self):
        self.client.force_authenticate(self.client_a)
        date_invalide = (timezone.now() + timedelta(days=3)).replace(
            minute=7, second=0, microsecond=0
        )
        reponse = self.client.post(
            self.url_liste,
            {"date_heure": date_invalide.isoformat(), "motif": "Créneau bancal"},
        )
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)