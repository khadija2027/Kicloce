/**
 * ROUTES: Wallet Management (CIH Cash IN/OUT)
 * =============================================
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

/**
 * POST /api/wallet/cash/in
 * Deux étapes pour le dépôt: simulation et confirmation
 */
router.post('/cash/in', (req, res) => {
  try {
    const { step, contractId, level, phoneNumber, amount, fees, token } = req.body;

    if (!step) {
      return res.status(400).json({ error: 'Missing step parameter (simulation or confirmation)' });
    }

    // 🔍 ÉTAPE 1: Simulation
    if (step === 'simulation') {
      console.log(`💳 [CASH IN SIMULATION] Phone: ${phoneNumber}, Amount: ${amount} MAD`);

      if (!contractId || !phoneNumber || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields for simulation: contractId, phoneNumber, amount' 
        });
      }

      // Mock simulation response
      const simulationToken = `${uuidv4().substring(0, 16).toUpperCase()}`;
      const calculatedFees = parseFloat(amount) * 0.25;
      const amountToCollect = parseFloat(amount) + calculatedFees;

      const simulationResponse = {
        result: {
          Fees: calculatedFees.toFixed(1),
          feeDetail: `Nature:"COM",InvariantFee:0.000,VariantFee:${calculatedFees}`,
          token: simulationToken,
          amountToCollect: amountToCollect,
          isTier: true,
          cardId: contractId,
          transactionId: `${new Date().getTime()}`,
          benFirstName: 'Customer',
          benLastName: 'Tontine+',
        }
      };

      // Stocker la simulation en mémoire (normalement en DB)
      if (!global.walletSessions) {
        global.walletSessions = {};
      }
      global.walletSessions[simulationToken] = {
        contractId,
        phoneNumber,
        amount,
        fees: calculatedFees,
        timestamp: Date.now(),
        status: 'simulated'
      };

      console.log(`✅ Simulation successful, token: ${simulationToken}`);
      return res.status(200).json(simulationResponse);
    }

    // ✅ ÉTAPE 2: Confirmation
    else if (step === 'confirmation') {
      console.log(`💳 [CASH IN CONFIRMATION] Token: ${token}, Amount: ${amount} MAD`);

      if (!token || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields for confirmation: token, amount' 
        });
      }

      // Vérifier que la simulation existe
      if (!global.walletSessions || !global.walletSessions[token]) {
        return res.status(404).json({ 
          error: 'Session not found. Please run simulation first.' 
        });
      }

      const session = global.walletSessions[token];

      // Vérifier que le montant correspond
      if (parseFloat(amount) !== parseFloat(session.amount)) {
        return res.status(400).json({ 
          error: 'Amount mismatch. Simulation and confirmation amounts must match.' 
        });
      }

      // Mock confirmation response
      const transactionReference = `${Math.random().toString().substring(2, 12)}`;
      
      const confirmationResponse = {
        result: {
          Fees: session.fees.toFixed(1),
          feeDetails: null,
          token: token,
          amount: parseFloat(amount),
          transactionReference: transactionReference,
          optFieldOutput1: null,
          optFieldOutput2: null,
          cardId: session.contractId,
          status: 'SUCCESS',
          message: 'Transaction completed successfully',
        }
      };

      // Mettre à jour la session
      session.status = 'confirmed';
      session.transactionReference = transactionReference;
      session.completedAt = Date.now();

      // Mettre à jour le wallet de l'utilisateur
      if (global.database && global.database.users) {
        const user = global.database.users.find(u => u.phoneNumber === session.phoneNumber);
        if (user && user.walletData) {
          user.walletData.balance = (user.walletData.balance || 0) + parseFloat(amount);
          user.walletBalance = user.walletData.balance;
          
          // Ajouter la transaction à l'historique
          if (!user.walletData.transactions) {
            user.walletData.transactions = [];
          }
          user.walletData.transactions.push({
            id: transactionReference,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            description: 'Cash IN (Dépôt Wallet)'
          });

          console.log(`✅ Wallet updated for ${user.phoneNumber}. New balance: ${user.walletData.balance} MAD`);
        }
      }

      console.log(`✅ Confirmation successful, reference: ${transactionReference}`);
      return res.status(200).json(confirmationResponse);
    }

    else {
      return res.status(400).json({ error: 'Invalid step. Must be "simulation" or "confirmation".' });
    }

  } catch (error) {
    console.error('❌ Wallet Cash IN error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallet/balance
 * Récupère le solde du wallet
 */
router.get('/balance', (req, res) => {
  try {
    const phoneNumber = req.query.phoneNumber;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber parameter' });
    }

    const user = global.database.users.find(u => u.phoneNumber === phoneNumber);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      result: {
        balance: user.walletData?.balance || 0,
        walletToken: user.walletToken,
        phoneNumber: user.phoneNumber,
        status: user.status,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallet/transactions
 * Récupère l'historique des transactions
 */
router.get('/transactions', (req, res) => {
  try {
    const phoneNumber = req.query.phoneNumber;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber parameter' });
    }

    const user = global.database.users.find(u => u.phoneNumber === phoneNumber);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      result: {
        transactions: user.walletData?.transactions || [],
        totalCount: (user.walletData?.transactions || []).length,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/cash/out
 * Trois étapes pour le retrait: simulation, OTP, confirmation
 */
router.post('/cash/out', (req, res) => {
  try {
    const { step, phoneNumber, amount, fees, token, otp } = req.body;

    if (!step) {
      return res.status(400).json({ error: 'Missing step parameter (simulation or confirmation)' });
    }

    // 🔍 ÉTAPE 1: Simulation
    if (step === 'simulation') {
      console.log(`💸 [CASH OUT SIMULATION] Phone: ${phoneNumber}, Amount: ${amount} MAD`);

      if (!phoneNumber || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields: phoneNumber, amount' 
        });
      }

      // Vérifier le solde
      const user = global.database.users.find(u => u.phoneNumber === phoneNumber);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userBalance = user.walletData?.balance || 0;
      const withdrawAmount = parseFloat(amount);
      
      if (withdrawAmount > userBalance) {
        return res.status(400).json({ 
          error: `Insufficient balance. Available: ${userBalance} MAD, Requested: ${withdrawAmount} MAD`
        });
      }

      // Mock simulation response
      const simulationToken = `${uuidv4().substring(0, 16).toUpperCase()}`;
      const calculatedFees = parseFloat(amount) * 0.25;
      const maxCashOut = Math.min(userBalance - 100, 5000); // Max 5000 MAD

      const simulationResponse = {
        result: {
          Fees: calculatedFees.toFixed(1),
          feeDetail: `Nature:"COM",InvariantFee:0.000,VariantFee:${calculatedFees}`,
          token: simulationToken,
          amountToCollect: withdrawAmount,
          cashOut_Max: maxCashOut,
          cardId: user.contractId || 'LAN230748934021281',
          transactionId: `${new Date().getTime()}`,
          optFieldOutput1: null,
          optFieldOutput2: null,
        }
      };

      // Stocker la simulation
      if (!global.walletSessions) {
        global.walletSessions = {};
      }
      global.walletSessions[simulationToken] = {
        phoneNumber,
        amount: withdrawAmount,
        fees: calculatedFees,
        timestamp: Date.now(),
        status: 'simulated_out'
      };

      console.log(`✅ Simulation successful, token: ${simulationToken}`);
      return res.status(200).json(simulationResponse);
    }

    // ✅ ÉTAPE 3: Confirmation
    else if (step === 'confirmation') {
      console.log(`💳 [CASH OUT CONFIRMATION] Token: ${token}, Amount: ${amount} MAD, OTP: ${otp}`);

      if (!token || !amount || !otp) {
        return res.status(400).json({ 
          error: 'Missing required fields: token, amount, otp' 
        });
      }

      // Vérifier la session
      if (!global.walletSessions || !global.walletSessions[token]) {
        return res.status(404).json({ 
          error: 'Session not found. Please run simulation first.' 
        });
      }

      const session = global.walletSessions[token];

      // Vérifier le montant
      if (parseFloat(amount) !== parseFloat(session.amount)) {
        return res.status(400).json({ 
          error: 'Amount mismatch' 
        });
      }

      // Valider l'OTP (mock: accepter n'importe quel OTP 6 chiffres)
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ 
          error: 'Invalid OTP format' 
        });
      }

      // Mock confirmation response
      const transactionReference = `${Math.random().toString().substring(2, 12)}`;

      const confirmationResponse = {
        result: {
          Fees: session.fees.toFixed(1),
          feeDetails: null,
          token: token,
          amount: parseFloat(amount),
          transactionReference: transactionReference,
          optFieldOutput1: null,
          optFieldOutput2: null,
          cardId: session.cardId,
          status: 'SUCCESS',
        }
      };

      // Mettre à jour le wallet de l'utilisateur
      if (global.database && global.database.users) {
        const user = global.database.users.find(u => u.phoneNumber === session.phoneNumber);
        if (user && user.walletData) {
          user.walletData.balance = (user.walletData.balance || 0) - parseFloat(amount);
          user.walletBalance = user.walletData.balance;
          
          // Ajouter la transaction
          if (!user.walletData.transactions) {
            user.walletData.transactions = [];
          }
          user.walletData.transactions.push({
            id: transactionReference,
            type: 'WITHDRAWAL',
            status: 'COMPLETED',
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            description: 'Cash OUT (Retrait Wallet)'
          });

          console.log(`✅ Wallet updated for ${user.phoneNumber}. New balance: ${user.walletData.balance} MAD`);
        }
      }

      // Mettre à jour la session
      session.status = 'confirmed_out';
      session.transactionReference = transactionReference;

      console.log(`✅ Confirmation successful, reference: ${transactionReference}`);
      return res.status(200).json(confirmationResponse);
    }

    else {
      return res.status(400).json({ error: 'Invalid step. Must be "simulation" or "confirmation".' });
    }

  } catch (error) {
    console.error('❌ Wallet Cash OUT error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/cash/out/otp
 * Génération de l'OTP pour le retrait
 */
router.post('/cash/out/otp', (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber' });
    }

    console.log(`📱 [OTP GENERATION] Phone: ${phoneNumber}`);

    // Générer un OTP mock (6 chiffres)
    const codeOtp = String(Math.floor(100000 + Math.random() * 900000)).substring(0, 6);

    // Stocker dans la session pour validation (en prod, on enverrait par SMS)
    if (!global.otpSessions) {
      global.otpSessions = {};
    }
    global.otpSessions[phoneNumber] = {
      otp: codeOtp,
      timestamp: Date.now(),
      attempts: 0
    };

    console.log(`✅ OTP generated: ${codeOtp} (stored in memory for demo)`);

    const response = {
      result: [
        {
          codeOtp: codeOtp  // En prod, ne pas retourner l'OTP, juste confirmer l'envoi
        }
      ]
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ OTP generation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
