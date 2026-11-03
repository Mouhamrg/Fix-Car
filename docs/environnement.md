### Étape 1 : Désinstallation des paquets conflictuels
Avant l'installation, suppression de toutes les versions incompatibles installées par défaut :
```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove \$pkg; done
```

### Étape 2 : Configuration du dépôt Apt officiel
1. Mise à jour des paquets et installation des dépendances réseau :
   ```bash
   sudo apt-get update
   sudo apt-get install ca-certificates curl
   ```
2. Création du répertoire des clés et configuration des sources :
   ```bash
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://docker.com -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc
   ```
3. Ajout du dépôt Docker officiel dans les sources Apt de la machine virtuelle :
   ```bash
   echo \
     "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://docker.com \
     \$(. /etc/os-release && echo "\({UBUNTU_CODENAME:-\)VERSION_CODENAME}") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

### Étape 3 : Installation de Docker Engine
Mise à jour de l'index Apt mis à jour avec le nouveau dépôt, puis installation des composants officiels :
```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Étape 4 : Gestion du service avec Systemd
Le démarrage automatique et la gestion de l'état du service s'exécutent avec `systemctl` :
*   **Activer le démarrage automatique au boot :**
    ```bash
    sudo systemctl enable docker.service containerd.service
    ```
*   **Vérifier le statut actuel du service :**
    ```bash
    sudo systemctl status docker
    ```

### Étape 5 : Configuration des privilèges (Post-installation)
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
