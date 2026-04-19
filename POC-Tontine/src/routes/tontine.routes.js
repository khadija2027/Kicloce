/**
 * ROUTES: Tontines
 * =================
 */

const express = require('express');
const TontineService = require('../services/tontine.service');
const ScoringService = require('../services/scoring.service');
const TurnAllocationService = require('../services/turn-allocation.service');

const router = express.Router();

/**
 * POST /api/tontines/create
 * Crée une nouvelle tontine
 */
router.post('/create', (req, res) => {
  try {
    const {
      name,
      description,
      contributionAmount,
      frequency,
      expectedParticipants,
      duration
    } = req.body;

    // Valider inputs
    if (!name || !contributionAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Mock: utiliser le premier utilisateur comme initiateur
    const initiator = global.database.users.find(u => u.status === 'ACTIVE');
    if (!initiator) {
      return res.status(400).json({ error: 'No active user found' });
    }

    const tontine = TontineService.createTontine(initiator.id, {
      name,
      description,
      contributionAmount,
      frequency,
      expectedParticipants,
      duration
    });

    return res.status(201).json({
      tontineId: tontine.id,
      name: tontine.name,
      initiatorId: tontine.initiatorId,
      contributionAmount: tontine.contributionAmount,
      expectedParticipants: tontine.expectedParticipants,
      status: tontine.status,
      createdAt: tontine.createdAt,
      message: 'Tontine created successfully'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tontines
 * Liste les tontines de l'utilisateur actuel
 */
router.get('/', (req, res) => {
  try {
    // Décoder le token pour obtenir l'ID utilisateur
    const authHeader = req.headers.authorization;
    let user = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = JSON.parse(Buffer.from(token.replace('JWT_MOCK_', ''), 'base64').toString());
        user = global.database.users.find(u => u.id === decoded.id);
      } catch (e) {
        // Si le token est invalid, utiliser le premier utilisateur ACTIVE (fallback)
        user = global.database.users.find(u => u.status === 'ACTIVE');
      }
    } else {
      // Fallback: premier utilisateur ACTIVE
      user = global.database.users.find(u => u.status === 'ACTIVE');
    }

    if (!user) {
      return res.status(400).json({ error: 'No active user found' });
    }

    const tontines = TontineService.getUserTontines(user.id);

    return res.status(200).json({
      count: tontines.length,
      tontines: tontines.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        amount: t.amount,
        frequency: t.frequency,
        participants: t.participants,
        expectedParticipants: t.expectedParticipants,
        currentCycle: t.currentCycle,
        cycles: t.cycles,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tontines/:id/join
 * Participant rejoint une tontine
 */
router.post('/:id/join', (req, res) => {
  try {
    const tontineId = req.params.id;
    const { userId } = req.body;

    const users = global.database.users.filter(u => u.status === 'ACTIVE');
    if (users.length < 1) {
      return res.status(400).json({ error: 'No active users found' });
    }

    // Utiliser userId fourni, ou un utilisateur qui n'a pas encore rejoint
    let participant;
    if (userId) {
      participant = global.database.users.find(u => u.id === userId && u.status === 'ACTIVE');
      if (!participant) {
        return res.status(404).json({ error: 'User not found or not active' });
      }
    } else {
      // Trouver un utilisateur qui n'a pas encore rejoint cette tontine
      const tontine = global.database.tontines.find(t => t.id === tontineId);
      const joinedUserIds = tontine ? tontine.participants.map(p => p.userId) : [];
      participant = users.find(u => !joinedUserIds.includes(u.id));
      
      if (!participant) {
        return res.status(400).json({ error: 'All active users have already joined this tontine' });
      }
    }

    // Calculer score du participant
    const userScore = ScoringService.calculateScore(participant, participant.walletData);
    global.database.scores[`${tontineId}_${participant.id}`] = userScore.totalScore;

    const tontine = TontineService.joinTontine(tontineId, participant.id, userScore.totalScore);

    return res.status(200).json({
      tontineId: tontine.id,
      userId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName}`,
      score: userScore.totalScore,
      totalParticipants: tontine.participants.length,
      expectedParticipants: tontine.expectedParticipants,
      status: tontine.status,
      message: tontine.status === 'ACTIVE' ? 'Tontine is full! Starting allocation...' : 'Join successful'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tontines/:id/status
 * Récupère le statut détaillé d'une tontine
 */
router.get('/:id/status', (req, res) => {
  try {
    const tontineId = req.params.id;
    const status = TontineService.getTontineStatus(tontineId);

    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tontines/:id/participants
 * Liste les participants avec leurs scores
 */
router.get('/:id/participants', (req, res) => {
  try {
    const tontineId = req.params.id;
    const tontine = TontineService.getTontine(tontineId);

    if (!tontine) {
      return res.status(404).json({ error: 'Tontine not found' });
    }

    const participants = tontine.participants.map(p => {
      const user = global.database.users.find(u => u.id === p.userId);
      const scoreKey = `${tontineId}_${p.userId}`;
      const score = global.database.scores?.[scoreKey] || p.score || 0;

      return {
        userId: p.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        phoneNumber: user?.phoneNumber,
        score: score,
        status: p.status,
        numberOfTurnsCompleted: p.numberOfTurnsCompleted,
        joinedAt: p.joinedAt
      };
    });

    return res.status(200).json({
      tontineId,
      totalParticipants: participants.length,
      participants: participants.sort((a, b) => b.score - a.score)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tontines/:id/execute-cycle
 * Lance un cycle (tous les prélèvements)
 */
router.post('/:id/execute-cycle', (req, res) => {
  try {
    const tontineId = req.params.id;
    const cycle = TontineService.executeCycle(tontineId);

    return res.status(202).json({
      ...cycle,
      message: 'Cycle started. SMS alerts sent to participants'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tontines/:id/advance-turn
 * Passe au tour suivant
 */
router.post('/:id/advance-turn', (req, res) => {
  try {
    const tontineId = req.params.id;
    const result = TontineService.advanceTurn(tontineId);

    return res.status(200).json({
      ...result,
      message: result.nextBeneficiary ? 'Turn advanced' : 'All cycles completed!'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tontines/:id/turn-simulation
 * Simule la distribution complète (tous les tours)
 */
router.get('/:id/turn-simulation', (req, res) => {
  try {
    const tontineId = req.params.id;
    const simulation = TurnAllocationService.simulateDistribution(tontineId);

    return res.status(200).json(simulation);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
