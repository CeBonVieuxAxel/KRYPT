# Journal des Modifications — KRYPT (`CHANGELOG_CODEX.md`)

> **Instruction pour Codex CLI** : À chaque session, ajoute une nouvelle entrée chronologique en haut de ce fichier avec la date, les fichiers créés/modifiés et les prochaines étapes.

---

## [2026-11-20] — Icônes Windows et désinstallation complète
- **Fichiers modifiés** : `src/main/index.js`, `installer/main.js`, `scripts/build-setup.ps1`, `package.json`, `CHANGELOG_CODEX.md`.
- **Icônes** : AppUserModelId et icône KRYPT ajoutés aux fenêtres principale et installeur. Le script applique `rcedit` à `KryptInstaller.exe` et `Krypt.exe` quand disponible, et transmet l’icône à IExpress ; raccourcis Bureau/Menu Démarrer définissent explicitement `IconLocation`.
- **Désinstallation** : l’installation crée `Uninstall-Krypt.ps1` et `.bat`, inscrit Krypt dans Applications installées avec Axel LEFEBVRE, puis supprime processus, raccourcis, démarrage automatique et registre. Elle demande avant d’effacer les données locales, puis programme la suppression différée du dossier d’installation.
- **Vérifications** : syntaxe Node et présence de `rcedit.exe` validées. La production IExpress reste dépendante de son exécution sur un Windows hors sandbox.
- **Prochaines étapes** : lancer le Setup final pour vérifier l’icône dans la barre des tâches, l’entrée Applications installées et le désinstalleur.

## [2026-11-20] — Correctif du runtime de l’installeur
- **Fichiers modifiés** : `installer/main.js`, `installer/krypt-installer.html`, `scripts/build-setup.ps1`, `CHANGELOG_CODEX.md`.
- **Runtime** : `default_app.asar` est explicitement supprimé. Le bundle place l’application de l’installeur dans `resources/app` et la charge utile Krypt dans `resources/app-payload`, hors ASAR. Le chemin est résolu par `process.resourcesPath`, avec fallback développement vers `release/Krypt-portable`; les fichiers `.asar` sont ignorés durant la copie.
- **Interface** : fenêtre à 560 px et conteneur vertical stable ; le logo, KRYPT et la version restent visibles durant l’extraction.
- **Vérifications** : la reconstruction confirme l’absence de `resources/default_app.asar` et la présence de `resources/app/main.js` ainsi que `resources/app-payload/Krypt.exe`. IExpress refuse encore silencieusement de produire son conteneur final dans cet environnement ; aucun faux Setup n’est publié.
- **Prochaines étapes** : exécuter le script IExpress sur un poste Windows hors sandbox ou produire le Setup via le workflow GitHub Windows.

## [2026-11-20] — Dépôt GitHub prêt à publier
- **Dossier créé** : `github-ready/` dans le workspace, avec dépôt Git indépendant sur la branche `main`.
- **Contenu** : sources `src`, installeur, scripts, icônes de build, assets, documentation, workflow GitHub Actions et fichiers de publication. Aucun artefact `node_modules`, `release`, `dist`, coffre ou binaire n’est inclus.
- **Git** : commit initial `feat: initial release Krypt v1.0.0` créé pour Axel LEFEBVRE.
- **Prochaines étapes** : créer le dépôt distant GitHub, ajouter `origin`, puis pousser `main` et un tag `v1.0.0`.

## [2026-11-20] — Exécutable portable Windows créé
- **Artefact créé** : `release/Krypt-portable/Krypt.exe` avec son runtime Electron et `resources/app`.
- **Résultat** : exécutable Windows réel créé localement sans attendre l’outil de signature téléchargé par `electron-builder`. Le dossier `Krypt-portable` doit rester intact autour de `Krypt.exe`.
- **Prochaines étapes** : lancer `Krypt.exe` sur Windows, puis utiliser le workflow GitHub pour produire le Setup NSIS signable.

## [2026-11-20] — Préparation de la publication Windows et GitHub
- **Fichiers créés/modifiés** : `installer/`, `build/icon.png`, `build/icon.ico`, `package.json`, `.gitignore`, `LICENSE`, `README.md`, `.github/workflows/release.yml`, `CHANGELOG_CODEX.md`.
- **Installeur** : mini-application Electron frameless 500×540 fidèle au prototype. Elle sélectionne le dossier via IPC, copie réellement le payload avec progression, propose raccourci Bureau/démarrage et lance Krypt après installation. Démarrage de prévisualisation : `npm run installer`.
- **Distribution** : appId `com.krypt.vault`, cibles Windows NSIS, portable et ZIP, sortie `release/`, installeur `Krypt-Setup-1.0.0.exe`, icônes Windows générées dans `build/`, scripts `pack` et `dist:win`.
- **GitHub** : README, licence MIT 2026 Axel LEFEBVRE, ignore list de publication et workflow de release Windows déclenché par tag `v*`.
- **Vérifications** : syntaxe et génération des icônes validées. `npm run pack` atteint `release/win-unpacked`, puis est bloqué dans cet environnement par l’interdiction de connexion HTTPS de `electron-builder`; le runner `windows-latest` du workflow dispose du réseau nécessaire.
- **Prochaines étapes** : pousser un tag `v1.0.0` pour faire produire et attacher les installateurs à une GitHub Release ; configurer un certificat de signature Windows si disponible.

## [2026-11-20] — Modales sombres et fermeture fiable
- **Fichiers modifiés** : `src/renderer/renderer.js`, `src/main/vault.js`, `CHANGELOG_CODEX.md`.
- **Type de secret** : le `<select>` reste compatible pour la sauvegarde mais il est remplacé visuellement par des segments sombres Identifiant, Carte bancaire et Note sécurisée. Les styles globaux `color-scheme: dark`, `select` et `option` protègent aussi toute liste native résiduelle.
- **Champs dynamiques** : Carte bancaire présente Numéro de carte, Expiration et CVV ; Note sécurisée présente Titre et Contenu chiffré. L’expiration est désormais conservée dans le coffre chiffré.
- **Fermeture** : croix, Annuler, Échap et clic sur le backdrop ferment explicitement la modale, avec réinitialisation du formulaire ; les commandes sont sorties de la région de glissement Electron.
- **Vérifications** : syntaxe des modules validée. L’ouverture et les quatre modes de fermeture doivent être confirmés sous `npm.cmd run start` dans une session Windows interactive, le bac à sable ne permettant pas le rendu Chromium/GPU.
- **Prochaines étapes** : vérifier visuellement les trois segments de type et un enregistrement de carte avec expiration.

## [2026-11-20] — Nettoyage du générateur et de la sidebar
- **Fichiers modifiés** : `src/renderer/renderer.js`, `CHANGELOG_CODEX.md`.
- **Générateur** : boutons Régénérer et Copier reconstruits en actions lisibles avec SVG, verre dépoli et contraste noir/blanc ; Copier affiche temporairement « Copié ». Le slider et la case Symboles utilisent l’accent du thème plutôt que le bleu système.
- **Interface** : retrait des descriptions techniques des vues Générateur/Audit, du doublon « Importer CSV » dans la sidebar et de la mention « ZÉRO CLOUD · AES-256 ». Le bas de sidebar ne conserve que Theme Studio et l’export chiffré aligné.
- **Vérifications** : syntaxe du renderer validée ; le rendu sous `npm.cmd run start` doit être confirmé dans une session Windows interactive, le bac à sable ne prenant pas en charge Chromium/GPU.
- **Prochaines étapes** : vérifier le contraste des boutons du générateur dans chaque thème.

## [2026-11-20] — Icônes SVG inline homogènes
- **Fichiers modifiés** : `src/renderer/renderer.js`, `CHANGELOG_CODEX.md`.
- **Icônes** : les glyphes de navigation sont remplacés au rendu par des SVG inline 17×17 (`currentColor`, traits 1.75) : grille, clé, carte, note, étincelles et bouclier. Le bouton de verrouillage est devenu un contrôle carré de 28 px avec l’infobulle demandée.
- **Actions** : SVG ajoutés pour import/export CSV, recherche, nouveau secret, contrôles de fenêtre, fermeture de dialogue, copie, affichage/masquage du mot de passe, édition et suppression. Les cartes sont redécorées après chaque rendu de liste sans boucle d’observation DOM.
- **Interactions** : toutes les icônes ne peuvent pas rétrécir (`flex-shrink: 0`) et s’animent avec opacité et `scale(1.1)` au survol de leur bouton.
- **Vérifications** : syntaxe du renderer validée ; le rendu sous `npm.cmd run start` reste à confirmer sur une session Windows interactive, l’environnement automatisé ne prenant pas en charge Chromium/GPU.
- **Prochaines étapes** : vérifier visuellement les icônes et l’alternance œil/œil barré sur une carte de secret.

## [2026-11-20] — Alignement géométrique de la pilule de navigation
- **Fichiers modifiés** : `src/renderer/renderer.js`, `CHANGELOG_CODEX.md`.
- **Géométrie** : `#nav.sidebar-nav` est désormais le repère flex unique (`position: relative`, colonne, `gap: 4px`). Les boutons `.nav-item` ont une hauteur stricte de 40 px, sans marge, avec centrage vertical Flexbox des icônes, libellés et compteurs.
- **Pilule** : position absolue dans le même conteneur, sans marge et avec `box-sizing: border-box`. `updateActivePill(activeEl)` applique directement `offsetHeight` et `offsetTop` ; il est appelé en `requestAnimationFrame` après les mutations d’affichage du coffre, les clics et les redimensionnements.
- **Vérifications** : syntaxe du renderer validée. Le rendu visuel doit être validé avec `npm.cmd run start` dans une session Windows interactive, le bac à sable ne disposant pas du rendu Chromium/GPU.
- **Prochaines étapes** : confirmer que la première ligne (« Tous les secrets »), son icône et son compteur sont centrés dans la pilule après déverrouillage.

## [2026-11-20] — Navigation latérale à pilule active animée
- **Fichiers modifiés** : `src/renderer/renderer.js`, `CHANGELOG_CODEX.md`.
- **Navigation** : ajout dynamique de `.nav-active-pill` dans le conteneur `nav` relatif. Sa hauteur et sa position suivent l’onglet actif par `offsetHeight` et `offsetTop` avec la transition ressort `280ms cubic-bezier(0.22, 1, 0.36, 1)`.
- **Interactions** : icônes légères, opacité, translation au survol, grossissement de l’icône, état tactile et halo blanc de l’onglet actif. Le contenu central reçoit un fondu-glissement de 200 ms à chaque changement de catégorie.
- **Réactivité** : repositionnement à l’initialisation, au déverrouillage, au redimensionnement via `ResizeObserver` et à toute mutation d’affichage du coffre.
- **Vérifications** : syntaxe du renderer validée ; l’animation visuelle reste à vérifier sous `npm.cmd run start` dans une session Windows interactive, l’environnement automatisé ne prenant pas en charge le rendu Chromium/GPU.
- **Prochaines étapes** : valider visuellement les six catégories et les changements de taille de fenêtre.

## [2026-11-20] — Importation CSV locale et chiffrée
- **Fichiers créés/modifiés** : `src/main/csv.js`, `src/main/vault.js`, `src/main/index.js`, `src/main/preload.js`, `src/renderer/renderer.js`, `CHANGELOG_CODEX.md`.
- **Fonctionnel** : boutons « Importer CSV » ajoutés près de la création de secret et dans le panneau de réglages. Le sélecteur Windows limite la sélection aux fichiers `.csv` ; aucun contenu de CSV ne quitte la machine.
- **Formats** : analyse des séparateurs virgule/point-virgule, guillemets et en-têtes Chrome, Brave, Edge, Azot, Firefox et Bitwarden. En l’absence de nom, le domaine de l’URL devient le titre du service.
- **Sécurité** : les entrées sont ajoutées seulement à un coffre déverrouillé, puis sauvegardées ensemble dans `vault.krypt` via le chiffrement AES-256-GCM existant. Après succès, une boîte native propose de supprimer le CSV resté en clair ; un échec de suppression ne remet pas l’import chiffré en cause.
- **Vérifications** : parseur CSV et cycle création → import → verrouillage → déverrouillage validés avec Node ; syntaxe des modules vérifiée.
- **Prochaines étapes** : vérifier l’ouverture du sélecteur et l’import visuel sous `npm.cmd run start` dans une session Windows interactive.

## [2026-11-20] — Correctif du basculement verrouillage → coffre
- **Fichiers modifiés** : `src/renderer/index.html`, `src/renderer/renderer.js`, `CHANGELOG_CODEX.md`.
- **Cause** : le sélecteur auteur `#app { display:flex }` pouvait prendre le pas sur le style navigateur de l’attribut HTML `hidden`, laissant le coffre et l’écran de verrouillage dans un état visuel incohérent.
- **Correctif** : règle `.hidden,[hidden]{display:none!important}` et contrôleur de visibilité explicite. Après réussite, le coffre reçoit `display:flex`, puis l’écran de verrouillage est fondu, réduit à `scale(.98)` et enfin forcé à `display:none`. Au verrouillage, le mécanisme est strictement inversé.
- **Vérifications** : syntaxe du renderer validée ; le démarrage Electron doit être vérifié dans la session Windows interactive, l’environnement automatisé ne permettant pas de lancer Chromium avec son cache/GPU.
- **Prochaines étapes** : lancer KRYPT puis confirmer visuellement le passage dans les deux sens avec le bouton verrouiller ou `Ctrl+L`.

## [2026-11-20] — Réparation du déverrouillage et création de coffre
- **Fichiers modifiés** : `src/main/vault.js`, `src/main/index.js`, `src/renderer/renderer.js`, `CHANGELOG_CODEX.md`.
- **Moteur** : scrypt est exclusivement fourni par `node:crypto` (`N=32768`, `r=8`, `p=1`) ; aucune dépendance Argon2 native n’est utilisée. Le coffre est créé dans `app.getPath('userData')/vault.krypt`, avec création récursive du répertoire, AES-256-GCM et effacement de clé au verrouillage. La lecture garde la compatibilité des paramètres scrypt enregistrés dans les coffres existants.
- **IPC et interface** : création/déverrouillage renvoient désormais `{ success, entries, error }`. Les erreurs sont affichées directement sous le bouton, le seuil est de six caractères, le bouton donne un état de progression et la transition vers le coffre est animée.
- **Vérifications** : syntaxe Node validée ; cycle isolé création, sauvegarde, verrouillage, refus du mauvais mot de passe et redéverrouillage validé. Electron `37.10.3` est de nouveau installé. Le lancement dans l’environnement automatisé a révélé une indisponibilité GPU ; l’accélération matérielle est désactivée avant le démarrage pour préserver le lancement.
- **Prochaines étapes** : exécuter `npm.cmd run start` sur le poste Windows interactif et confirmer visuellement le flux à l’écran.

## [2026-11-20] — Diagnostic de l’installation Electron
- **Fichiers modifiés** : `package.json`, `CHANGELOG_CODEX.md`.
- **Constat** : le paquet `electron@37.10.3` et l’archive Windows x64 sont présents, mais `node_modules/electron/dist` ne contient que `locales` et ne possède ni `electron.exe`, ni `path.txt`. L’installation est donc incomplète. Node.js `v26.4.0` est concerné par un défaut connu de `extract-zip` : l’extraction s’arrête silencieusement.
- **Correctif** : surcharge de transitivité `yauzl@^3.3.1`, compatible avec `extract-zip` et recommandée comme contournement du défaut. Aucune dépendance d’exécution ni fonctionnalité de KRYPT ne change.
- **Prochaines étapes** : réinstaller les dépendances afin d’appliquer la surcharge, puis vérifier `node_modules/electron/dist/electron.exe` et démarrer KRYPT.

## [2026-11-20] — Première version fonctionnelle Electron locale
- **Fichiers créés** : `package.json`, `.gitignore`, `src/main/index.js`, `src/main/preload.js`, `src/main/vault.js`, `src/renderer/index.html`, `src/renderer/style.css`, `src/renderer/renderer.js`.
- **Fonctionnel** : coffre `%APPDATA%/Krypt/vault.krypt`, dérivation scrypt renforcée sans dépendance native, chiffrement AES-256-GCM de chaque entrée, écriture atomique, verrouillage manuel, `Ctrl+L`, verrouillage Windows et fermeture avec effacement de clé.
- **Interface** : fenêtre frameless/transparente isolée, écran animé, thèmes, recherche, CRUD des secrets, audit hors ligne, générateur CSPRNG, TOTP et nettoyage du presse-papiers après 15 secondes.
- **Distribution** : configuration `electron-builder` pour installeur NSIS et portable Windows sous `release/`.
- **Prochaines étapes** : installer les dépendances (`npm install`), tester l’application Windows et signer les binaires pour une distribution publique.


## [Initialisation] — Setup de l'environnement KRYPT Windows
- **Statut** : Environnement, cahier des charges, logo, bannière et prototype UI prêts pour Codex CLI.
- **Fichiers inclus** :
  - `AGENTS.md` : Règles d'architecture sécurisée, zéro cloud et charte Azot Noir.
  - `docs/CAHIER_DES_CHARGES.md` : Spécifications cryptographiques (Argon2id + AES-256-GCM) et fonctionnelles.
  - `assets/krypt-logo.svg` & `assets/krypt-banner.svg` : Identité visuelle vectorielle et bannière GitHub.
  - `prototype/krypt-ui.html` : Prototype interactif de l'écran de verrouillage et du coffre-fort.
  - `PROMPT_CODEX.md` : Prompt prêt à exécuter dans Codex CLI.
- **Prochaines étapes pour Codex** :
  1. Initialiser le projet Electron + `package.json` (`argon2`, `electron-builder`).
  2. Implémenter le moteur cryptographique local (`src/main/cryptoVault.js`) avec Argon2id + AES-256-GCM.
  3. Construire l'UI complète (`src/renderer/`) fidèle au prototype et configurer le build Windows `.exe`.
