import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import Badge from './Badge';
import { Card } from './Card';

export default function AdminTontinesTable() {
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTontines();
  }, []);

  const fetchTontines = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllTontines();
      setTontines(response.data || response.data.tontines || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des tontines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    const statusMap = {
      CREATED: 'blue',
      ACTIVE: 'green',
      IN_PROGRESS: 'yellow',
      COMPLETED: 'green'
    };
    return statusMap[status] || 'gray';
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Chargement des tontines...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">💼 Tontines en Cours</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Responsable</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Participants</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant/Contribution</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cycle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {tontines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    Aucune tontine trouvée
                  </td>
                </tr>
              ) : (
                tontines.map((tontine) => (
                  <tr key={tontine.id} className="border-b border-gray-100 hover:bg-blue-50 transition">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900">{tontine.name}</p>
                      <p className="text-sm text-gray-500">{tontine.id}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {tontine.responsibleName || 'Admin'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {tontine.currentParticipants || 0}/{tontine.expectedParticipants || 0}
                        </span>
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div
                            className="h-full bg-blue-500 rounded"
                            style={{
                              width: `${((tontine.currentParticipants || 0) / (tontine.expectedParticipants || 1) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-green-600">
                          {tontine.totalAmount?.toFixed(0) || 0} MAD
                        </p>
                        <p className="text-sm text-gray-600">
                          {tontine.contributionAmount?.toFixed(0) || 0} MAD/pers
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {tontine.currentCycle || 1}/{tontine.totalCycles || 1}
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded">
                          <div
                            className="h-full bg-green-500 rounded"
                            style={{
                              width: `${((tontine.currentCycle || 1) / (tontine.totalCycles || 1) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getStatusVariant(tontine.status)}>
                        {tontine.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>Total: <span className="font-semibold">{tontines.length}</span> tontines</p>
        </div>
      </div>
    </Card>
  );
}
