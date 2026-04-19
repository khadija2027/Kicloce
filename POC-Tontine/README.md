# 🎯 POC Tontine Digitale - CIH Wallet Management Kit

**Proof of Concept** pour la numérisation des tontines marocaines utilisant le **CIH Wallet Management Kit**.

## 📋 Vue d'ensemble

Cette application démontre un système complet de gestion de tontines digitales avec :

✅ **Scoring intelligent** - 5 facteurs basés sur l'historique des transactions  
✅ **Allocation équitable des tours** - Score + fair play round-robin  
✅ **Simulation des transferts CIH** - 3 étapes : simulation → OTP → confirmation  
✅ **REST API complète** - 28+ endpoints pour tous les cas d'usage  
✅ **Données de démo** - Script seed pour test immédiat  

## 🚀 Démarrage rapide

### Prérequis
- Node.js >= 16.0.0
- npm ou yarn

### Installation

```bash
cd POC-Tontine
npm install
```

### Lancer le serveur

```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

### Remplir la base de données

Dans un autre terminal :

```bash
npm run seed
```

Cela crée :
- 5 utilisateurs de démo
- 1 tontine avec tous les participants
- Affiche le ranking par score
- Affiche la queue des tours

### Voir la démo complète

```bash
npm run demo
```

Affiche un walkthrough complet du cycle :
1. Vérification de l'API
2. Listing des utilisateurs
3. Statut de la tontine
4. Queue des tours (ranking par score)
5. Détails du scoring
6. Simulation du cycle complet
7. Exécution du cycle
8. Historique des transactions
9. Balances finales des portefeuilles

## 📐 Architecture

### Structure du projet

```
POC-Tontine/
├── src/
│   ├── app.js                    # Serveur Express + routes
│   ├── services/                 # Logique métier
│   │   ├── scoring.service.js    # Calcul de score (5 facteurs)
│   │   ├── tontine.service.js    # Gestion du cycle
│   │   ├── turn-allocation.service.js  # Allocation des tours
│   │   └── transfer.service.js   # Mock des transferts CIH
│   └── routes/
│       ├── auth.routes.js        # Inscription & OTP
│       ├── tontine.routes.js     # Création & gestion
│       ├── scoring.routes.js     # Calcul des scores
│       └── transaction.routes.js # Transferts & distribution
├── scripts/
│   ├── seed.js                   # Données de démo
│   └── demo.js                   # Walkthrough complet
└── package.json
```

## 🔍 Algorithme de Scoring (5 facteurs)

### Formule

```
Score = (0.40 × Stabilité) + (0.25 × Régularité) + (0.20 × Séniorité)
        + (0.10 × Diversité) + (0.05 × Fiabilité)
```

### Facteurs

| Facteur | Poids | Description |
|---------|-------|------------|
| **Stabilité** | 40% | Ratio solde/montant cible |
| **Régularité** | 25% | Transactions complétées / Attendues |
| **Séniorité** | 20% | Ancienneté du compte (max 24 mois) |
| **Diversité** | 10% | Types de transactions uniques |
| **Fiabilité** | 5% | 1 - (Transactions échouées / Total) |

### Exemple

```json
{
  "userId": "user-123",
  "totalScore": 87.5,
  "scoreDetails": {
    "stability": { "value": 95, "weight": 0.40 },
    "regularity": { "value": 80, "weight": 0.25 },
    "seniority": { "value": 85, "weight": 0.20 },
    "diversity": { "value": 70, "weight": 0.10 },
    "reliability": { "value": 90, "weight": 0.05 }
  }
}
```

## 🔄 Processus de Transfert (3 étapes)

### 1️⃣ Simulation (`POST /api/transactions/simulate`)

Valide les paramètres et génère un token

```bash
curl -X POST http://localhost:5000/api/transactions/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": "user-1",
    "toUserId": "user-2",
    "amount": 500,
    "tontineId": "tontine-1"
  }'
```

**Réponse :**
```json
{
  "id": "trans-12345",
  "status": "pending",
  "token": "TOKEN-XYZ",
  "message": "Transfer simulation successful"
}
```

### 2️⃣ Demande OTP (`POST /api/transactions/request-otp`)

Génère un OTP temporaire

```bash
curl -X POST http://localhost:5000/api/transactions/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "trans-12345",
    "userId": "user-1"
  }'
```

**Réponse :**
```json
{
  "otp": "123456",
  "expiresIn": 300,
  "message": "OTP sent"
}
```

### 3️⃣ Confirmation (`POST /api/transactions/confirm/:id`)

Valide l'OTP et exécute le transfert

```bash
curl -X POST http://localhost:5000/api/transactions/confirm/trans-12345 \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456"
  }'
```

**Réponse :**
```json
{
  "status": "completed",
  "referenceId": "REF-98765",
  "message": "Transfer completed successfully"
}
```

## 📊 Endpoints API

### Authentification

```
POST   /api/auth/register            # Créer utilisateur + portefeuille
POST   /api/auth/verify-otp          # Vérifier OTP
GET    /api/auth/me                  # Profil courant
GET    /api/auth/users               # Tous les utilisateurs
```

### Tontines

```
POST   /api/tontines/create          # Créer tontine
GET    /api/tontines                 # Mes tontines
POST   /api/tontines/:id/join        # Rejoindre tontine
GET    /api/tontines/:id/status      # Statut complet + queue
GET    /api/tontines/:id/participants # Participants (triés par score)
POST   /api/tontines/:id/execute-cycle # Lancer cycle
POST   /api/tontines/:id/advance-turn  # Passer au bénéficiaire suivant
GET    /api/tontines/:id/turn-simulation # Voir tous les tours
```

### Scoring

```
GET    /api/scoring/:userId          # Score détaillé d'un user
GET    /api/scoring                  # Benchmark de tous les scores
POST   /api/scoring/calculate        # Recalculer score (user courant)
POST   /api/scoring/recalculate/:tontineId # Recalculer tous les participants
```

### Transactions

```
POST   /api/transactions/simulate           # Étape 1 : simulation
POST   /api/transactions/request-otp        # Étape 2 : OTP
POST   /api/transactions/confirm/:id        # Étape 3 : confirmation
GET    /api/transactions/history/:tontineId # Historique
POST   /api/transactions/distribute-to-beneficiary # Distribution du cycle
POST   /api/transactions/execute-full-cycle # Cycle complet
```

### Santé

```
GET    /health                 # Vérifier que l'API est up
GET    /api                    # Liste des endpoints
```

## 💡 Cas d'usage exemple

### 1. Créer une tontine

```bash
# 1. Créer tontine
curl -X POST http://localhost:5000/api/tontines/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tontine des amis",
    "contributionAmount": 500,
    "expectedParticipants": 5,
    "frequency": "weekly"
  }'

# 2. Joindre (5 utilisateurs)
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/tontines/TONTINE_ID/join \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user-$i\"}"
done
# => Tontine passe au statut 'active' après 5/5
```

### 2. Voir le ranking & tour queue

```bash
curl http://localhost:5000/api/tontines/TONTINE_ID/status

# Affiche :
# {
#   "name": "Tontine des amis",
#   "status": "active",
#   "totalParticipants": 5,
#   "turnQueue": [
#     { "userId": "user-3", "score": 92.5, "status": "pending" },
#     { "userId": "user-1", "score": 87.3, "status": "pending" },
#     ...
#   ]
# }
```

### 3. Exécuter un cycle complet

```bash
curl -X POST http://localhost:5000/api/transactions/execute-full-cycle \
  -H "Content-Type: application/json" \
  -d '{"tontineId": "TONTINE_ID"}'

# => Collecte les contributions, distribue au bénéficiaire (score le plus élevé)
```

## 🔐 Sécurité (Mock)

Cette POC simule la sécurité CIH. En production :

- ✅ **OTP réel** : SMS via service tiers
- ✅ **JWT Tokens** : Au lieu de user IDs en clair
- ✅ **HTTPS** : Toutes les communications
- ✅ **Rate limiting** : Prévenir brute force
- ✅ **Audit logging** : Tous les transferts loggés
- ✅ **Database encryption** : Balances + données sensibles

## 📈 Roadmap Production

### Phase 1 : Core (Fait ✅)
- [x] Services scoring + tontine
- [x] Mock API REST
- [x] Seed data + demo

### Phase 2 : Data
- [ ] Remplacer `global.database` par MongoDB
- [ ] Ajouter validation + constraints
- [ ] Transaction logging persistent

### Phase 3 : Integration
- [ ] API réelle CIH Wallet Kit
- [ ] Service SMS pour OTP
- [ ] OAuth/JWT authentification

### Phase 4 : Frontend
- [ ] Dashboard utilisateur (React)
- [ ] Visualisation des tontines
- [ ] Historique des transactions
- [ ] Notifications

### Phase 5 : Scaling
- [ ] Load balancing
- [ ] Rate limiting intelligent
- [ ] Analytics + reporting
- [ ] Support multi-devise

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Mode watch
npm run test:watch
```

## 📚 Documentation supplémentaire

- [ARCHITECTURE.md](../ARCHITECTURE_TONTINE_DIGITALE.md) - Deep dive technique
- [IMPLEMENTATION.md](../GUIDE_IMPLEMENTATION_TONTINE.md) - Détails du code
- [EXECUTIVE_SUMMARY.md](../EXECUTIVE_SUMMARY_TONTINE.md) - Vue d'ensemble business

## 🤝 Support

Pour des questions sur :
- **Architecture** → Voir ARCHITECTURE.md
- **API** → Voir endpoints ci-dessus
- **Scoring** → Voir formule 5 facteurs
- **Déploiement** → Voir Phase production (Roadmap)

## 📜 License

MIT

---

**Développé pour le CIH Hackathon** 🚀
