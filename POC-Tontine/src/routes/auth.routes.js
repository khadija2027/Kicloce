/**
 * ROUTES: Authentication
 * =======================
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ScoringService = require('../services/scoring.service');

const router = express.Router();

/**
 * POST /api/auth/register
 * Crée un nouvel utilisateur avec wallet simulé
 */
router.post('/register', (req, res) => {
  try {
    const {
      phoneNumber,
      firstName,
      lastName,
      email,
      dateOfBirth,
      address,
      identificationNumber
    } = req.body;

    // Valider inputs
    if (!phoneNumber || !firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['phoneNumber', 'firstName', 'lastName', 'email']
      });
    }

    // Vérifier si utilisateur existe
    if (global.database.users.some(u => u.phoneNumber === phoneNumber)) {
      return res.status(409).json({
        error: 'User with this phone number already exists'
      });
    }

    // Créer utilisateur
    const user = {
      id: `USER_${uuidv4().substring(0, 12)}`.toUpperCase(),
      phoneNumber,
      firstName,
      lastName,
      email,
      dateOfBirth: dateOfBirth || new Date().toISOString(),
      address: address || '',
      identificationNumber: identificationNumber || '',
      contractId: `LAN_${uuidv4().substring(0, 12)}`.toUpperCase(),
      walletToken: `TR_${uuidv4().substring(0, 16)}`.toUpperCase(),
      walletData: ScoringService.generateMockWalletData({}),
      status: 'PENDING_VERIFICATION',
      otpSent: true,
      otpCode: '123456', // Mock OTP
      createdAt: new Date().toISOString()
    };

    // Sauvegarder
    global.database.users.push(user);

    return res.status(201).json({
      userId: user.id,
      phoneNumber: user.phoneNumber,
      contractId: user.contractId,
      walletToken: user.walletToken,
      message: 'User registered. OTP sent to phone.',
      otp: user.otpCode, // Mock - retourner OTP pour test
      nextStep: 'Verify OTP to activate wallet'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Valide l'OTP et active le wallet
 */
router.post('/verify-otp', (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Missing phoneNumber or otp' });
    }

    // Trouver utilisateur
    const user = global.database.users.find(u => u.phoneNumber === phoneNumber);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Vérifier OTP
    if (user.otpCode !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Activer wallet
    user.status = 'ACTIVE';
    user.walletActive = true;
    user.activatedAt = new Date().toISOString();

    // Calculer score initial
    const initialScore = ScoringService.calculateScore(user, user.walletData);
    global.database.scores[user.id] = initialScore.totalScore;

    return res.status(200).json({
      userId: user.id,
      status: 'ACTIVE',
      walletActive: true,
      message: 'Wallet activated successfully',
      initialScore: initialScore.totalScore,
      activatedAt: user.activatedAt
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Authentifie un utilisateur
 */
router.post('/login', (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Missing phoneNumber or password' });
    }

    // Trouver utilisateur
    const user = global.database.users.find(u => u.phoneNumber === phoneNumber);
    if (!user) {
      return res.status(404).json({ 
        error: `User not found with phone number: ${phoneNumber}. Please check the number or create a new account.`,
        availableUsers: global.database.users.map(u => ({
          name: `${u.firstName} ${u.lastName}`,
          phone: u.phoneNumber
        }))
      });
    }

    // Mock: pas de vérification de mot de passe pour le moment
    // Dans un vrai cas, on comparerait les hashs de mot de passe
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User account is not active. Please verify OTP.' });
    }
    
    const score = ScoringService.calculateScore(user, user.walletData);

    // Simuler un token de session
    const token = `JWT_MOCK_${Buffer.from(JSON.stringify({ id: user.id, ts: Date.now() })).toString('base64')}`;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        walletBalance: user.walletData?.balance || 0,
        score: score.totalScore,
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Récupère le profil de l'utilisateur actuel (décoder le bearer token)
 */
router.get('/me', (req, res) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Décoder le token pour obtenir l'userId
    try {
      const decoded = JSON.parse(Buffer.from(token.replace('JWT_MOCK_', ''), 'base64').toString());
      const userId = decoded.id;

      // Récupérer l'utilisateur avec cet ID
      const user = global.database.users.find(u => u.id === userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const score = ScoringService.calculateScore(user, user.walletData);

      return res.status(200).json({
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contractId: user.contractId,
        walletActive: user.walletActive,
        walletBalance: user.walletData?.balance || 0,
        score: score.totalScore,
        status: user.status,
        createdAt: user.createdAt
      });
    } catch (tokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/users
 * Liste tous les utilisateurs (pour test)
 */
router.get('/users', (req, res) => {
  try {
    const users = global.database.users.map(u => ({
      id: u.id,
      phoneNumber: u.phoneNumber,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      status: u.status,
      walletBalance: u.walletData?.balance || 0,
      createdAt: u.createdAt
    }));

    return res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
