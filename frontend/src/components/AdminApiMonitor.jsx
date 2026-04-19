import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import Badge from './Badge';

export default function AdminApiMonitor() {
  const [apiRequests, setApiRequests] = useState([]);
  const [endpointStats, setEndpointStats] = useState({});

  // Simulated API requests monitoring
  useEffect(() => {
    // Mock data for demonstration
    const mockRequests = [
      { id: 1, endpoint: '/auth/register', method: 'POST', status: 200, timestamp: new Date().toLocaleTimeString(), duration: '45ms' },
      { id: 2, endpoint: '/tontines', method: 'GET', status: 200, timestamp: new Date().toLocaleTimeString(), duration: '32ms' },
      { id: 3, endpoint: '/scoring', method: 'GET', status: 200, timestamp: new Date().toLocaleTimeString(), duration: '28ms' },
      { id: 4, endpoint: '/auth/verify-otp', method: 'POST', status: 200, timestamp: new Date().toLocaleTimeString(), duration: '54ms' },
      { id: 5, endpoint: '/transactions/execute-full-cycle', method: 'POST', status: 200, timestamp: new Date().toLocaleTimeString(), duration: '128ms' }
    ];

    setApiRequests(mockRequests);

    // Calculate endpoint stats
    const stats = {};
    mockRequests.forEach(req => {
      if (!stats[req.endpoint]) {
        stats[req.endpoint] = { count: 0, avgTime: 0, errors: 0 };
      }
      stats[req.endpoint].count += 1;
    });
    setEndpointStats(stats);
  }, []);

  const getStatusBadgeColor = (status) => {
    if (status >= 200 && status < 300) return 'green';
    if (status >= 300 && status < 400) return 'yellow';
    return 'red';
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'blue',
      POST: 'green',
      PUT: 'yellow',
      DELETE: 'red'
    };
    return colors[method] || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Endpoint Statistics */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Statistiques des Endpoints</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(endpointStats).map(([endpoint, stats]) => (
              <div key={endpoint} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-mono text-gray-600 truncate">{endpoint}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{stats.count}</p>
                <p className="text-xs text-gray-500 mt-1">requêtes</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent API Requests */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🔄 Requêtes API Récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Endpoint</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Méthode</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Durée</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Heure</th>
                </tr>
              </thead>
              <tbody>
                {apiRequests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-blue-50 transition">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-gray-700">{req.endpoint}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getMethodColor(req.method)}>
                        {req.method}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getStatusBadgeColor(req.status)}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-700 font-semibold">{req.duration}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{req.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* API Health Status */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🏥 État des Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Auth Service', status: 'online', uptime: '99.9%' },
              { name: 'Tontine Service', status: 'online', uptime: '99.8%' },
              { name: 'Scoring Service', status: 'online', uptime: '99.9%' },
              { name: 'Transaction Service', status: 'online', uptime: '99.7%' }
            ].map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600">Uptime: {service.uptime}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <Badge variant="green">{service.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
