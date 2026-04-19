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
      const calculatedFees = parseFloat(amount) * 0.025;
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
      const calculatedFees = parseFloat(amount) * 0.025;
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

/**
 * POST /api/wallet/transfer/wallet
 * Trois étapes pour le transfert: simulation, OTP, confirmation
 */
router.post('/transfer/wallet', (req, res) => {
  try {
    const { step, contractId, mobileNumber, destinationPhone, amount, clientNote, token, otp, referenceId } = req.body;

    if (!step) {
      return res.status(400).json({ error: 'Missing step parameter (simulation or confirmation)' });
    }

    // 🔍 ÉTAPE 1: Simulation
    if (step === 'simulation') {
      console.log(`💱 [TRANSFER SIMULATION] From: ${mobileNumber}, To: ${destinationPhone}, Amount: ${amount} MAD`);

      if (!mobileNumber || !destinationPhone || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields: mobileNumber, destinationPhone, amount' 
        });
      }

      // Vérifier le solde du sender
      const senderUser = global.database.users.find(u => u.phoneNumber === mobileNumber);
      if (!senderUser) {
        return res.status(404).json({ error: 'Sender not found' });
      }

      // Vérifier que le destinataire existe
      const recipientUser = global.database.users.find(u => u.phoneNumber === destinationPhone);
      if (!recipientUser) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      const senderBalance = senderUser.walletData?.balance || 0;
      const transferAmount = parseFloat(amount);
      
      if (transferAmount > senderBalance) {
        return res.status(400).json({ 
          error: `Insufficient balance. Available: ${senderBalance} MAD, Requested: ${transferAmount} MAD`
        });
      }

      // Calculer les frais (2.5%)
      const simulationToken = `${uuidv4().substring(0, 16).toUpperCase()}`;
      const comissionFee = transferAmount * 0.025;
      const tvaFee = comissionFee * 0.1;
      const totalFees = comissionFee + tvaFee;

      const simulationResponse = {
        result: {
          amount: transferAmount.toFixed(2),
          Fees: comissionFee.toFixed(1),
          beneficiaryFirstName: recipientUser.firstName || 'Recipient',
          beneficiaryLastName: recipientUser.lastName || 'Name',
          beneficiaryRIB: null,
          contractId: contractId,
          currency: 'MAD',
          date: null,
          dateToCompare: '00010101T000000Z',
          frais: [
            {
              currency: 'MAD',
              fullName: '',
              name: 'COM',
              referenceId: simulationToken,
              value: comissionFee.toFixed(1)
            },
            {
              currency: 'MAD',
              fullName: '',
              name: 'TVA',
              referenceId: simulationToken,
              value: tvaFee.toFixed(1)
            }
          ],
          numTel: destinationPhone,
          operation: 'TRANSFER',
          referenceId: simulationToken,
          sign: null,
          srcDestNumber: destinationPhone,
          status: 'PENDING',
          totalAmount: (transferAmount).toFixed(2),
          totalFrai: totalFees.toFixed(2),
          type: 'TT',
          isCanceled: false,
          isTierCashIn: false
        }
      };

      // Stocker la simulation
      if (!global.walletSessions) {
        global.walletSessions = {};
      }
      global.walletSessions[simulationToken] = {
        mobileNumber,
        destinationPhone,
        amount: transferAmount,
        fees: totalFees,
        comissionFee,
        tvaFee,
        timestamp: Date.now(),
        status: 'simulated_transfer'
      };

      console.log(`✅ Transfer simulation successful, token: ${simulationToken}`);
      return res.status(200).json(simulationResponse);
    }

    // ✅ ÉTAPE 3: Confirmation
    else if (step === 'confirmation') {
      console.log(`💳 [TRANSFER CONFIRMATION] Token: ${referenceId}, Amount: ${amount} MAD, OTP: ${otp}`);

      if (!referenceId || !amount || !otp || !mobileNumber || !destinationPhone) {
        return res.status(400).json({ 
          error: 'Missing required fields: referenceId, amount, otp, mobileNumber, destinationPhone' 
        });
      }

      // Vérifier la session
      if (!global.walletSessions || !global.walletSessions[referenceId]) {
        return res.status(404).json({ 
          error: 'Session not found. Please run simulation first.' 
        });
      }

      const session = global.walletSessions[referenceId];

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
      const transactionReference = `${Math.random().toString().substring(2, 11)}`;

      const confirmationResponse = {
        result: {
          item1: {
            creditAmounts: (parseFloat(amount) - session.fees).toFixed(3),
            debitAmounts: parseFloat(amount).toFixed(3),
            depot: null,
            retrait: null,
            value: `${(parseFloat(amount) - session.fees).toFixed(3)}`
          },
          item2: '000',
          item3: 'Successful'
        }
      };

      // Mettre à jour le wallet du sender
      if (global.database && global.database.users) {
        const senderUser = global.database.users.find(u => u.phoneNumber === session.mobileNumber);
        if (senderUser && senderUser.walletData) {
          senderUser.walletData.balance = (senderUser.walletData.balance || 0) - parseFloat(amount);
          senderUser.walletBalance = senderUser.walletData.balance;
          
          // Ajouter la transaction sender
          if (!senderUser.walletData.transactions) {
            senderUser.walletData.transactions = [];
          }
          senderUser.walletData.transactions.push({
            id: transactionReference,
            type: 'TRANSFER_OUT',
            status: 'COMPLETED',
            amount: parseFloat(amount),
            recipient: session.destinationPhone,
            date: new Date().toISOString(),
            description: `Transfer to ${session.destinationPhone}`
          });

          console.log(`✅ Sender wallet updated for ${session.mobileNumber}. New balance: ${senderUser.walletData.balance} MAD`);
        }

        // Mettre à jour le wallet du recipient
        const recipientUser = global.database.users.find(u => u.phoneNumber === session.destinationPhone);
        if (recipientUser && recipientUser.walletData) {
          const netAmount = parseFloat(amount) - session.fees;
          recipientUser.walletData.balance = (recipientUser.walletData.balance || 0) + netAmount;
          recipientUser.walletBalance = recipientUser.walletData.balance;
          
          // Ajouter la transaction recipient
          if (!recipientUser.walletData.transactions) {
            recipientUser.walletData.transactions = [];
          }
          recipientUser.walletData.transactions.push({
            id: transactionReference,
            type: 'TRANSFER_IN',
            status: 'COMPLETED',
            amount: netAmount,
            sender: session.mobileNumber,
            date: new Date().toISOString(),
            description: `Transfer from ${session.mobileNumber}`
          });

          console.log(`✅ Recipient wallet updated for ${session.destinationPhone}. New balance: ${recipientUser.walletData.balance} MAD`);
        }
      }

      // Mettre à jour la session
      session.status = 'confirmed_transfer';
      session.transactionReference = transactionReference;

      console.log(`✅ Transfer confirmation successful, reference: ${transactionReference}`);
      return res.status(200).json(confirmationResponse);
    }

    else {
      return res.status(400).json({ error: 'Invalid step. Must be "simulation" or "confirmation".' });
    }

  } catch (error) {
    console.error('❌ Wallet Transfer error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/transfer/wallet/otp
 * Génération de l'OTP pour le transfert
 */
router.post('/transfer/wallet/otp', (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber' });
    }

    console.log(`📱 [TRANSFER OTP GENERATION] Phone: ${phoneNumber}`);

    // Générer un OTP mock (6 chiffres)
    const codeOtp = String(Math.floor(100000 + Math.random() * 900000)).substring(0, 6);

    // Stocker dans la session pour validation
    if (!global.otpSessions) {
      global.otpSessions = {};
    }
    global.otpSessions[phoneNumber] = {
      otp: codeOtp,
      timestamp: Date.now(),
      attempts: 0
    };

    console.log(`✅ Transfer OTP generated: ${codeOtp}`);

    const response = {
      result: [
        {
          codeOtp: codeOtp
        }
      ]
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Transfer OTP generation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
