/**
 * ROUTES: Goals & Financial Objectives
 * ======================================
 */

const express = require('express');

const router = express.Router();

/**
 * GET /api/goals
 * Liste les objectifs de l'utilisateur actuel
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

    const goals = global.database.goals.filter(g => g.userId === user.id);

    return res.status(200).json({
      count: goals.length,
      goals: goals.map(g => ({
        id: g.id,
        name: g.name,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        deadline: g.deadline,
        category: g.category,
        percentage: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/goals
 * Crée un nouvel objectif
 */
router.post('/', (req, res) => {
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

    const { name, targetAmount, deadline, category } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const goal = {
      id: `GOAL_${Date.now()}`,
      userId: user.id,
      name,
      currentAmount: 0,
      targetAmount,
      deadline,
      category: category || 'Général'
    };

    global.database.goals.push(goal);

    return res.status(201).json({
      id: goal.id,
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
