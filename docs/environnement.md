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
**Lien d'installation :** Lien vers la page officiel d'isntallation de Docker engine sur ubuntu : 
https://docs.docker.com/engine/install/ubuntu/

**Choix architectural :** J'ai privilégié l'installation de Docker Engine via son dépôt Apt officiel plutôt que 
les paquets `docker.io` (distribué par Ubuntu) ou les paquets Snap, car ces derniers souffrent souvent de 
retards majeurs de mise à jour, d'un manque d'intégration native avec 
les plugins récents (comme le nouveau CLI Docker Compose), et de restrictions d'isolation propres à Snap 
qui bloquent fréquemment l'accès réseau ou le montage de volumes nécessaires au bon fonctionnement 
de nos conteneurs de développement.

**Note technique :** J'ai choisi d'installer Docker Engine via son dépôt Apt officiel plutôt que 
d'utiliser le paquet par défaut `docker.io` d'Ubuntu afin d'éviter les conflits de binaires 
avec d'anciennes versions, tout en garantissant une installation stable, sécurisée et 
native des derniers plugins comme Docker Compose.

**Configuration des privilèges (Post-installation)**

Par défaut, le démon Docker s'exécute en tant que root, ce qui exige l'utilisation de `sudo`. Pour exécuter les commandes Docker en tant qu'utilisateur non-privilégié, l'utilisateur a été ajouté au groupe système `docker` :
1. Création du groupe (généralement déjà créé par l'installateur) :
   ```bash
   sudo groupadd docker
   ```
2. Ajout de l'utilisateur actuel au groupe :
   ```bash
   sudo usermod -aG docker \$USER
   ```
3. Prise en compte immédiate des modifications du groupe sans déconnexion :
   ```bash
   newgrp docker
   ```
