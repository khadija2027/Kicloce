---
title: Kicloce - Tontine Digitale
emoji: 💰
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

# 🎯 Tontine Digitale - Kicloce

Plateforme digitale de gestion des **tontines** (Roscas - Rotating Savings and Credit Associations) avec scoring avancé et transferts de fonds.

## 🚀 Fonctionnalités

- 👤 **Authentification** - Inscription et connexion sécurisée
- 💎 **Gestion des Tontines** - Créer et rejoindre des groupes d'épargne
- 📊 **Scoring Intelligent** - Allocation automatique des tours basée sur l'historique
- 💳 **Portefeuille Numérique** - Gestion des fonds et transferts
- 🎯 **Objectifs Financiers** - Suivi des buts d'épargne personnalisés
- 💬 **Messagerie** - Communication entre participants
- 🏆 **Tableau de Bord** - Analyse des performances

## 🛠️ Stack Technologique

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Base de données**: En mémoire (POC) - à connecter à MongoDB/PostgreSQL
- **Déploiement**: Docker sur Hugging Face Spaces

## 📝 API Endpoints

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
POST   /api/goals                    - Créer un objectif
GET    /health                       - Vérification santé
```

## 🚀 Démarrage Local

```bash
# Build et lancement avec Docker
docker-compose up

# L'app sera accessible à http://localhost:7860
```

## 📖 Documentation

- [Guide de déploiement HF Spaces](./HF_SPACES_DEPLOYMENT.md)
- [Variables d'environnement](./.env.example)
- [Architecture du POC](./POC-Tontine/README.md)

## 👥 Utilisateurs de Test

```
Utilisateur 1: Fatima
Utilisateur 2: Youssef  
Utilisateur 3: Nadia
```

Mot de passe: `test123`

## 🔐 Sécurité

- ⚠️ CE PROJET EST UN POC - Ne pas utiliser en production sans renforcer la sécurité
- Les données sont stockées en mémoire (données perdues au redémarrage)
- JWT à implémenter pour l'authentification sécurisée
- Bases de données à connecter

## 📞 Support

Pour plus d'informations ou support, consultez la documentation du projet.
