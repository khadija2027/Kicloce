/**
 * TONTINE SERVICE
 * ===============
 * Gère la création et gestion des tontines
 */

const { v4: uuidv4 } = require('uuid');
const TurnAllocationService = require('./turn-allocation.service');

class TontineService {
  /**
   * Crée une nouvelle tontine
   */
  static createTontine(initiatorId, data) {
    const tontine = {
      id: `TONT_${uuidv4().substring(0, 12)}`.toUpperCase(),
      initiatorId,
      name: data.name,
      description: data.description || '',
      contributionAmount: parseFloat(data.contributionAmount) || 500,
      frequency: data.frequency || 'MONTHLY',
      expectedParticipants: data.expectedParticipants || 10,
      duration: data.duration || 10, // cycles
      participants: [
        {
          userId: initiatorId,
          status: 'ACTIVE',
          joinedAt: new Date().toISOString(),
          score: 0,
          numberOfTurnsCompleted: 0
        }
      ],
      currentCycle: 1,
      currentBeneficiary: null,
      turnQueue: [],
      walletCollective: {
        phoneNumber: '212700000000',
        contractId: `LAN_COLLECTIVE_${uuidv4().substring(0, 8)}`,
        balance: 0
      },
      totalContributed: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + data.duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'CREATED', // CREATED -> ACTIVE -> IN_PROGRESS -> COMPLETED
      createdAt: new Date().toISOString()
    };

    // Sauvegarder en DB
    global.database.tontines.push(tontine);

    return tontine;
  }

  /**
   * Participant rejoint la tontine
   */
  static joinTontine(tontineId, userId, userScore) {
    const tontine = global.database.tontines.find(t => t.id === tontineId);
    
    if (!tontine) {
      throw new Error('Tontine not found');
    }

    // Vérifier si utilisateur n'a déjà rejoint
    if (tontine.participants.some(p => p.userId === userId)) {
      throw new Error('User already joined this tontine');
    }

    // Vérifier limite de participants
    if (tontine.participants.length >= tontine.expectedParticipants) {
      throw new Error('Tontine is full');
    }

    // Ajouter participant
    tontine.participants.push({
      userId,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      score: userScore || 0,
      numberOfTurnsCompleted: 0
    });

    // Si tontine est full, activer
    if (tontine.participants.length === tontine.expectedParticipants) {
      tontine.status = 'ACTIVE';
      
      // Calculer les tours
      TurnAllocationService.recalculateTurns(tontineId);
    }

    return tontine;
  }

  /**
   * Récupère une tontine
   */
  static getTontine(tontineId) {
    return global.database.tontines.find(t => t.id === tontineId);
  }

  /**
   * Liste les tontines d'un utilisateur
   */
  static getUserTontines(userId) {
    return global.database.tontines.filter(
      t => t.participants.some(p => p.userId === userId)
    );
  }

  /**
   * Récupère le statut d'une tontine
   */
  static getTontineStatus(tontineId) {
    const tontine = this.getTontine(tontineId);
    if (!tontine) throw new Error('Tontine not found');

    const participants = tontine.participants.map(p => {
      const user = global.database.users.find(u => u.id === p.userId);
      return {
        userId: p.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        score: p.score,
        status: p.status,
        numberOfTurnsCompleted: p.numberOfTurnsCompleted
      };
    });

    return {
      tontineId: tontine.id,
      name: tontine.name,
      status: tontine.status,
      currentCycle: tontine.currentCycle,
      totalParticipants: tontine.participants.length,
      expectedParticipants: tontine.expectedParticipants,
      contributionAmount: tontine.contributionAmount,
      collectiveBalance: tontine.walletCollective.balance,
      totalContributed: tontine.totalContributed,
      participants,
      currentBeneficiary: tontine.currentBeneficiary ? {
        userId: tontine.currentBeneficiary,
        name: (() => {
          const user = global.database.users.find(u => u.id === tontine.currentBeneficiary);
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
        })(),
        turnNumber: tontine.turnQueue.findIndex(t => t.userId === tontine.currentBeneficiary) + 1 || 1,
        expectedAmount: tontine.walletCollective.balance || (tontine.contributionAmount * (tontine.participants.length - 1))
      } : null,
      nextBeneficiary: tontine.turnQueue[1] ? {
        userId: tontine.turnQueue[1].userId,
        name: (() => {
          const user = global.database.users.find(u => u.id === tontine.turnQueue[1].userId);
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
        })(),
        turnNumber: 2
      } : null,
      turnQueue: tontine.turnQueue.map((turn, idx) => ({
        rank: idx + 1,
        userId: turn.userId,
        userName: (() => {
          const user = global.database.users.find(u => u.id === turn.userId);
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
        })(),
        score: turn.score,
        status: turn.status
      }))
    };
  }

  /**
   * Lance un cycle de tontine (tous les prélèvements et versements)
   */
  static async executeCycle(tontineId) {
    const tontine = this.getTontine(tontineId);
    if (!tontine) throw new Error('Tontine not found');
    if (tontine.status !== 'ACTIVE' && tontine.status !== 'IN_PROGRESS') {
      throw new Error('Tontine is not active');
    }

    tontine.status = 'IN_PROGRESS';
    
    // Récupérer le bénéficiaire actuel (Tour 1)
    const currentBeneficiary = tontine.turnQueue[0];
    if (!currentBeneficiary) throw new Error('No turn queue available');

    tontine.currentBeneficiary = currentBeneficiary.userId;

    return {
      cycleId: `CYCLE_${uuidv4().substring(0, 12)}`,
      tontineId,
      cycle: tontine.currentCycle,
      beneficiaryUserId: currentBeneficiary.userId,
      beneficiaryName: (() => {
        const user = global.database.users.find(u => u.id === currentBeneficiary.userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
      })(),
      status: 'IN_PROGRESS',
      contributionAmount: tontine.contributionAmount,
      expectedAmount: tontine.contributionAmount * (tontine.participants.length - 1),
      startedAt: new Date().toISOString()
    };
  }

  /**
   * Avancer au tour suivant
   */
  static advanceTurn(tontineId) {
    const tontine = this.getTontine(tontineId);
    if (!tontine) throw new Error('Tontine not found');
    if (tontine.turnQueue.length === 0) throw new Error('No turn queue');

    // Marquer le tour actuel comme complété
    const currentTurn = tontine.turnQueue[0];
    currentTurn.status = 'COMPLETED';
    currentTurn.completedAt = new Date().toISOString();

    // Retirer de la queue
    tontine.turnQueue.shift();

    // Passer au cycle suivant si queue est vide
    if (tontine.turnQueue.length === 0) {
      tontine.currentCycle += 1;
      tontine.status = 'COMPLETED';
      tontine.currentBeneficiary = null;
      
      // Recalculer pour le prochain cycle
      TurnAllocationService.recalculateTurns(tontineId);
    } else {
      tontine.currentBeneficiary = tontine.turnQueue[0]?.userId || null;
    }

    return {
      tontineId,
      cycle: tontine.currentCycle,
      completedBeneficiary: currentTurn.userId,
      nextBeneficiary: tontine.currentBeneficiary,
      advancedAt: new Date().toISOString()
    };
  }
}

module.exports = TontineService;
