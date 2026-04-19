import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/store';
import { adminService } from '../services/api';
import AdminStats from '../components/AdminStats';
import AdminUsersTable from '../components/AdminUsersTable';
import AdminTontinesTable from '../components/AdminTontinesTable';
import AdminApiMonitor from '../components/AdminApiMonitor';

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTontines: 0,
    totalTransactions: 0,
    totalVolume: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints
      const usersRes = await adminService.getAllUsers();
      const tontinesRes = await adminService.getAllTontines();
      
      const users = usersRes.data || usersRes.data.users || [];
      const tontines = tontinesRes.data || tontinesRes.data.tontines || [];

      // Calculate statistics
      const totalVolume = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
      const averageScore = users.length > 0 
        ? users.reduce((sum, u) => sum + (u.creditScore || 0), 0) / users.length 
        : 0;

      setStats({
        totalUsers: users.length,
        activeTontines: tontines.filter(t => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS').length,
        totalTransactions: 0, // This would come from a transactions API
        totalVolume: totalVolume,
        averageScore: averageScore
      });
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Aperçu', icon: '📈' },
    { id: 'users', label: '👥 Utilisateurs', icon: '👤' },
    { id: 'tontines', label: '💼 Tontines', icon: '💼' },
    { id: 'monitoring', label: '🔄 Monitoring API', icon: '🔌' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                🛡️ Tableau de Bord Admin
              </h1>
              <p className="text-gray-600 mt-2">
                Bienvenue, <span className="font-semibold">{user?.firstName} {user?.lastName}</span> - 
                Gérez et suivez l'utilisation complète de l'application Tontine Digitale
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{new Date().toLocaleDateString('fr-FR')}</p>
              <p className="text-gray-600">{new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium whitespace-nowrap text-lg transition-all ${
                  activeTab === tab.id
                    ? 'border-b-4 border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600 text-lg">Chargement du tableau de bord...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                <AdminStats stats={stats} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Quick Stats */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📌 Actions Rapides</h3>
                    <div className="space-y-3">
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition">
                        📊 Exporter les Rapports
                      </button>
                      <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition">
                        ✓ Activer les Utilisateurs
                      </button>
                      <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition">
                        🔄 Recalculer les Scores
                      </button>
                      <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition">
                        ⚙️ Paramètres Système
                      </button>
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">🏥 État du Système</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Services API', status: 'online', color: 'green' },
                        { name: 'Base de Données', status: 'online', color: 'green' },
                        { name: 'Cache', status: 'online', color: 'green' },
                        { name: 'Notifications', status: 'online', color: 'green' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 bg-${item.color}-500 rounded-full animate-pulse`}></div>
                            <span className={`text-${item.color}-600 font-semibold`}>{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fadeIn">
                <AdminUsersTable />
              </div>
            )}

            {/* Tontines Tab */}
            {activeTab === 'tontines' && (
              <div className="space-y-6 animate-fadeIn">
                <AdminTontinesTable />
              </div>
            )}

            {/* API Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6 animate-fadeIn">
                <AdminApiMonitor />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 Tontine Digitale - Tableau de Bord Admin | Version 1.0</p>
        </div>
      </footer>
    </div>
  );
}
