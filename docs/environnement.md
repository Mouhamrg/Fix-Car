# Documentation de l'environnement de développement

Ce document décrit la configuration de la machine virtuelle (VM) utilisée pour le projet.

## 1. Ressources de la VM
*   **Système d'exploitation :** Ubuntu 24.04 LTS
*   **Processeurs (vCPU) :** 2
*   **Mémoire vive (RAM) :** 4 Go
*   **Stockage :** 25 Go SSD

## 2. Configuration Réseau
*   **Mode réseau :** Réseau en pont (Bridged Adapter)
*   **Objectif :** Permet à la VM d'obtenir une adresse IP directement depuis le routeur du réseau physique, 
la rendant accessible comme une machine indépendante sur le réseau local.

## 3. Accès SSH par clés
L'accès à la VM est sécurisé et se fait exclusivement par clé publique/privée.
*   **Génération de la clé (sur l'hôte) :** `ssh-keygen -t ed25519`
*   **Copie de la clé sur la VM :** `ssh-copy-id utilisateur@ip_de_la_vm`
*   **Désactivation de l'authentification par mot de passe :** Configuré dans `/etc/ssh/sshd_config` 
avec `PasswordAuthentication no`.

## 4. Installation de Docker 

Installation de Docker Engine selon la page officielle, méthode du dépôt Apt : 
https://docs.docker.com/engine/install/ubuntu/

Pourquoi le dépôt Apt officiel plutôt que docker.io (paquet Ubuntu) ou Snap :

	* les versions sont plus récentes ;
	* le plugin Docker Compose est inclus ;
	* la désinstallation préalable des anciens paquets évite les conflits entre versions.

## 5. Configuration après installation

Démarrage automatique de Docker au démarrage de la VM :

```bash
sudo systemctl enable docker.service containerd.service
```

Utilisation de Docker sans sudo, en ajoutant l'utilisateur au groupe docker :

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Le groupe docker est normalement créé par l'installation. S'il manque : sudo groupadd docker.

Compromis de sécurité : ajouter un utilisateur au groupe docker lui donne des droits 
équivalents à root sur la VM, car le démon Docker tourne en root. 
Ce compromis est accepté ici : VM de développement à un seul utilisateur, 
accessible uniquement par clés SSH. 
Il ne le serait pas sur un serveur partagé ou de production.

## 6. Vérification

docker version
Résultat attendu : une section Client et une section Server.

```bash
docker run hello-world
```

Résultat attendu : le message « Hello from Docker! ».

Test après redémarrage : sudo reboot, reconnexion en SSH, puis
 
```bash
docker run hello-world
```
sans relancer Docker à la main. Le même message doit s'afficher.
