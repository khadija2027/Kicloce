#!/usr/bin/env node

/**
 * DEMO SCRIPT
 * ===========
 * Démontre le cycle complet d'une tontine
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

function printSection(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}`);
}

function printJSON(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

async function demo() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║      🎬 POC TONTINE DIGITALE - FULL LIFECYCLE DEMO            ║
╚════════════════════════════════════════════════════════════════╝
  `);

  try {
    // 1. Vérifier que l'API est running
    printSection('Step 1: Check API Health');
    const healthRes = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log(`✅ API Status: ${healthRes.data.status}`);
    console.log(`   Users in DB: ${healthRes.data.database.users}`);
    console.log(`   Tontines in DB: ${healthRes.data.database.tontines}`);

    // 2. Lister tous les utilisateurs
    printSection('Step 2: List All Users');
    const usersRes = await axios.get(`${API_BASE}/auth/users`);
    console.log(`Total users: ${usersRes.data.count}`);
    usersRes.data.users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.firstName} ${u.lastName} (${u.phoneNumber})`);
      console.log(`     Balance: ${u.walletBalance} MAD | Status: ${u.status}`);
    });

    // 3. Lister les tontines
    printSection('Step 3: List All Tontines');
    const tontinesRes = await axios.get(`${API_BASE}/tontines`);
    if (tontinesRes.data.count === 0) {
      console.log('⚠️  No tontines found. Run: npm run seed');
      process.exit(0);
    }

    console.log(`Total tontines: ${tontinesRes.data.count}`);
    const tontineId = tontinesRes.data.tontines[0].id;
    console.log(`Using tontine: ${tontineId}`);

    // 4. Afficher le statut détaillé de la tontine
    printSection('Step 4: Tontine Detailed Status');
    const statusRes = await axios.get(`${API_BASE}/tontines/${tontineId}/status`);
    console.log(`Name: ${statusRes.data.name}`);
    console.log(`Status: ${statusRes.data.status}`);
    console.log(`Participants: ${statusRes.data.totalParticipants}/${statusRes.data.expectedParticipants}`);
    console.log(`Contribution: ${statusRes.data.contributionAmount} MAD`);
    console.log(`Current Cycle: ${statusRes.data.currentCycle}`);
    console.log(`Collective Balance: ${statusRes.data.collectiveBalance} MAD`);

    // 5. Afficher le turn queue (ranking)
    printSection('Step 5: Turn Queue (Ranking by Score)');
    statusRes.data.turnQueue.forEach((turn, idx) => {
      console.log(`  ${idx + 1}. ${statusRes.data.participants[idx].name}`);
      console.log(`     Score: ${turn.score} | Status: ${turn.status}`);
    });

    // 6. Afficher les détails du scoring
    printSection('Step 6: Scoring Details');
    const scoringRes = await axios.get(`${API_BASE}/scoring`);
    console.log(`Total users scored: ${scoringRes.data.count}`);
    console.log(`\nBenchmark:\n  Avg: ${scoringRes.data.benchmark.avgScore}\n  Max: ${scoringRes.data.benchmark.maxScore}\n  Min: ${scoringRes.data.benchmark.minScore}`);
    console.log(`\nTop 3 by score:`);
    scoringRes.data.scores.slice(0, 3).forEach((score, idx) => {
      console.log(`  ${idx + 1}. ${score.userName}: ${score.totalScore}/100`);
      const details = score.scoreDetails;
      console.log(`     Stability: ${details.stability.value}/100 (weight: 40%)`);
      console.log(`     Regularity: ${details.regularity.value}/100 (weight: 25%)`);
      console.log(`     Seniority: ${details.seniority.value}/100 (weight: 20%)`);
    });

    // 7. Simulation du tour complet
    printSection('Step 7: Complete Cycle Simulation');
    const simulationRes = await axios.get(`${API_BASE}/tontines/${tontineId}/turn-simulation`);
    console.log(`Total participants: ${simulationRes.data.totalParticipants}`);
    console.log(`Total to distribute per beneficiary: ${simulationRes.data.distribution[0].expectedReceive} MAD`);
    console.log(`\nDistribution schedule:`);
    simulationRes.data.distribution.slice(0, 3).forEach(dist => {
      const userName = statusRes.data.participants
        .find(p => p.userId === dist.userId)?.name || 'Unknown';
      console.log(`  Rank ${dist.rank}: ${userName}`);
      console.log(`    Will receive: ${dist.expectedReceive} MAD`);
      console.log(`    Estimated date: ${dist.estimatedDate}`);
    });

    // 8. Simulation d'un cycle complet (transferts + distribution)
    printSection('Step 8: Execute Full Cycle');
    const cycleRes = await axios.post(`${API_BASE}/transactions/execute-full-cycle`, {
      tontineId
    });
    console.log(`✅ Cycle execution successful!`);
    console.log(`   Beneficiary: ${cycleRes.data.beneficiary.name}`);
    console.log(`   Amount distributed: ${cycleRes.data.beneficiary.receivedAmount} MAD`);
    console.log(`   Contributors: ${cycleRes.data.contributions.count}`);
    console.log(`\nMessage: ${cycleRes.data.message}`);

    // 9. Afficher l'historique des transactions
    printSection('Step 9: Transaction History');
    const historyRes = await axios.get(`${API_BASE}/transactions/history/${tontineId}`);
    console.log(`Total transactions: ${historyRes.data.count}`);
    historyRes.data.transactions.slice(0, 5).forEach((t, idx) => {
      console.log(`  ${idx + 1}. ${t.type}: ${t.amount} MAD`);
      console.log(`     Status: ${t.status} | Date: ${t.createdAt}`);
    });

    // 10. Vérifier les balances finales
    printSection('Step 10: Final Wallet Balances');
    const finalUsersRes = await axios.get(`${API_BASE}/auth/users`);
    finalUsersRes.data.users.forEach(u => {
      console.log(`  ${u.firstName} ${u.lastName}: ${u.walletBalance} MAD`);
    });

    printSection('🎉 DEMO COMPLETE!');
    console.log(`
Key Insights:
  1. ✅ Users created and verified with OTP
  2. ✅ Scoring calculated (5 factors)
  3. ✅ Turn queue allocated (highest score first)
  4. ✅ Cycle executed (contributions collected)
  5. ✅ Distribution completed (beneficiary received funds)
  6. ✅ Transaction history recorded
  7. ✅ Wallet balances updated

Next Steps in Real Implementation:
  • Integrate real CIH Wallet APIs
  • Replace mock OTP with SMS service
  • Add database persistence (MongoDB)
  • Implement user authentication (JWT)
  • Add notification system
  • Frontend dashboard
  • Support for multiple cycles
    `);

  } catch (error) {
    console.error('❌ Error during demo:', error.response?.status, error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Cannot connect to API. Make sure it\'s running: npm start');
    }
    process.exit(1);
  }
}

// Run demo
demo();
