/**
 * TURN ALLOCATION SERVICE
 * =======================
 * Algorithme de rotation basé sur le scoring
 * Plus haut score = Tour 1 (reçoit en premier)
 */

class TurnAllocationService {
  /**
   * Recalcule l'ordre des tours pour une tontine
   */
  static recalculateTurns(tontineId) {
    const global_db = global.database;
    const tontine = global_db.tontines.find(t => t.id === tontineId);
    
    if (!tontine) {
      throw new Error('Tontine not found');
    }

    // 1. Récupérer tous les participants avec leurs scores
    const participantsWithScores = tontine.participants.map(participant => {
      // Chercher le score stocké
      const scoreKey = `${tontineId}_${participant.userId}`;
      const score = global_db.scores?.[scoreKey] || participant.score || 50;

      return {
        participantId: participant.userId,
        userId: participant.userId,
        score,
        alreadyBeneficiary: participant.numberOfTurnsCompleted > 0,
        status: participant.status
      };
    });

    // 2. Trier par score DESC, puis non-bénéficiaires en avant
    const sortedParticipants = participantsWithScores.sort((a, b) => {
      // Priorité 1: Non bénéficiaires avant bénéficiaires (round-robin)
      if (a.alreadyBeneficiary && !b.alreadyBeneficiary) return 1;
      if (!a.alreadyBeneficiary && b.alreadyBeneficiary) return -1;
      
      // Priorité 2: Score plus haut en premier
      return b.score - a.score;
    });

    // 3. Créer la queue de rotation
    const turnQueue = sortedParticipants.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      score: p.score,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }));

    // 4. Mettre à jour la tontine
    tontine.turnQueue = turnQueue;
    if (turnQueue.length > 0) {
      tontine.currentBeneficiary = turnQueue[0].userId;
    }

    return {
      tontineId,
      totalParticipants: turnQueue.length,
      turnQueue,
      currentBeneficiary: turnQueue[0] || null
    };
  }

  /**
   * Récupère le rank (position) d'un participant dans la queue
   */
  static getParticipantRank(tontineId, userId) {
    const tontine = global.database.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine not found');

    const rank = tontine.turnQueue.findIndex(t => t.userId === userId);
    if (rank === -1) return null;

    return {
      userId,
      rank: rank + 1,
      totalParticipants: tontine.turnQueue.length,
      estimatedDate: this.calculateEstimatedDate(tontine, rank),
      status: tontine.turnQueue[rank].status
    };
  }

  /**
   * Calcule la date estimée du tour
   */
  static calculateEstimatedDate(tontine, rankIndex) {
    // Nombre de jours entre chaque tour (basé sur frequency)
    let daysBetweenTurns = 30; // Défaut: mensuel

    if (tontine.frequency === 'WEEKLY') {
      daysBetweenTurns = 7;
    } else if (tontine.frequency === 'QUARTERLY') {
      daysBetweenTurns = 90;
    }

    const date = new Date();
    date.setDate(date.getDate() + (rankIndex * daysBetweenTurns));
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Simule la distribution avec la queue actuelle
   */
  static simulateDistribution(tontineId) {
    const tontine = global.database.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine not found');

    return {
      tontineId,
      totalParticipants: tontine.participants.length,
      contributionPerPerson: tontine.contributionAmount,
      expectedTotalPerBeneficiary: tontine.contributionAmount * (tontine.participants.length - 1),
      distribution: tontine.turnQueue.map((turn, idx) => ({
        rank: idx + 1,
        userId: turn.userId,
        score: turn.score,
        expectedReceive: tontine.contributionAmount * (tontine.participants.length - 1),
        estimatedDate: this.calculateEstimatedDate(tontine, idx),
        status: turn.status
      }))
    };
  }
}

module.exports = TurnAllocationService;
