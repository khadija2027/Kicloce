# 🚀 Déploiement Tontine Digitale sur Hugging Face Spaces

Ce guide vous explique comment déployer l'application Tontine Digitale avec Docker sur Hugging Face Spaces.

## 📋 Prérequis

- Compte [Hugging Face](https://huggingface.co)
- Docker installé localement (pour tester)
- Git

## 🐳 Structure Docker

L'application utilise un **Dockerfile multi-stage** pour:
1. **Builder le frontend React** - Vite compile l'application React
2. **Servir avec le backend Node.js** - Express sert les fichiers statiques + API

## 📝 Instructions de Déploiement

### Étape 1: Créer un Espace Hugging Face

1. Allez sur https://huggingface.co/spaces
2. Cliquez sur **"Create new Space"**
3. Remplissez les champs:
   - **Space name**: `tontine-digitale`
   - **License**: Choisissez une licence
   - **Space SDK**: Sélectionnez **"Docker"**
   - **Visibility**: Peut être public ou private
4. Cliquez **"Create Space"**

### Étape 2: Configurer via Git (Méthode Recommandée)

```bash
# Clonez votre espace Hugging Face
git clone https://huggingface.co/spaces/YOUR_USERNAME/tontine-digitale
cd tontine-digitale

# Copier les fichiers du projet
cp -r ../{frontend,POC-Tontine} .
cp ../Dockerfile .
cp ../.dockerignore .

# Git add, commit et push
git add .
git commit -m "Initial commit: Tontine Digitale"
git push
```

### Étape 3: Alternative - User Interface

1. Dans les **Files** de votre Space, créez les fichiers:
   - Uploadez le `Dockerfile`
   - Uploadez l'ensemble du dossier `frontend/`
   - Uploadez l'ensemble du dossier `POC-Tontine/`
   - Uploadez le `.dockerignore`

2. Hugging Face détectera automatiquement le Dockerfile et commencera à builder

## 🧪 Test Local

Pour tester le Dockerfile localement:

```bash
# Builder l'image
docker build -t tontine-digitale .

# Lancer le conteneur
docker run -p 7860:7860 tontine-digitale

# Accédez à http://localhost:7860
```

## 📊 Ports et Configuration

- **Port**: 7860 (standard HF Spaces)
- **Backend API**: `http://localhost:7860/api`
- **Frontend**: Servi sur `http://localhost:7860`
- **Health Check**: `http://localhost:7860/health`

## 🔧 Variables d'Environnement

Vous pouvez ajouter des variables d'environnement dans HF Spaces via:
1. Space Settings → Secrets
2. Ajouter des variables comme `NODE_ENV`, `API_BASE_URL`, etc.

## 📦 Points d'Entrée Importants

- **Backend démarage**: `node src/app.js` (port 7860)
- **Frontend statique**: Servi depuis `/public`
- **Routes API**: `/api/*`

## 🌐 Accès à l'Application

Une fois déployée sur HF Spaces:
- Utilisez l'URL fournie par Hugging Face: `https://huggingface.co/spaces/YOUR_USERNAME/tontine-digitale`
- L'interface web sera accessible directement

## 🆘 Dépannage

### Erreur: "build failed"
- Vérifiez que le `Dockerfile` est à la racine
- Vérifiez les chemins des fichiers (doivent être relatifs à la racine)

### Application ne s'affiche pas
- Vérifiez les logs dans HF Spaces
- Assurez-vous que le backend écoute sur le port 7860

### API n'est pas accessible
- Vérifiez que CORS est activé (déjà configuré dans app.js)
- Vérifiez les logs du serveur

## 📖 Endpoints API Disponibles

```
POST   /api/auth/register            - Créer un compte
POST   /api/auth/login               - Connexion
GET    /api/auth/users               - Liste des utilisateurs
POST   /api/tontines/create          - Créer une tontine
GET    /api/tontines                 - Lister les tontines
POST   /api/tontines/join            - Rejoindre une tontine
GET    /api/scoring                  - Calcul des scores
POST   /api/transactions             - Simuler transferts
GET    /api/goals                    - Lister les objectifs
POST   /api/messages                 - Envoyer messages
GET    /health                       - Vérification santé
```

## 🚀 Optimisations

Le Dockerfile utilise:
- **Alpine Linux** - Image légère
- **Multi-stage build** - Réduit la taille finale
- **Production mode** - NODE_ENV=production
- **Health check** - Vérifie la réponse du serveur

## 📝 Notes

- La base de données est **en mémoire** pour le POC (données perdues au redémarrage)
- Pour une production, connectez à une vraie base de données
- Les fichiers du frontend sont servis en tant que fichiers statiques
- L'API REST fonctionne sur le même serveur que le frontend

## 💡 Prochaines Étapes

1. Connecter une base de données (MongoDB, PostgreSQL, etc.)
2. Ajouter l'authentification JWT
3. Configurer SSL/HTTPS
4. Ajouter des logs persistants
5. Mettre en place la monitoring

---

Pour plus d'aide: https://huggingface.co/docs/hub/spaces
