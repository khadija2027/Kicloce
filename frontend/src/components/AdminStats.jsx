import React from 'react';
import { Card } from './Card';

export default function AdminStats({ stats }) {
  const statCards = [
    {
      title: 'Utilisateurs Actifs',
      value: stats.totalUsers || 0,
      icon: '👥',
      backgroundColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Tontines Actives',
      value: stats.activeTontines || 0,
      icon: '💼',
      backgroundColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Transactions',
      value: stats.totalTransactions || 0,
      icon: '📊',
      backgroundColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Volume Total',
      value: `${(stats.totalVolume || 0).toFixed(0)} MAD`,
      icon: '💰',
      backgroundColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Score Moyen',
      value: `${(stats.averageScore || 0).toFixed(1)}/100`,
      icon: '📈',
      backgroundColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={stat.backgroundColor}>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
