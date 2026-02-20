# Guide de Déploiement - RP Conseil Dashboard

Votre application est prête ! Elle utilise React et Vite pour générer un site statique ultra-rapide.

## 1. Tester localement
Pour voir le résultat sur votre machine :
1. Ouvrez un terminal dans le dossier du projet.
2. Lancez la commande :
   ```bash
   npm run dev
   ```
3. Ouvrez le lien affiché (généralement `http://localhost:5173`).

## 2. Déployer sur GitHub Pages

Puisque vous avez l'habitude d'uploader des fichiers HTML/CSS/JS, cette méthode est parfaite pour vous.

1. Générez la version de production :
   ```bash
   npm run build
   ```
2. Un dossier nommé **`dist`** va apparaître dans votre projet.
3. **Ce dossier `dist` contient votre site complet** (index.html, assets, etc.).
4. Pour mettre en ligne :
   - Prenez tout le contenu du dossier `dist`.
   - Uploadez-le sur votre repository GitHub (comme vous le feriez habituellement).
   - Dans les paramètres GitHub > Pages, assurez-vous que la source est bien votre branche.

## 3. Données & Webhook
Actuellement, l'application utilise des **données de démonstration** (basées sur votre excel) car le webhook `https://databuildr.app.n8n.cloud/webhook/rp-data` n'était pas accessible lors de la création.

Pour passer sur les données réelles :
1. Ouvrez le fichier `src/services/api.ts`.
2. Le code est déjà conçu pour tenter de contacter le webhook d'abord.
3. Si le webhook fonctionne et renvoie le JSON au bon format, l'application l'affichera automatiquement.
4. Sinon, elle continuera d'afficher les données de test (Mock Data).
