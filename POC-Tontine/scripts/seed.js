#!/usr/bin/env node

/**
 * SEED SCRIPT
 * ===========
 * Initialise des données de test pour la démo
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const userPhoneMap = {}; // Map userId -> phoneNumber

async function seed() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🌱 SEEDING POC TONTINE DIGITALE...                   ║
╚════════════════════════════════════════════════════════════════╝
  `);

  try {
    // 1. Vérifier que l'API est accessible
    console.log('📡 Checking API connectivity...');
    try {
      await axios.get(`${API_BASE.replace('/api', '')}/health`);
      console.log('   ✅ API is running on http://localhost:5000\n');
    } catch {
      throw new Error('Cannot connect to API on http://localhost:5000. Make sure "npm start" is running!');
    }

    // 2. Create 3 users for testing frontend
    console.log('📝 Creating 3 users...');
    const userIds = [];
    const names = [
      { first: 'Fatima', last: 'El Amrani', phone: '212700446631' },
      { first: 'Youssef', last: 'Bennani', phone: '212612345678' },
      { first: 'Nadia', last: 'Aziz', phone: '212722334455' }
    ];

    for (const name of names) {
      const phoneNumber = name.phone;
      
      const response = await axios.post(`${API_BASE}/auth/register`, {
        phoneNumber,
        firstName: name.first,
        lastName: name.last,
        email: `${name.first.toLowerCase()}@example.com`,
        dateOfBirth: '1990-01-15',
        address: 'Casablanca, Morocco'
      });

      const userId = response.data.userId;
      userIds.push(userId);
      userPhoneMap[userId] = phoneNumber; // Store for later
      console.log(`   ✅ Created: ${name.first} ${name.last} (${userId})`);
    }

    // 3. Vérifier tous les utilisateurs via OTP
    console.log('\n🔑 Verifying all users with OTP...');
    for (const userId of userIds) {
      const phoneNumber = userPhoneMap[userId];
      
      const response = await axios.post(`${API_BASE}/auth/verify-otp`, {
        phoneNumber,
        otp: '123456'
      });
      
      console.log(`   ✅ Verified: ${response.data.userId}`);
    }

    // 4. Create a tontine with the 3 users
    console.log('\n🎯 Creating Tontine...');
    const tontineRes = await axios.post(`${API_BASE}/tontines/create`, {
      name: 'Tontine Casablanca Q1-2024',
      description: 'Demo tontine for POC',
      contributionAmount: 500,
      frequency: 'MONTHLY',
      expectedParticipants: 3,
      duration: 12
    });

    const tontineId = tontineRes.data.tontineId;
    console.log(`   ✅ Created tontine: ${tontineId}`);

    // 5. Faire rejoindre les autres utilisateurs
    console.log('\n👥 Adding participants to tontine...');
    for (let i = 1; i < userIds.length; i++) {
      const response = await axios.post(`${API_BASE}/tontines/${tontineId}/join`, {
        userId: userIds[i]
      });
      console.log(`   ✅ Participant ${i} joined: ${response.data.participantName}`);
    }

    // 6. Vérifier le statut de la tontine
    console.log('\n📊 Tontine status:');
    const statusRes = await axios.get(`${API_BASE}/tontines/${tontineId}/status`);
    console.log(`   Status: ${statusRes.data.status}`);
    console.log(`   Participants: ${statusRes.data.totalParticipants}/${statusRes.data.expectedParticipants}`);
    console.log(`   Turn Queue: ${statusRes.data.turnQueue.length} turns`);
    console.log(`   Collective Balance: ${statusRes.data.collectiveBalance} MAD`);

    // 7. Afficher le classement par score
    console.log('\n🏆 Participant Ranking (by score):');
    if (statusRes.data.turnQueue && statusRes.data.turnQueue.length > 0) {
      statusRes.data.turnQueue.forEach((turn, idx) => {
        const participant = statusRes.data.participants.find(p => p.userId === turn.userId);
        const name = participant ? participant.name : 'Unknown';
        console.log(`   ${idx + 1}. ${name}: ${turn.score} points`);
      });
    }

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   ✅ SEEDING COMPLETE!                         ║
╚════════════════════════════════════════════════════════════════╝

📚 API READY TO TEST:

  🌐 Endpoints:
     ${API_BASE.replace('/api', '')}/health          - API status
     ${API_BASE.replace('/api', '')}/api             - Full documentation
     ${API_BASE}/auth/users                  - All users
     ${API_BASE}/scoring                     - All scores benchmark
     ${API_BASE}/tontines/${tontineId}/status - Tontine details

  🎬 Next step:
     npm run demo

  📖 Learn more:
     cat README.md       - Quick start
     cat WORKFLOW.md     - Complete workflow explanation

    `);

  } catch (error) {
    console.error('\n❌ Error during seeding:');
    console.error('-----------------------------------');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response from server:', error.message);
      console.error('\n💡 Tip: Make sure the API is running!');
      console.error('   Run: npm start (in another terminal)');
    } else {
      console.error('Error:', error.message);
    }
    console.error('-----------------------------------');
    process.exit(1);
  }
}

seed();
