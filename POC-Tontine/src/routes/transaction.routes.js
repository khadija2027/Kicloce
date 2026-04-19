/**
 * ROUTES: Transactions & Transfers
 * =================================
 */

const express = require('express');
const TransferService = require('../services/transfer.service');
const TontineService = require('../services/tontine.service');

const router = express.Router();

/**
 * POST /api/transactions/simulate
 * Simule un transfert (Step 1)
 */
router.post('/simulate', (req, res) => {
  try {
    const {
      tontineId,
      amount = 500,
      type = 'CONTRIBUTION'
    } = req.body;

    // Mock: utiliser le premier utilisateur actif
    const user = global.database.users.find(u => u.status === 'ACTIVE');
    if (!user) {
      return res.status(400).json({ error: 'No active user found' });
    }

    const tontine = TontineService.getTontine(tontineId);
    if (!tontine) {
      return res.status(404).json({ error: 'Tontine not found' });
    }

    const result = TransferService.simulateTransfer({
      userId: user.id,
      contractId: user.contractId,
      phoneNumber: user.phoneNumber,
      tontineId,
      amount,
      destinationPhone: tontine.walletCollective.phoneNumber,
      type
    });

    if (result.status === 'FAILED') {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      ...result,
      nextStep: 'Request OTP',
      nextEndpoint: 'POST /api/transactions/request-otp'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/request-otp
 * Demande un OTP (Step 2)
 */
router.post('/request-otp', (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber' });
    }

    const result = TransferService.requestOTP(phoneNumber);

    return res.status(200).json({
      ...result,
      nextStep: 'Confirm Transfer with OTP',
      nextEndpoint: 'POST /api/transactions/confirm',
      note: 'OTP code for testing: ' + result.codeOtp
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/confirm/:transactionId
 * Confirme le transfert avec OTP (Step 3)
 */
router.post('/confirm/:transactionId', (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const { otp, phoneNumber } = req.body;

    if (!otp || !phoneNumber) {
      return res.status(400).json({ error: 'Missing otp or phoneNumber' });
    }

    const result = TransferService.confirmTransfer({
      transactionId,
      otp,
      phoneNumber,
      amount: req.body.amount || 500
    });

    if (result.status === 'FAILED') {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/transactions/history/:tontineId
 * Récupère l'historique des transactions d'une tontine
 */
router.get('/history/:tontineId', (req, res) => {
  try {
    const tontineId = req.params.tontineId;
    const history = TransferService.getTransactionHistory(tontineId);

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/distribute-to-beneficiary
 * Distribue les fonds au bénéficiaire
 */
router.post('/distribute-to-beneficiary', (req, res) => {
  try {
    const { tontineId, beneficiaryUserId } = req.body;

    if (!tontineId || !beneficiaryUserId) {
      return res.status(400).json({ error: 'Missing tontineId or beneficiaryUserId' });
    }

    const tontine = TontineService.getTontine(tontineId);
    if (!tontine) {
      return res.status(404).json({ error: 'Tontine not found' });
    }

    const beneficiary = global.database.users.find(u => u.id === beneficiaryUserId);
    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }

    const totalAmount = tontine.walletCollective.balance;
    const result = TransferService.distributeToBeneficiary(tontineId, beneficiaryUserId, totalAmount);

    return res.status(200).json({
      ...result,
      beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      beneficiaryNewBalance: beneficiary.walletData?.balance || 0
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/execute-full-cycle
 * Exécute un cycle complet (tous les prélèvements + versement)
 * Mock pour démo
 */
router.post('/execute-full-cycle', (req, res) => {
  try {
    const { tontineId } = req.body;

    if (!tontineId) {
      return res.status(400).json({ error: 'Missing tontineId' });
    }

    const tontine = TontineService.getTontine(tontineId);
    if (!tontine) {
      return res.status(404).json({ error: 'Tontine not found' });
    }

    if (tontine.status !== 'ACTIVE' && tontine.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Tontine is not active' });
    }

    const cycle = TontineService.executeCycle(tontineId);

    // Mock: Simule les contributions de tous (sauf bénéficiaire)
    let totalContributed = 0;
    const contributionPerPerson = tontine.contributionAmount;
    const contributors = [];

    tontine.participants.forEach(participant => {
      if (participant.userId !== cycle.beneficiaryUserId) {
        const user = global.database.users.find(u => u.id === participant.userId);
        if (user && user.walletData) {
          user.walletData.balance -= contributionPerPerson;
          totalContributed += contributionPerPerson;
          contributors.push({
            userId: participant.userId,
            name: `${user.firstName} ${user.lastName}`,
            amount: contributionPerPerson,
            status: 'COMPLETED'
          });
        }
      }
    });

    // Ajouter au collectif
    tontine.walletCollective.balance += totalContributed;
    tontine.totalContributed += totalContributed;

    // Distribuer au bénéficiaire
    const beneficiary = global.database.users.find(u => u.id === cycle.beneficiaryUserId);
    if (beneficiary && beneficiary.walletData) {
      beneficiary.walletData.balance += totalContributed;
    }

    // Vider le collectif
    tontine.walletCollective.balance = 0;

    return res.status(200).json({
      cycleId: cycle.cycleId,
      tontineId,
      cycle: tontine.currentCycle,
      beneficiary: {
        userId: cycle.beneficiaryUserId,
        name: cycle.beneficiaryName,
        receivedAmount: totalContributed
      },
      contributions: {
        count: contributors.length,
        totalAmount: totalContributed,
        contributors
      },
      status: 'COMPLETED',
      message: `Cycle ${tontine.currentCycle} completed! ${cycle.beneficiaryName} received ${totalContributed} MAD`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
