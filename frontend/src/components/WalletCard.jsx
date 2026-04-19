import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';
import { useWalletStore } from '../context/store';

export default function WalletCard() {
  const { balance, score, transactions } = useWalletStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Solde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Solde Wallet</span>
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{balance.toFixed(0)} MAD</p>
          <p className="text-sm text-gray-500 mt-2">Portefeuille actif</p>
        </CardContent>
      </Card>

      {/* Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Score Crédit</span>
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="text-green-600 w-6 h-6" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-1">
            <p className="text-3xl font-bold text-green-600">{score.toFixed(1)}</p>
            <p className="text-sm text-gray-500">/100</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Tontines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tontines</span>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="text-purple-600 w-6 h-6" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-600">2</p>
          <p className="text-sm text-gray-500 mt-2">Groupes actifs</p>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions</span>
            <div className="bg-orange-100 p-2 rounded-lg">
              <CheckCircle className="text-orange-600 w-6 h-6" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-600">{transactions.length}</p>
          <p className="text-sm text-gray-500 mt-2">Totales</p>
        </CardContent>
      </Card>
    </div>
  );
}
