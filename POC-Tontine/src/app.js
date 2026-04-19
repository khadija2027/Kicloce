/**
 * POC Tontine Digitale - Main Application
 * =========================================
 * 
 * Application Express pour démontrer le concept de tontine digitalisée
 * avec scoring basé sur l'historique, allocation des tours, et transferts wallets
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import des services
const ScoringService = require('./services/scoring.service');
const TontineService = require('./services/tontine.service');
const TransferService = require('./services/transfer.service');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const tontineRoutes = require('./routes/tontine.routes');
const scoringRoutes = require('./routes/scoring.routes');
const transactionRoutes = require('./routes/transaction.routes');
const goalsRoutes = require('./routes/goals.routes');
const messagesRoutes = require('./routes/messages.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// In-memory database (pour POC)
global.database = {
  users: [],
  tontines: [],
  transactions: [],
  scores: {},
  messages: [],
  goals: []
};

// Seed initial data
function initializeDatabase() {
  const { v4: uuidv4 } = require('uuid');
  
  // Create sample users - Only 3 for testing frontend
  const sampleUsers = [
    {
      id: 'USER_001',
      phoneNumber: '212700446631',
      firstName: 'Fatima',
      lastName: 'El Amrani',
      email: 'fatima@example.com',
      dateOfBirth: '1990-05-15',
      address: 'Casablanca',
      identificationNumber: 'ID001',
      contractId: 'LAN_001',
      walletToken: 'TR_001',
      walletBalance: 15750,
      walletData: { balance: 15750, transactions: [] },
      status: 'ACTIVE',
      walletActive: true,
      score: 92,
      createdAt: new Date().toISOString()
    },
    {
      id: 'USER_002',
      phoneNumber: '212612345678',
      firstName: 'Youssef',
      lastName: 'Bennani',
      email: 'youssef@example.com',
      dateOfBirth: '1988-08-20',
      address: 'Marrakech',
      identificationNumber: 'ID002',
      contractId: 'LAN_002',
      walletToken: 'TR_002',
      walletBalance: 8500,
      walletData: { 
        balance: 8500, 
        transactions: [],
        operations: [
          { type: 'TRANSFER', status: 'COMPLETED', amount: 1500, date: '2025-12-15' },
          { type: 'DEPOSIT', status: 'COMPLETED', amount: 2000, date: '2025-11-20' },
          { type: 'WITHDRAWAL', status: 'COMPLETED', amount: 500, date: '2025-10-10' }
        ],
        accountAgeMonths: 18
      },
      status: 'ACTIVE',
      walletActive: true,
      score: 78,
      createdAt: new Date().toISOString()
    },
    {
      id: 'USER_003',
      phoneNumber: '212722334455',
      firstName: 'Nadia',
      lastName: 'Aziz',
      email: 'nadia@example.com',
      dateOfBirth: '1992-12-10',
      address: 'Fes',
      identificationNumber: 'ID003',
      contractId: 'LAN_003',
      walletToken: 'TR_003',
      walletBalance: 12000,
      walletData: { balance: 12000, transactions: [] },
      status: 'ACTIVE',
      walletActive: true,
      score: 85,
      createdAt: new Date().toISOString()
    }
  ];

  // Create sample tontines - Different for each user
  const sampleTontines = [
    // Fatima's tontines (3 total)
    {
      id: 'TON_001',
      name: 'Cercle Familial El Amrani',
      description: 'Tontine familiale pour épargne commune',
      initiatorId: 'USER_001',
      participants: ['USER_001', 'USER_002'].map(userId => ({ 
        userId, 
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 1500,
      frequency: 'Mensuelle',
      expectedParticipants: 8,
      currentCycle: 5,
      cycles: 12,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TON_003',
      name: 'Club Épargne Femmes Actives',
      description: 'Club d\'épargne exclusif pour femmes',
      initiatorId: 'USER_001',
      participants: ['USER_001', 'USER_003'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 2500,
      frequency: 'Mensuelle',
      expectedParticipants: 6,
      currentCycle: 12,
      cycles: 12,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TON_005',
      name: 'Fonds Santé Familial',
      description: 'Épargne pour les urgences santé',
      initiatorId: 'USER_001',
      participants: ['USER_001'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 800,
      frequency: 'Bimensuelle',
      expectedParticipants: 5,
      currentCycle: 8,
      cycles: 24,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    // Youssef's tontines (2 total)
    {
      id: 'TON_002',
      name: 'Asso Jeunes Entrepreneurs',
      description: 'Réseau pour jeunes entrepreneurs',
      initiatorId: 'USER_002',
      participants: ['USER_002', 'USER_003'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 1000,
      frequency: 'Hebdomadaire',
      expectedParticipants: 12,
      currentCycle: 8,
      cycles: 52,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TON_004',
      name: 'Tontine d\'Investissement',
      description: 'Fonds d\'investissement collectif',
      initiatorId: 'USER_002',
      participants: ['USER_002'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 2000,
      frequency: 'Trimestrielle',
      expectedParticipants: 8,
      currentCycle: 3,
      cycles: 12,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    },
    // Nadia's tontimes (4 total)
    {
      id: 'TON_006',
      name: 'Réseau Femmes Professionnelles',
      description: 'Tontine pour femmes en business',
      initiatorId: 'USER_003',
      participants: ['USER_003', 'USER_001'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 1200,
      frequency: 'Mensuelle',
      expectedParticipants: 10,
      currentCycle: 6,
      cycles: 12,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TON_007',
      name: 'Fonds Éducation Enfants',
      description: 'Épargne pour l\'éducation des enfants',
      initiatorId: 'USER_003',
      participants: ['USER_003'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 600,
      frequency: 'Mensuelle',
      expectedParticipants: 7,
      currentCycle: 9,
      cycles: 24,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TON_008',
      name: 'Microfinance Locale',
      description: 'Prêts et crédits solidaires',
      initiatorId: 'USER_003',
      participants: ['USER_003', 'USER_002'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 1800,
      frequency: 'Bimensuelle',
      expectedParticipants: 15,
      currentCycle: 4,
      cycles: 20,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TON_009',
      name: 'Épargne Voyage Groupe',
      description: 'Vacances et voyages collectifs',
      initiatorId: 'USER_003',
      participants: ['USER_003'].map(userId => ({ 
        userId,
        firstName: sampleUsers.find(u => u.id === userId)?.firstName,
        lastName: sampleUsers.find(u => u.id === userId)?.lastName,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString()
      })),
      amount: 750,
      frequency: 'Mensuelle',
      expectedParticipants: 6,
      currentCycle: 2,
      cycles: 12,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }
  ];

  // Create sample messages - GROUP messages by tontine
  const sampleMessages = [
    // Group 1: Cercle Familial El Amrani (TON_001)
    {
      id: 'MSG_001',
      tontineId: 'TON_001',
      senderId: 'USER_001',
      text: 'Bonjour à tous! Bienvenue dans le groupe',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'MSG_002',
      tontineId: 'TON_001',
      senderId: 'USER_002',
      text: 'Salut! Merci pour l\'invitation',
      timestamp: new Date(Date.now() - 6900000).toISOString()
    },
    {
      id: 'MSG_003',
      tontineId: 'TON_001',
      senderId: 'USER_003',
      text: 'Coucou l\'équipe! Heureuse de faire partie du groupe',
      timestamp: new Date(Date.now() - 6600000).toISOString()
    },
    {
      id: 'MSG_004',
      tontineId: 'TON_001',
      senderId: 'USER_001',
      text: 'Super! Le premier versement est prévu pour demain',
      timestamp: new Date(Date.now() - 6300000).toISOString()
    },
    {
      id: 'MSG_005',
      tontineId: 'TON_001',
      senderId: 'USER_002',
      text: 'Parfait ! J\'ai déjà préparé mon transfer 👍',
      timestamp: new Date(Date.now() - 6000000).toISOString()
    },
    // Group 2: Asso Jeunes Entrepreneurs (TON_002)
    {
      id: 'MSG_006',
      tontineId: 'TON_002',
      senderId: 'USER_002',
      text: 'Bienvenue dans notre groupe des entrepreneurs! 🚀',
      timestamp: new Date(Date.now() - 5400000).toISOString()
    },
    {
      id: 'MSG_007',
      tontineId: 'TON_002',
      senderId: 'USER_003',
      text: 'Merci! Je suis excitée de commencer',
      timestamp: new Date(Date.now() - 5100000).toISOString()
    },
    {
      id: 'MSG_008',
      tontineId: 'TON_002',
      senderId: 'USER_001',
      text: 'Salut à vous! Prêt pour la première réunion',
      timestamp: new Date(Date.now() - 4800000).toISOString()
    },
    {
      id: 'MSG_009',
      tontineId: 'TON_002',
      senderId: 'USER_002',
      text: 'Réunion prévue ce vendredi à 18h! Vous pouvez?',
      timestamp: new Date(Date.now() - 4500000).toISOString()
    },
    {
      id: 'MSG_010',
      tontineId: 'TON_002',
      senderId: 'USER_003',
      text: 'Oui! Je serai présent 💪',
      timestamp: new Date(Date.now() - 4200000).toISOString()
    },
    // Group 3: Club Épargne Femmes Actives (TON_003)
    {
      id: 'MSG_011',
      tontineId: 'TON_003',
      senderId: 'USER_001',
      text: 'Bonsoir mesdames! Bienvenue dans notre club exclusif 👩‍💼',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'MSG_012',
      tontineId: 'TON_003',
      senderId: 'USER_003',
      text: 'Wow! Merci pour cette belle initiative!',
      timestamp: new Date(Date.now() - 3300000).toISOString()
    },
    {
      id: 'MSG_013',
      tontineId: 'TON_003',
      senderId: 'USER_001',
      text: 'Nous sommes à mi-parcours! Encore 6 cycles! 🎉',
      timestamp: new Date(Date.now() - 3000000).toISOString()
    },
    {
      id: 'MSG_014',
      tontineId: 'TON_003',
      senderId: 'USER_003',
      text: 'C\'est fantastique! À bientôt notre première distribution! ✨',
      timestamp: new Date(Date.now() - 2700000).toISOString()
    }
  ];

  // Create sample goals - Different for each user
  const sampleGoals = [
    // Fatima's goals
    {
      id: 'GOAL_001',
      userId: 'USER_001',
      name: 'Achat Voiture',
      currentAmount: 52000,
      targetAmount: 80000,
      deadline: '2025-06-30',
      category: 'Transport'
    },
    {
      id: 'GOAL_002',
      userId: 'USER_001',
      name: 'Rénovation Maison',
      currentAmount: 42000,
      targetAmount: 120000,
      deadline: '2027-06-30',
      category: 'Immobilier'
    },
    {
      id: 'GOAL_003',
      userId: 'USER_001',
      name: 'Fonds Retraite',
      currentAmount: 28000,
      targetAmount: 150000,
      deadline: '2035-12-31',
      category: 'Épargne'
    },
    // Youssef's goals
    {
      id: 'GOAL_004',
      userId: 'USER_002',
      name: 'Lancer StartUp Tech',
      currentAmount: 35000,
      targetAmount: 150000,
      deadline: '2026-12-31',
      category: 'Entrepreneuriat'
    },
    {
      id: 'GOAL_005',
      userId: 'USER_002',
      name: 'Formation en Digital Marketing',
      currentAmount: 8900,
      targetAmount: 15000,
      deadline: '2025-05-31',
      category: 'Formation'
    },
    // Nadia's goals
    {
      id: 'GOAL_006',
      userId: 'USER_003',
      name: 'Achat Moto Luxe',
      currentAmount: 35500,
      targetAmount: 60000,
      deadline: '2025-09-30',
      category: 'Transport'
    },
    {
      id: 'GOAL_007',
      userId: 'USER_003',
      name: 'Voyage famille',
      currentAmount: 18500,
      targetAmount: 25000,
      deadline: '2024-08-31',
      category: 'Loisir'
    },
    {
      id: 'GOAL_008',
      userId: 'USER_003',
      name: 'Investissement Immobilier',
      currentAmount: 75000,
      targetAmount: 150000,
      deadline: '2026-12-31',
      category: 'Immobilier'
    },
    {
      id: 'GOAL_009',
      userId: 'USER_003',
      name: 'Fonds d\'urgence',
      currentAmount: 25000,
      targetAmount: 50000,
      deadline: '2025-12-31',
      category: 'Épargne'
    }
  ];

  global.database.users = sampleUsers;
  global.database.tontines = sampleTontines;
  global.database.messages = sampleMessages;
  global.database.goals = sampleGoals;

  console.log('✅ Database initialized with sample data');
  console.log(`   - ${sampleUsers.length} users created`);
  console.log(`   - ${sampleTontines.length} tontines created`);
  console.log(`   - ${sampleMessages.length} messages created`);
  console.log(`   - ${sampleGoals.length} goals created`);
}

// Initialize database with sample data
initializeDatabase();

// API Routes
app.use(express.json());

// Serve frontend static files
app.use(express.static('public'));

// API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/tontines', tontineRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/messages', messagesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'POC Tontine Digitale is running',
    timestamp: new Date().toISOString(),
    database: {
      users: global.database.users.length,
      tontines: global.database.tontines.length,
      transactions: global.database.transactions.length
    }
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Tontine Digitale POC API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        verifyOtp: 'POST /api/auth/verify-otp',
        me: 'GET /api/auth/me'
      },
      tontines: {
        create: 'POST /api/tontines/create',
        list: 'GET /api/tontines',
        join: 'POST /api/tontines/:id/join',
        status: 'GET /api/tontines/:id/status',
        participants: 'GET /api/tontines/:id/participants'
      },
      scoring: {
        calculate: 'POST /api/scoring/calculate',
        get: 'GET /api/scoring/:userId',
        recalculate: 'POST /api/scoring/recalculate/:tontineId'
      },
      transactions: {
        simulate: 'POST /api/transactions/simulate',
        confirm: 'POST /api/transactions/confirm/:id',
        history: 'GET /api/transactions/history/:tontineId'
      }
    }
  });
});

// SPA Fallback - Serve index.html for all non-API routes (React Router)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/../public/index.html', (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         🎯 POC TONTINE DIGITALE CIH - API STARTED             ║
╚════════════════════════════════════════════════════════════════╝

📍 Server running on: http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health
📖 API Docs: http://localhost:${PORT}/api

🔧 Available Endpoints:
├─ Auth: Register & Verify OTP
├─ Tontines: Create & Join
├─ Scoring: Calculate participant scores
└─ Transactions: Simulate & Execute transfers

📝 Test the API:
  curl http://localhost:${PORT}/health

🚀 Ready to demo!
  `);
});

module.exports = app;
