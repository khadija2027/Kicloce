# 🔄 Workflow Complet - POC Tontine Digitale

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (PORT 5000)               │
│  Routes → Services → Global Database                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────────────────────┐
              │   GLOBAL.DATABASE (In-Memory) │
              │  • users[]                    │
              │  • tontines[]                 │
              │  • transactions[]             │
              │  • scores{}                   │
              └───────────────────────────────┘
```

---

## 1️⃣ Étape 1 : Démarrage du Serveur

### Commande
```bash
npm start
```

### Ce qui se passe dans `src/app.js`

1. **Initialisation Express**
   ```javascript
   const app = express();
   app.use(cors(), bodyParser.json());
   ```

2. **Création de la DB globale**
   ```javascript
   global.database = {
     users: [],
     tontines: [],
     transactions: [],
     scores: {}
   };
   ```

3. **Montage des routes**
   ```javascript
   app.use('/api/auth', authRoutes);       // Authentification
   app.use('/api/tontines', tontineRoutes); // Gestion tontines
   app.use('/api/scoring', scoringRoutes);  // Calcul scores
   app.use('/api/transactions', transactionRoutes); // Transferts
   ```

4. **Start du serveur**
   ```javascript
   app.listen(PORT, () => console.log(`Running on port ${PORT}`));
   ```

### Résultat
✅ Serveur écoute sur `http://localhost:5000`

---

## 2️⃣ Étape 2 : Remplir la Base de Données

### Commande
```bash
npm run seed
```

### Ce qui se passe dans `scripts/seed.js`

#### Phase 1: Créer les utilisateurs

```
FOR i = 1 TO 5:
  1. POST /api/auth/register
     - Crée utilisateur avec téléphone, nom, portefeuille
     - Génère UUID unique
     - Ajoute à global.database.users[]
     - Retourne { userId, status: "pending", walletBalance: X }
```

**Exemple d'utilisateur créé :**
```json
{
  "id": "user-a1b2c3d4",
  "firstName": "Ahmed",
  "lastName": "Bennani",
  "phoneNumber": "+212601234567",
  "walletBalance": 3500,
  "status": "pending",
  "otpCode": null,
  "createdAt": "2026-04-18T..."
}
```

#### Phase 2: Vérifier les utilisateurs (OTP)

```
FOR each user:
  1. POST /api/auth/verify-otp
     - Code OTP: "123456" (mock)
     - Passe status: pending → active
```

#### Phase 3: Créer une tontine

```
POST /api/tontines/create
{
  "name": "Tontine CIH Hackathon",
  "contributionAmount": 500,
  "expectedParticipants": 5,
  "frequency": "weekly"
}
```

**Tontine créée :**
```json
{
  "id": "TONT_ABC123DEF456",
  "name": "Tontine CIH Hackathon",
  "status": "CREATED",
  "participants": 1, // Initiateur seulement
  "expectedParticipants": 5,
  "currentCycle": 1,
  "turnQueue": [],
  "walletCollective": {
    "balance": 0,
    "phoneNumber": "212700000000"
  }
}
```

#### Phase 4: Ajouter les participants

```
FOR each of 4 remaining users:
  1. POST /api/tontines/{id}/join
     - Ajoute utilisateur à participants[]
     - Appelle TurnAllocationService.recalculateTurns()
     
  WHEN participants.count === 5:
    → Status: CREATED → ACTIVE
    → Scores calculés (5 facteurs)
    → Turn queue triée (score DESC)
```

#### Phase 5: Afficher le ranking

```
GET /api/scoring/
→ Affiche tous les utilisateurs triés par score

Expected output:
1. Ahmed (Score: 92.5) - Stability: 95, Regularity: 80, Seniority: 85...
2. Fatima (Score: 88.3) - Stability: 90, Regularity: 75, Seniority: 80...
...
```

**Résultat :** 5 utilisateurs + 1 tontine active en DB ✅

---

## 3️⃣ Étape 3 : Comprendre le Score (5 Facteurs)

### Formule de Scoring

```
TOTAL_SCORE = (0.40 × Stabilité) + (0.25 × Régularité) 
            + (0.20 × Séniorité) + (0.10 × Diversité) 
            + (0.05 × Fiabilité)

Max: 100 points
```

### Calcul de chaque facteur

#### 1. **Stabilité (40%)**
```javascript
// Ratio : Solde courant / Solde cible (5000 MAD)
stability = (userBalance / 5000) * 100
Min: 0, Max: 100+

Exemple: Balance = 3500 → Score = 70%
```

#### 2. **Régularité (25%)**
```javascript
// Ratio : Transactions complétées / Attendues
regularity = (completedTransactions / expectedTransactions) * 100
Min: 0, Max: 100

Exemple: 8 complétées / 10 attendues → Score = 80%
```

#### 3. **Séniorité (20%)**
```javascript
// Ratio : Ancienneté compte / 24 mois
seniority = (accountAgeMonths / 24) * 100
Min: 0, Max: 100

Exemple: Compte ouvert il y a 18 mois → Score = 75%
```

#### 4. **Diversité (10%)**
```javascript
// Nombre de types de transaction / 5 max
diversity = (transactionTypes / 5) * 100
Min: 0, Max: 100

Exemple: 4 types (virement, retrait, dépôt, paiement) → Score = 80%
```

#### 5. **Fiabilité (5%)**
```javascript
// 1 - (Transactions échouées / Total)
reliability = (1 - failedCount / totalCount) * 100
Min: 0, Max: 100

Exemple: 1 échouée / 10 total → Score = 90%
```

### Exemple Concret

**Données utilisateur :**
- Balance: 3500 MAD
- Transactions: 8/10 complétées
- Ancienneté: 18 mois
- Types: 4
- Échouées: 1/10

**Calculs :**
```
Stabilité     = (3500/5000) × 100 = 70        → 0.40 × 70 = 28
Régularité    = (8/10) × 100 = 80             → 0.25 × 80 = 20
Séniorité     = (18/24) × 100 = 75            → 0.20 × 75 = 15
Diversité     = (4/5) × 100 = 80              → 0.10 × 80 = 8
Fiabilité     = (1-1/10) × 100 = 90           → 0.05 × 90 = 4.5

TOTAL = 28 + 20 + 15 + 8 + 4.5 = 75.5/100 ✅
```

### Allocation des tours

```
Avant:  [User1(70), User2(85), User3(92), User4(78), User5(88)]
        
Après tri (DESC):
        [User3(92), User5(88), User2(85), User4(78), User1(70)]
        
Tour queue:
  1️⃣ User3 → Recevra les fonds (score le plus élevé)
  2️⃣ User5 → Recevra après User3
  3️⃣ User2 → Recevra après User5
  ...
```

---

## 4️⃣ Étape 4 : Exécuter un Cycle Complet

### Commande
```bash
npm run demo
```

### Flux d'exécution

```
┌─────────────────────────────────────────────────────────────┐
│              ÉTAPE 1: PRÉPARATION DU CYCLE                  │
└─────────────────────────────────────────────────────────────┘

GET /api/tontines/{id}/status
→ Retourne:
  - currentBeneficiary: User3 (score le plus élevé)
  - turnQueue: [User3, User5, User2, User4, User1]
  - collectiveBalance: 0 (avant contributions)
  - currentCycle: 1


┌─────────────────────────────────────────────────────────────┐
│         ÉTAPE 2: SIMULATION DES TRANSFERTS (3 étapes)       │
└─────────────────────────────────────────────────────────────┘

FOR each participant EXCEPT beneficiary:
  
  ┌─ Étape A: SIMULATION ─────────────────────────────┐
  │ POST /api/transactions/simulate                    │
  │ {                                                  │
  │   "fromUserId": "User1",                           │
  │   "toUserId": "User3" (beneficiary),               │
  │   "amount": 500,                                   │
  │   "tontineId": "TONT_ABC123"                       │
  │ }                                                  │
  │ → Valide les paramètres                            │
  │ → Génère transaction ID + token                    │
  │ → Retourne: {id, status: "pending", token}        │
  └────────────────────────────────────────────────────┘
  
  ┌─ Étape B: DEMANDE OTP ────────────────────────────┐
  │ POST /api/transactions/request-otp                 │
  │ {                                                  │
  │   "transactionId": "trans-12345",                  │
  │   "userId": "User1"                                │
  │ }                                                  │
  │ → Génère OTP temporaire: "123456"                  │
  │ → Cache en mémoire (300s expiration)               │
  │ → Retourne: {otp: "123456", expiresIn: 300}       │
  └────────────────────────────────────────────────────┘
  
  ┌─ Étape C: CONFIRMATION ───────────────────────────┐
  │ POST /api/transactions/confirm/trans-12345        │
  │ {                                                  │
  │   "otp": "123456"                                  │
  │ }                                                  │
  │ → Valide OTP                                       │
  │ → DÉBITE User1: 500 MAD                            │
  │ → CRÉDITE User3: + 500 MAD                         │
  │ → Status: pending → completed                      │
  │ → Ajoute à global.database.transactions[]          │
  │ → Retourne: {status: "completed", reference}      │
  └────────────────────────────────────────────────────┘
```

**Résultat après 4 transfers (4 utilisateurs × 500 MAD) :**
```
global.database.transactions = [
  {
    id: "trans-001",
    type: "CONTRIBUTION",
    fromUser: "User1",
    toUser: "User3",
    amount: 500,
    status: "completed",
    tontineId: "TONT_ABC123",
    createdAt: "2026-04-18T10:00:00Z"
  },
  {
    id: "trans-002",
    type: "CONTRIBUTION",
    fromUser: "User2",
    toUser: "User3",
    amount: 500,
    status: "completed",
    ...
  },
  ...
]
```

```
┌─────────────────────────────────────────────────────────────┐
│       ÉTAPE 3: DISTRIBUTION AU BÉNÉFICIAIRE                 │
└─────────────────────────────────────────────────────────────┘

POST /api/transactions/execute-full-cycle
{
  "tontineId": "TONT_ABC123"
}

Actions:
  1. Collecte les contributions: 500 × 4 = 2000 MAD
  2. Identifie bénéficiaire: User3 (score: 92)
  3. Distribue: User3.balance += 2000
  4. Crée transaction: {type: "DISTRIBUTION", amount: 2000, status: "completed"}


┌─────────────────────────────────────────────────────────────┐
│              ÉTAPE 4: AVANCER AU TOUR SUIVANT               │
└─────────────────────────────────────────────────────────────┘

POST /api/tontines/{id}/advance-turn

Actions:
  1. Move User3 to end of queue (beneficiary → back of line)
  2. New queue: [User5, User2, User4, User1, User3]
  3. currentCycle: 1 → 2
  4. currentBeneficiary: User5

```

### État final après cycle

```
Balances mises à jour:
  User1: 3500 - 500 = 3000 MAD
  User2: 4200 - 500 = 3700 MAD
  User3: 2100 + 2000 = 4100 MAD (bénéficiaire reçoit!)
  User4: 3800 - 500 = 3300 MAD
  User5: 5000 - 500 = 4500 MAD

Transaction history: 5 transactions (4 contributions + 1 distribution)

Tontine state:
  currentCycle: 2
  currentBeneficiary: "User5"
  turnQueue: [User5, User2, User4, User1, User3]
  totalDistributed: 2000 MAD
```

---

## 5️⃣ Vue d'ensemble : Flux Completo

```
START
  ↓
[1] npm start
    └─→ Express server on :5000
        └─→ Global database initialized
            └─→ Routes ready
  
  ↓
[2] npm run seed
    ├─→ Register 5 users
    │   └─→ Each user gets wallet (3000-5000 MAD)
    │
    ├─→ Verify OTP for each
    │   └─→ Users: pending → active
    │
    ├─→ Create tontine (5 participants)
    │   └─→ Status: CREATED
    │
    ├─→ Add users to tontine
    │   ├─→ After 3rd user: still CREATED
    │   ├─→ After 4th user: still CREATED
    │   └─→ After 5th user: Status → ACTIVE ✅
    │
    └─→ Calculate scores (5 factors)
        └─→ Sort participants (DESC): [User3(92), User5(88), User2(85), User4(78), User1(70)]
  
  ↓
[3] npm run demo
    ├─→ CYCLE LOOP (for each turn):
    │   │
    │   ├─ Identify beneficiary (highest score)
    │   │
    │   ├─ FOR each non-beneficiary:
    │   │   ├─ Simulate transfer (validate)
    │   │   ├─ Request OTP (generate token)
    │   │   └─ Confirm transfer (debit/credit)
    │   │
    │   ├─ Distribute collected funds to beneficiary
    │   │
    │   ├─ Advance turn:
    │   │   └─ Move beneficiary to end of queue
    │   │   └─ Next person in queue becomes new beneficiary
    │   │
    │   └─ Update cycle counter
    │
    └─→ Until all participants have received turn

END
    ↓
  All users received: ✅
  Each got: N × 500 MAD (where N = number of other participants)
```

---

## 🔑 Clé : Services vs Routes

### Services (Logique Métier)

```
ScoringService
  ├─ calculateScore(user, walletData)
  ├─ calculateStability(balance, target)
  ├─ calculateRegularity(operations, accountAge)
  ├─ calculateSeniority(createdAt)
  ├─ calculateDiversity(operations)
  └─ calculateReliability(operations)

TontineService
  ├─ createTontine(initiatorId, data)
  ├─ joinTontine(tontineId, userId)
  ├─ getTontineStatus(tontineId)
  ├─ executeCycle(tontineId)
  └─ advanceTurn(tontineId)

TurnAllocationService
  ├─ recalculateTurns(tontineId)
  ├─ getParticipantRank(userId, tontineId)
  └─ calculateEstimatedDate(rank, frequency)

TransferService
  ├─ simulateTransfer(data)
  ├─ requestOTP(transactionId, userId)
  ├─ confirmTransfer(transactionId, otp)
  ├─ getTransactionHistory(tontineId)
  └─ distributeToBeneficiary(tontineId, beneficiaryId, amount)
```

### Routes (Endpoints HTTP)

```
Auth Routes (/api/auth)
  ├─ POST /register → AuthService → ScoringService
  ├─ POST /verify-otp → TontineService
  ├─ GET /me
  └─ GET /users

Tontine Routes (/api/tontines)
  ├─ POST /create → TontineService
  ├─ GET / → Return user's tontines
  ├─ POST /:id/join → TontineService → TurnAllocationService
  ├─ GET /:id/status → TontineService
  ├─ POST /:id/execute-cycle → TransferService
  └─ POST /:id/advance-turn → TontineService

Scoring Routes (/api/scoring)
  ├─ GET /:userId → ScoringService
  ├─ GET / → Return all scores (sorted DESC)
  └─ POST /calculate → ScoringService

Transaction Routes (/api/transactions)
  ├─ POST /simulate → TransferService (step 1)
  ├─ POST /request-otp → TransferService (step 2)
  ├─ POST /confirm/:id → TransferService (step 3)
  ├─ GET /history/:tontineId → TransferService
  └─ POST /execute-full-cycle → TransferService (all steps at once)
```

---

## 💾 Global Database Structure

```javascript
global.database = {
  // Array de tous les utilisateurs
  users: [
    {
      id: "user-abc123",
      firstName: "Ahmed",
      lastName: "Bennani",
      phoneNumber: "+212601234567",
      walletBalance: 3500,
      status: "active",
      createdAt: "2026-04-18T..."
    },
    ...
  ],

  // Array de toutes les tontines
  tontines: [
    {
      id: "TONT_ABC123",
      name: "Tontine CIH",
      status: "ACTIVE",
      participants: [
        { userId: "user-abc123", status: "ACTIVE", score: 92.5 },
        ...
      ],
      currentCycle: 1,
      currentBeneficiary: "user-abc123",
      turnQueue: [...],
      walletCollective: { balance: 2000, phoneNumber: "..." },
      ...
    }
  ],

  // Array de toutes les transactions
  transactions: [
    {
      id: "trans-001",
      type: "CONTRIBUTION|DISTRIBUTION",
      fromUser: "user-abc123",
      toUser: "user-def456",
      amount: 500,
      status: "completed|pending",
      tontineId: "TONT_ABC123",
      createdAt: "2026-04-18T..."
    },
    ...
  ],

  // Object pour cache des scores
  scores: {
    "user-abc123": {
      totalScore: 92.5,
      scoreDetails: {...}
    }
  }
}
```

---

## ✅ Résumé du Workflow

| Étape | Commande | Quoi | Où |
|-------|----------|------|-----|
| 1 | `npm start` | Démarrer serveur | Express on :5000 |
| 2 | `npm run seed` | Créer 5 users + tontine | global.database |
| 3 | `npm run demo` | Exécuter cycle complet | POST/GET requests |
| ... | Repeat step 3 | Pour chaque tour | Tant que cycle actif |

Chaque étape appelle les **Services** qui modifient **global.database** et retournent des réponses via les **Routes**.

---

**Le POC simule un cycle complet de tontine digitalisée avec scoring, allocation équitable et transferts sécurisés ! 🎯**
