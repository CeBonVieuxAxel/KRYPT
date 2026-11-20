# Cahier des Charges — **KRYPT** (Gestionnaire de Mots de Passe Local Windows)

## 1. Vision & Identité
- **Nom du projet** : **KRYPT**
- **Slogan** : *« Vos secrets, sans le bruit. »*
- **Créateur** : Axel LEFEBVRE
- **Philosophie** : Un coffre-fort numérique Windows ultra-minimaliste, 100 % hors-ligne, sans abonnement, sans cloud et sans surcharge visuelle, partageant l'esthétique verre dépoli noir d'**Azot**.

## 2. Stack Technique Recommandée (Windows Desktop)
- **Architecture** : Electron (ou Tauri v2 Rust + Web) avec séparation stricte `main` / `preload` (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`) et `package.json` configuré avec `electron-builder` pour générer l'installeur Windows (`.exe` NSIS + Portable).
- **Moteur Cryptographique** :
  - `argon2` (Argon2id : 64 Mo RAM, 3 itérations, parallélisme 4) pour dériver la clé maître depuis le mot de passe principal.
  - Module natif `node:crypto` (`aes-256-gcm` avec IV aléatoire de 96 bits et Tag d'authentification de 128 bits).
  - Option Windows Hello / DPAPI (`safeStorage` d'Electron) pour le déverrouillage rapide biométrique/PIN local.
- **Format du Coffre Local** : Fichier binaire/JSON chiffré unique (`vault.krypt`) stocké localement, avec sauvegarde chiffrée exportable/importable par l'utilisateur.

## 3. Spécifications Fonctionnelles

### 3.1. Écran de Verrouillage (Lock Screen)
- Fond noir carbone `#060607` animé par des atomes/particules 3D noirs et gris métallisé réactifs au curseur.
- Logo géométrique **KRYPT** rotatif/pulsant au centre, champ mot de passe maître avec indicateur de dérivation Argon2id, et verrouillage automatique après inactivité configurable (ex: 3 min) ou verrouillage de session Windows (`powerMonitor.on('lock-screen')`).

### 3.2. Interface Principale (Sidebar Verticale & Coffre Verre Dépoli)
- **Sidebar gauche** (inspirée d'Azot) :
  - Logo **KRYPT** + contrôles de fenêtre minimalistes + bouton de verrouillage rapide (`Ctrl + L`).
  - Catégories avec pilule active glissante : *Tous les éléments*, *Identifiants*, *Cartes bancaires*, *Notes sécurisées*, *Générateur*, *Audit de sécurité*.
  - Accès rapide en bas au **Theme Studio** (*Azot Noir*, *OLED Pitch*, *Silver Ice*, *Obsidian Mint*, couleur libre) et aux **Paramètres**.
- **Liste & Inspecteur d'entrée** :
  - Barre de recherche instantanée (`Ctrl + F`).
  - Affichage net des identifiants, copie en un clic du mot de passe / identifiant / code TOTP 2FA avec compte à rebours d'effacement automatique du presse-papiers (`15s`).
  - Révélation masquée du mot de passe à la demande.

### 3.3. Générateur Cryptographique & Audit Local
- Générateur de mots de passe et phrases secrètes (Diceware) basé sur `crypto.randomInt` avec calcul d'entropie en bits en temps réel.
- **Audit 100 % hors-ligne** : détection des mots de passe faibles, réutilisés ou anciens sans jamais interroger d'API externe.
- **Import / Export** : Import CSV (depuis Bitwarden, Chrome, Azot, KeePass) et export chiffré `.krypt`.
