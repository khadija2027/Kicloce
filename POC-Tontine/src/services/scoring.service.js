/**
 * SCORING SERVICE
 * ===============
 * Implémente la formule de scoring à 5 facteurs
 * 
 * Score = (0.40 × Stabilité) + (0.25 × Régularité) + (0.20 × Ancienneté)
 *       + (0.10 × Diversité) + (0.05 × Reliability)
 */

class ScoringService {
  /**
   * Calcule le score total d'un utilisateur
   * @param {Object} user - Utilisateur
   * @param {Object} walletData - Données du wallet (simulated)
   * @returns {Object} Score détaillé
   */
  static calculateScore(user, walletData = {}) {
    // Récupérer ou initialiser les données du wallet
    const balance = walletData.balance || Math.random() * 8000;
    const operations = walletData.operations || [];
    const accountAgeMonths = walletData.accountAgeMonths || Math.floor(Math.random() * 24);

    // Facteur 1: Stabilité Financière (40%)
    const stabilityScore = this.calculateStability(balance, 5000); // Target: 5000 MAD
    
    // Facteur 2: Régularité (25%)
    const regularityScore = this.calculateRegularity(operations, accountAgeMonths);
    
    // Facteur 3: Ancienneté (20%)
    const seniorityScore = this.calculateSeniority(user.createdAt || new Date(Date.now() - accountAgeMonths * 30 * 24 * 60 * 60 * 1000));
    
    // Facteur 4: Diversité (10%)
    const diversityScore = this.calculateDiversity(operations);
    
    // Facteur 5: Fiabilité (5%)
    const reliabilityScore = this.calculateReliability(operations);
    
    // Score Total (poids: 40% + 25% + 20% + 10% + 5% = 100%)
    const totalScore = 
      (0.40 * stabilityScore) +
      (0.25 * regularityScore) +
      (0.20 * seniorityScore) +
      (0.10 * diversityScore) +
      (0.05 * reliabilityScore);

    return {
      userId: user.id,
      totalScore: Math.round(totalScore * 100) / 100,
      scoreDetails: {
        stability: {
          value: Math.round(stabilityScore * 100) / 100,
          maxScore: 100,
          weight: 0.40,
          weightedScore: Math.round((0.40 * stabilityScore) * 100) / 100
        },
        regularity: {
          value: Math.round(regularityScore * 100) / 100,
          maxScore: 100,
          weight: 0.25,
          weightedScore: Math.round((0.25 * regularityScore) * 100) / 100
        },
        seniority: {
          value: Math.round(seniorityScore * 100) / 100,
          maxScore: 100,
          weight: 0.20,
          weightedScore: Math.round((0.20 * seniorityScore) * 100) / 100
        },
        diversity: {
          value: Math.round(diversityScore * 100) / 100,
          maxScore: 100,
          weight: 0.10,
          weightedScore: Math.round((0.10 * diversityScore) * 100) / 100
        },
        reliability: {
          value: Math.round(reliabilityScore * 100) / 100,
          maxScore: 100,
          weight: 0.05,
          weightedScore: Math.round((0.05 * reliabilityScore) * 100) / 100
        }
      },
      factors: {
        balance: Math.round(balance * 100) / 100,
        accountAgeMonths: accountAgeMonths,
        totalTransactions: operations.length,
        successfulTransactions: operations.filter(op => op.status === 'COMPLETED').length,
        transactionTypes: new Set(operations.map(op => op.type)).size
      },
      lastUpdated: new Date().toISOString(),
      rank: null // Sera défini lors de l'allocation des tours
    };
  }

  /**
   * Facteur 1: Stabilité Financière (Balance / Target)
   */
  static calculateStability(balance, targetAmount = 5000) {
    const ratio = (balance / targetAmount) * 100;
    return Math.min(ratio, 100); // Max 100%
  }

  /**
   * Facteur 2: Régularité des contributions
   */
  static calculateRegularity(operations = [], accountAgeMonths = 6) {
    if (operations.length === 0) return 0;
    
    const completedOps = operations.filter(op => op.status === 'COMPLETED').length;
    const expectedContributions = Math.min(accountAgeMonths, 6); // Max 6 mois
    
    const regularity = (completedOps / Math.max(expectedContributions, 1)) * 100;
    return Math.min(regularity, 100);
  }

  /**
   * Facteur 3: Ancienneté du compte
   */
  static calculateSeniority(createdAt) {
    if (!createdAt) return 0;
    
    const ageInMonths = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
    const maxMonths = 24;
    
    const seniority = (ageInMonths / maxMonths) * 100;
    return Math.min(seniority, 100);
  }

  /**
   * Facteur 4: Diversité des types de transactions
   */
  static calculateDiversity(operations = []) {
    const types = new Set(operations.map(op => op.type));
    const maxTypes = 5; // W2W, CASH_IN, CASH_OUT, PAYMENT, VIREMENT
    
    return (types.size / maxTypes) * 100;
  }

  /**
   * Facteur 5: Fiabilité - Pas de défauts
   */
  static calculateReliability(operations = []) {
    if (operations.length === 0) return 50; // Défaut: nouveau compte
    
    const failedOps = operations.filter(op => op.status === 'FAILED').length;
    const reliability = (1 - (failedOps / operations.length)) * 100;
    
    return Math.max(reliability, 0);
  }

  /**
   * Génère des données de wallet simulées pour un utilisateur
   */
  static generateMockWalletData(user) {
    const accountAgeMonths = Math.floor(Math.random() * 18) + 2; // 2-20 mois
    const balance = Math.random() * 8000 + 500; // 500-8500 MAD
    
    // Générer transactions simulées
    const operations = [];
    const transactionTypes = ['W2W', 'CASH_IN', 'CASH_OUT', 'PAYMENT', 'VIREMENT'];
    
    for (let i = 0; i < Math.floor(Math.random() * 15) + 3; i++) {
      operations.push({
        type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
        amount: Math.random() * 1000 + 100,
        status: Math.random() > 0.15 ? 'COMPLETED' : 'FAILED', // 85% success
        date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        referenceId: `REF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });
    }

    return {
      balance,
      operations,
      accountAgeMonths,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = ScoringService;
