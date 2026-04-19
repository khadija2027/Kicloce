/**
 * TRANSFER SERVICE
 * ================
 * Simule les transferts wallet CIH avec mock des APIs
 * 3 étapes: Simulation -> OTP -> Confirmation
 */

const { v4: uuidv4 } = require('uuid');

class TransferService {
  /**
   * STEP 1: Simule un transfert wallet-to-wallet
   */
  static simulateTransfer(params) {
    const {
      userId,
      contractId,
      phoneNumber,
      tontineId,
      amount,
      destinationPhone,
      type = 'CONTRIBUTION'
    } = params;

    // Valider montant
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Valider balance (check si suffisant)
    const user = global.database.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    
    if (user.walletData && user.walletData.balance < amount) {
      return {
        status: 'FAILED',
        reason: 'INSUFFICIENT_BALANCE',
        message: `Balance insufficante: ${user.walletData.balance} MAD < ${amount} MAD`,
        timestamp: new Date().toISOString()
      };
    }

    // Créer simulation token
    const transactionId = `TX_SIM_${uuidv4().substring(0, 12)}`.toUpperCase();
    const simulationToken = `TOKEN_${uuidv4().substring(0, 30)}`.toUpperCase();

    // Sauvegarder transaction en DB
    global.database.transactions.push({
      id: transactionId,
      type,
      userId,
      tontineId,
      status: 'SIMULATED',
      amount,
      senderPhoneNumber: phoneNumber,
      senderContractId: contractId,
      senderWalletBalance: user.walletData?.balance || 0,
      destinationPhone,
      simulationToken,
      createdAt: new Date().toISOString()
    });

    return {
      transactionId,
      status: 'SIMULATED',
      simulationToken,
      amount,
      fees: 0,
      totalAmount: amount,
      beneficiaryFirstName: type === 'DISTRIBUTION' ? 'BENEFICIARY' : 'TONTINE',
      beneficiaryLastName: type === 'DISTRIBUTION' ? '' : 'COLLECTIVE',
      referenceId: `REF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: 'Simulation successful, OTP will be sent',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * STEP 2: Requête OTP
   */
  static requestOTP(phoneNumber) {
    // Générer OTP (mock - toujours 123456 pour test)
    const otp = '123456';
    
    // Sauvegarder OTP en cache (ne pas le stocker longtemps en prod)
    if (!global.otpCache) global.otpCache = {};
    global.otpCache[phoneNumber] = {
      code: otp,
      createdAt: Date.now(),
      expiresIn: 5 * 60 * 1000 // 5 minutes
    };

    console.log(`[MOCK SMS] OTP sent to ${phoneNumber}: ${otp}`);

    return {
      codeOtp: otp,
      sentTo: phoneNumber,
      expiresIn: '5 minutes',
      message: 'SMS sent with OTP code',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * STEP 3: Confirmer le transfert avec OTP
   */
  static confirmTransfer(params) {
    const {
      transactionId,
      otp,
      phoneNumber,
      amount
    } = params;

    // Trouver la transaction
    const transaction = global.database.transactions.find(t => t.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Vérifier OTP
    if (!global.otpCache || !global.otpCache[phoneNumber]) {
      return {
        status: 'FAILED',
        reason: 'OTP_EXPIRED',
        message: 'OTP has expired or was not sent'
      };
    }

    const cachedOTP = global.otpCache[phoneNumber];
    const isExpired = Date.now() - cachedOTP.createdAt > cachedOTP.expiresIn;

    if (isExpired) {
      delete global.otpCache[phoneNumber];
      return {
        status: 'FAILED',
        reason: 'OTP_EXPIRED',
        message: 'OTP has expired'
      };
    }

    if (cachedOTP.code !== otp) {
      return {
        status: 'FAILED',
        reason: 'INVALID_OTP',
        message: 'Invalid OTP code'
      };
    }

    // OTP correct - Effectuer le transfert
    const user = global.database.users.find(u => u.id === transaction.userId);
    if (user && user.walletData) {
      user.walletData.balance -= amount;
    }

    // Marquer transaction comme complétée
    transaction.status = 'COMPLETED';
    transaction.confirmedAt = new Date().toISOString();
    transaction.walletReference = `REF_${Math.random().toString(36).substr(2, 9).toUpperCase().substr(0, 15)}`;

    // Mettre à jour le collectif de la tontine si c'est une contribution
    if (transaction.tontineId && transaction.type === 'CONTRIBUTION') {
      const tontine = global.database.tontines.find(t => t.id === transaction.tontineId);
      if (tontine) {
        tontine.walletCollective.balance += amount;
        tontine.totalContributed += amount;
      }
    }

    // Nettoyer OTP
    delete global.otpCache[phoneNumber];

    return {
      transactionId,
      status: 'COMPLETED',
      amount,
      debitAmount: -amount,
      walletReference: transaction.walletReference,
      message: 'Transfer successful',
      confirmedAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Récupère l'historique des transactions
   */
  static getTransactionHistory(tontineId, limit = 50) {
    const transactions = global.database.transactions
      .filter(t => t.tontineId === tontineId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return {
      tontineId,
      count: transactions.length,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount,
        senderPhoneNumber: t.senderPhoneNumber,
        destinationPhone: t.destinationPhone,
        walletReference: t.walletReference,
        createdAt: t.createdAt,
        confirmedAt: t.confirmedAt
      }))
    };
  }

  /**
   * Distribue les fonds au bénéficiaire
   */
  static distributeToBeneficiary(tontineId, beneficiaryUserId, totalAmount) {
    const tontine = global.database.tontines.find(t => t.id === tontineId);
    if (!tontine) throw new Error('Tontine not found');

    const beneficiary = global.database.users.find(u => u.id === beneficiaryUserId);
    if (!beneficiary) throw new Error('Beneficiary not found');

    // Effectuer le transfert (mock)
    const transactionId = `TX_DIST_${uuidv4().substring(0, 12)}`.toUpperCase();

    global.database.transactions.push({
      id: transactionId,
      type: 'DISTRIBUTION',
      userId: beneficiaryUserId,
      tontineId,
      status: 'COMPLETED',
      amount: totalAmount,
      senderPhoneNumber: tontine.walletCollective.phoneNumber,
      senderContractId: tontine.walletCollective.contractId,
      destinationPhone: beneficiary.phoneNumber,
      walletReference: `DIST_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // Ajouter au wallet du bénéficiaire
    if (beneficiary.walletData) {
      beneficiary.walletData.balance += totalAmount;
    }

    // Vider le collectif
    tontine.walletCollective.balance = 0;

    return {
      distributionId: transactionId,
      beneficiaryUserId,
      amount: totalAmount,
      status: 'COMPLETED',
      distributedAt: new Date().toISOString()
    };
  }
}

module.exports = TransferService;
