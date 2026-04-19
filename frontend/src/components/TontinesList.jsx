import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Badge } from './Badge';
import { Users, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { tontineService } from '../services/api';

export default function TontinesList() {
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTontines();
  }, []);

  const fetchTontines = async () => {
    try {
      setLoading(true);
      const response = await tontineService.getTontines();
      setTontines(response.data.tontines || []);
    } catch (err) {
      setError('Erreur lors du chargement des tontines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      CREATED: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || variants.CREATED;
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Mes Tontines</span>
          <Badge variant="blue">{tontines.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {tontines.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune tontine trouvée</p>
          ) : (
            tontines.map((tontine) => (
              <div
                key={tontine.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-800">{tontine.name}</h4>
                      <Badge variant={getStatusBadge(tontine.status)}>
                        {tontine.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{tontine.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Contribution</p>
                        <p className="font-semibold text-blue-600">{tontine.contributionAmount} MAD</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>Participants</span>
                        </p>
                        <p className="font-semibold">{tontine.participants}/{tontine.expectedParticipants}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Cycle</span>
                        </p>
                        <p className="font-semibold">{tontine.currentCycle}/{tontine.duration}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition"
                          style={{ width: `${(tontine.participants / tontine.expectedParticipants) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="ml-4 p-2 hover:bg-blue-100 rounded-lg transition">
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition">
          + Créer une Tontine
        </button>
      </CardContent>
    </Card>
  );
}
