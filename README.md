<div align="center">
  <img src="build/icon.png" alt="Logo KRYPT" width="84" height="84" />
  <h1>K R Y P T</h1>
  <p><strong>Vos secrets, sans le bruit.</strong></p>
  <p>Gestionnaire de mots de passe local, chiffré et minimaliste pour Windows.</p>
</div>


---

## À propos

**KRYPT** est un coffre-fort numérique conçu pour Windows dans le même univers graphique noir carbone et verre dépoli qu'[Azot Browser](https://github.com/CeBonVieuxAxel/Azot-Browser).  
Zéro cloud, zéro abonnement, zéro télémétrie : toutes vos données restent chiffrées localement sur votre machine.

## Fonctionnalités

- **Chiffrement local** — Dérivation de clé maître et chiffrement authentifié `AES-256-GCM` hors-ligne (`%APPDATA%\Krypt\vault.krypt`).
- **Import CSV** — Importation directe depuis Chrome, Brave, Edge, Azot, Firefox et Bitwarden.
- **Générateur cryptographique** — Génération locale de mots de passe à haute entropie (`crypto.randomBytes`).
- **Codes 2FA (TOTP)** — Génération intégrée des codes temporaires à 6 chiffres.
- **Audit de sécurité local** — Détection hors-ligne des mots de passe faibles ou réutilisés.
- **Theme Studio** — Personnalisation en direct (*Azot Noir*, *OLED Pitch*, *Silver Ice*, *Obsidian Mint*).
- **Installeur & Désinstalleur Windows** — Installation autonome avec intégration native aux Applications Windows.

## Installation

### Windows (Installeur)
Téléchargez la dernière version depuis la page [**Releases**](https://github.com/CeBonVieuxAxel/Krypt/releases/latest) et exécutez `Krypt-Setup-1.0.0.exe`.

### Compilation depuis les sources

```bash
git clone https://github.com/CeBonVieuxAxel/Krypt.git
cd Krypt
npm install
npm start
```

Pour générer l'installeur Windows :

```bash
npm run build:setup
```

## Raccourcis clavier

| Raccourci | Action |
| :--- | :--- |
| `Ctrl + L` | Verrouiller immédiatement le coffre |
| `Ctrl + F` | Rechercher un secret |
| `Échap` | Fermer la boîte de dialogue active |

---

<div align="center">
  Créé par <a href="https://github.com/CeBonVieuxAxel"><strong>Axel LEFEBVRE</strong></a> • Licence MIT
</div>