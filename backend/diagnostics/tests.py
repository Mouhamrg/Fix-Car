from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from affectations.models import Affectation
from comptes.models import Profil
from demandes_reparation.models import DemandeReparation
from vehicules.models import Vehicule

from .models import Diagnostic

User = get_user_model()


class DiagnosticAPITestCase(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username="client1", password="motdepasse123")

        self.mecanicien1 = User.objects.create_user(username="mecano1", password="motdepasse123")
        self.mecanicien1.profil.role = Profil.Role.MECANICIEN
        self.mecanicien1.profil.save()

        self.mecanicien2 = User.objects.create_user(username="mecano2", password="motdepasse123")
        self.mecanicien2.profil.role = Profil.Role.MECANICIEN
        self.mecanicien2.profil.save()

        self.gestionnaire = User.objects.create_user(username="gestion1", password="motdepasse123")
        self.gestionnaire.profil.role = Profil.Role.GESTIONNAIRE
        self.gestionnaire.profil.save()

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
            statut=DemandeReparation.Statut.EN_TRAITEMENT,
        )
        self.affectation = Affectation.objects.create(
            demande=self.demande, mecanicien=self.mecanicien1, affecte_par=self.gestionnaire
        )

    def _payload_valide(self):
        return {
            "demande": self.demande.id,
            "notes_techniques": "Plaquettes de frein avant usées à 90%.",
            "travaux_a_effectuer": "Remplacement des plaquettes et disques avant.",
            "cout_estime": "285.50",
        }

    def test_mecanicien_assigne_peut_creer_diagnostic(self):
        self.client.force_authenticate(self.mecanicien1)
        response = self.client.post("/api/diagnostics/", self._payload_valide())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["statut"], Diagnostic.Statut.EN_ATTENTE_VALIDATION)

    def test_mecanicien_non_assigne_refuse(self):
        self.client.force_authenticate(self.mecanicien2)
        response = self.client.post("/api/diagnostics/", self._payload_valide())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_ne_peut_pas_creer_diagnostic(self):
        self.client.force_authenticate(self.client_user)
        response = self.client.post("/api/diagnostics/", self._payload_valide())
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_diagnostic_refuse_si_demande_pas_en_traitement(self):
        self.demande.statut = DemandeReparation.Statut.EN_ATTENTE
        self.demande.save()
        self.client.force_authenticate(self.mecanicien1)
        response = self.client.post("/api/diagnostics/", self._payload_valide())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cout_negatif_refuse(self):
        self.client.force_authenticate(self.mecanicien1)
        payload = self._payload_valide()
        payload["cout_estime"] = "-10.00"
        response = self.client.post("/api/diagnostics/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_peut_valider_le_devis(self):
        diagnostic = Diagnostic.objects.create(
            demande=self.demande,
            mecanicien=self.mecanicien1,
            notes_techniques="Notes",
            travaux_a_effectuer="Travaux",
            cout_estime=Decimal("100.00"),
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.post(f"/api/diagnostics/{diagnostic.id}/valider/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        diagnostic.refresh_from_db()
        self.assertEqual(diagnostic.statut, Diagnostic.Statut.ACCEPTE)
        self.assertIsNotNone(diagnostic.date_reponse_client)

    def test_client_peut_refuser_le_devis(self):
        diagnostic = Diagnostic.objects.create(
            demande=self.demande,
            mecanicien=self.mecanicien1,
            notes_techniques="Notes",
            travaux_a_effectuer="Travaux",
            cout_estime=Decimal("100.00"),
        )
        self.client.force_authenticate(self.client_user)
        response = self.client.post(
            f"/api/diagnostics/{diagnostic.id}/refuser/",
            {"commentaire_client": "Trop cher, je vais voir ailleurs."},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        diagnostic.refresh_from_db()
        self.assertEqual(diagnostic.statut, Diagnostic.Statut.REFUSE)
        self.assertEqual(diagnostic.commentaire_client, "Trop cher, je vais voir ailleurs.")

    def test_autre_client_ne_peut_pas_valider(self):
        diagnostic = Diagnostic.objects.create(
            demande=self.demande,
            mecanicien=self.mecanicien1,
            notes_techniques="Notes",
            travaux_a_effectuer="Travaux",
            cout_estime=Decimal("100.00"),
        )
        autre_client = User.objects.create_user(username="client2", password="motdepasse123")
        self.client.force_authenticate(autre_client)
        response = self.client.post(f"/api/diagnostics/{diagnostic.id}/valider/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_revision_apres_refus_relance_la_validation(self):
        diagnostic = Diagnostic.objects.create(
            demande=self.demande,
            mecanicien=self.mecanicien1,
            notes_techniques="Notes",
            travaux_a_effectuer="Travaux",
            cout_estime=Decimal("100.00"),
            statut=Diagnostic.Statut.REFUSE,
            commentaire_client="Trop cher",
        )
        self.client.force_authenticate(self.mecanicien1)
        response = self.client.patch(
            f"/api/diagnostics/{diagnostic.id}/", {"cout_estime": "75.00"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        diagnostic.refresh_from_db()
        self.assertEqual(diagnostic.statut, Diagnostic.Statut.EN_ATTENTE_VALIDATION)
        self.assertEqual(diagnostic.commentaire_client, "")
        self.assertEqual(diagnostic.cout_estime, Decimal("75.00"))

    def test_diagnostic_accepte_non_modifiable(self):
        diagnostic = Diagnostic.objects.create(
            demande=self.demande,
            mecanicien=self.mecanicien1,
            notes_techniques="Notes",
            travaux_a_effectuer="Travaux",
            cout_estime=Decimal("100.00"),
            statut=Diagnostic.Statut.ACCEPTE,
        )
        self.client.force_authenticate(self.mecanicien1)
        response = self.client.patch(
            f"/api/diagnostics/{diagnostic.id}/", {"cout_estime": "999.00"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_diagnostic_refuse(self):
        Diagnostic.objects.create(
            demande=self.demande,
            mecanicien=self.mecanicien1,
            notes_techniques="Notes",
            travaux_a_effectuer="Travaux",
            cout_estime=Decimal("100.00"),
        )
        self.client.force_authenticate(self.mecanicien1)
        response = self.client.post("/api/diagnostics/", self._payload_valide())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
