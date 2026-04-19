/**
 * ROUTES: Scoring
 * ================
 */

const express = require('express');
const ScoringService = require('../services/scoring.service');
const TurnAllocationService = require('../services/turn-allocation.service');

const router = express.Router();

/**
 * GET /api/scoring/:userId
 * Récupère le score détaillé d'un utilisateur
 */
router.get('/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = global.database.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const score = ScoringService.calculateScore(user, user.walletData);

    return res.status(200).json(score);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scoring/calculate
 * Calcule le score pour l'utilisateur actif
 */
router.post('/calculate', (req, res) => {
  try {
    // Mock: utiliser le premier utilisateur actif
    const user = global.database.users.find(u => u.status === 'ACTIVE');
    if (!user) {
      return res.status(400).json({ error: 'No active user found' });
    }

    const score = ScoringService.calculateScore(user, user.walletData);

    return res.status(200).json({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      ...score
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scoring/recalculate/:tontineId
 * Recalcule les scores pour tous les participants d'une tontine
 */
router.post('/recalculate/:tontineId', (req, res) => {
  try {
    const tontineId = req.params.tontineId;

    // Trouver la tontine
    const tontine = global.database.tontines.find(t => t.id === tontineId);
    if (!tontine) {
      return res.status(404).json({ error: 'Tontine not found' });
    }

    // Recalculer scores pour tous les participants
    const updatedScores = [];
    
    tontine.participants.forEach(participant => {
      const user = global.database.users.find(u => u.id === participant.userId);
      if (user) {
        const newScore = ScoringService.calculateScore(user, user.walletData);
        const scoreKey = `${tontineId}_${participant.userId}`;
        const oldScore = global.database.scores?.[scoreKey] || 0;
        
        global.database.scores[scoreKey] = newScore.totalScore;

        updatedScores.push({
          userId: participant.userId,
          userName: `${user.firstName} ${user.lastName}`,
          oldScore: Math.round(oldScore * 100) / 100,
          newScore: newScore.totalScore,
          change: Math.round((newScore.totalScore - oldScore) * 100) / 100
        });
      }
    });

    // Recalculer les turns avec les nouveaux scores
    const turnResult = TurnAllocationService.recalculateTurns(tontineId);

    return res.status(200).json({
      tontineId,
      updatedScores: updatedScores.sort((a, b) => b.newScore - a.newScore),
      newTurnQueue: turnResult.turnQueue.map((t, idx) => ({
        rank: idx + 1,
        userId: t.userId,
        score: t.score,
        status: t.status
      })),
      message: 'Scores recalculated and turn queue updated'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scoring/benchmark
 * Affiche les scores de tous les utilisateurs (pour test)
 */
router.get('/', (req, res) => {
  try {
    const scores = global.database.users.map(user => {
      const score = ScoringService.calculateScore(user, user.walletData);
      
      return {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber,
        totalScore: score.totalScore,
        scoreDetails: score.scoreDetails,
        walletBalance: user.walletData?.balance || 0,
        createdAt: user.createdAt
      };
    });

    return res.status(200).json({
      count: scores.length,
      scores: scores.sort((a, b) => b.totalScore - a.totalScore),
      benchmark: {
        avgScore: Math.round((scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length) * 100) / 100,
        maxScore: Math.max(...scores.map(s => s.totalScore)),
        minScore: Math.min(...scores.map(s => s.totalScore))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
