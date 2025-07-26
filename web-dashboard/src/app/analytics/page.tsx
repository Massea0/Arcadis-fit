'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Clock,
  MapPin,
  Star,
  Activity,
  Target,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart,
  BarChart,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Bell,
  User,
  Building2,
  CreditCard,
  Clock3,
  CalendarDays,
  Target as TargetIcon,
  Award,
  Trophy,
  Medal,
  Crown,
  Flame,
  Heart,
  Dumbbell,
  Timer,
  Zap as ZapIcon
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    monthly: { month: string; amount: number }[];
    byGym: { gym: string; amount: number }[];
  };
  members: {
    total: number;
    active: number;
    new: number;
    churn: number;
    growth: { month: string; count: number }[];
    byType: { type: string; count: number }[];
  };
  attendance: {
    average: number;
    peakHours: { hour: string; count: number }[];
    byDay: { day: string; count: number }[];
    capacity: { gym: string; current: number; max: number }[];
  };
  performance: {
    satisfaction: number;
    retention: number;
    conversion: number;
    ratings: { gym: string; rating: number }[];
  };
}

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedGym, setSelectedGym] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockData: AnalyticsData = {
      revenue: {
        total: 8500000,
        change: 12.5,
        monthly: [
          { month: 'Jan', amount: 7200000 },
          { month: 'Fév', amount: 7800000 },
          { month: 'Mar', amount: 8200000 },
          { month: 'Avr', amount: 8500000 }
        ],
        byGym: [
          { gym: 'Fitness Club Dakar', amount: 2500000 },
          { gym: 'Gym Elite Almadies', amount: 1800000 },
          { gym: 'Sport Center Mermoz', amount: 1200000 },
          { gym: 'Wellness Hub Ouakam', amount: 2200000 }
        ]
      },
      members: {
        total: 546,
        active: 467,
        new: 45,
        churn: 8,
        growth: [
          { month: 'Jan', count: 480 },
          { month: 'Fév', count: 510 },
          { month: 'Mar', count: 530 },
          { month: 'Avr', count: 546 }
        ],
        byType: [
          { type: 'Basic', count: 180 },
          { type: 'Premium', count: 220 },
          { type: 'VIP', count: 100 },
          { type: 'Family', count: 46 }
        ]
      },
      attendance: {
        average: 78,
        peakHours: [
          { hour: '06:00', count: 45 },
          { hour: '07:00', count: 89 },
          { hour: '08:00', count: 67 },
          { hour: '17:00', count: 156 },
          { hour: '18:00', count: 234 },
          { hour: '19:00', count: 189 },
          { hour: '20:00', count: 123 },
          { hour: '21:00', count: 67 }
        ],
        byDay: [
          { day: 'Lun', count: 156 },
          { day: 'Mar', count: 189 },
          { day: 'Mer', count: 167 },
          { day: 'Jeu', count: 198 },
          { day: 'Ven', count: 234 },
          { day: 'Sam', count: 145 },
          { day: 'Dim', count: 89 }
        ],
        capacity: [
          { gym: 'Fitness Club Dakar', current: 156, max: 200 },
          { gym: 'Gym Elite Almadies', current: 134, max: 150 },
          { gym: 'Sport Center Mermoz', current: 89, max: 120 },
          { gym: 'Wellness Hub Ouakam', current: 167, max: 180 }
        ]
      },
      performance: {
        satisfaction: 4.7,
        retention: 92.5,
        conversion: 68.3,
        ratings: [
          { gym: 'Fitness Club Dakar', rating: 4.8 },
          { gym: 'Gym Elite Almadies', rating: 4.6 },
          { gym: 'Sport Center Mermoz', rating: 4.4 },
          { gym: 'Wellness Hub Ouakam', rating: 4.9 }
        ]
      }
    };

    setAnalyticsData(mockData);
    setLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-SN').format(num);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Analytics & Insights</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">3 derniers mois</option>
                <option value="1y">1 an</option>
              </select>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.revenue.total)}</p>
                <div className="flex items-center mt-1">
                  {analyticsData.revenue.change > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-xs font-medium ${analyticsData.revenue.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analyticsData.revenue.change)}% vs période précédente
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Membres Actifs</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.members.active)}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-600">
                    +{analyticsData.members.new} nouveaux ce mois
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de Rétention</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.performance.retention)}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-600">
                    +2.3% vs mois dernier
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.performance.satisfaction}/5</p>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600">
                    {analyticsData.performance.satisfaction * 20}% satisfaction
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Évolution des Revenus</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Voir détails
              </button>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analyticsData.revenue.monthly.map((item, index) => {
                const maxAmount = Math.max(...analyticsData.revenue.monthly.map(m => m.amount));
                const height = (item.amount / maxAmount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-2">{formatCurrency(item.amount)}</div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{item.month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Member Growth */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Croissance des Membres</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Voir détails
              </button>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analyticsData.members.growth.map((item, index) => {
                const maxCount = Math.max(...analyticsData.members.growth.map(m => m.count));
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-2">{formatNumber(item.count)}</div>
                    <div
                      className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-700 hover:to-green-500"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{item.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Gym Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance par Salle</h3>
            <div className="space-y-4">
              {analyticsData.performance.ratings.map((gym, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{gym.gym}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-600">{gym.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                        style={{ width: `${(gym.rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Heures de Pointe</h3>
            <div className="space-y-3">
              {analyticsData.attendance.peakHours.slice(0, 6).map((hour, index) => {
                const maxCount = Math.max(...analyticsData.attendance.peakHours.map(h => h.count));
                const width = (hour.count / maxCount) * 100;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-12 text-xs text-gray-600">{hour.hour}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-8 text-xs text-gray-600 text-right">{hour.count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Capacity Utilization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Utilisation des Capacités</h3>
            <div className="space-y-4">
              {analyticsData.attendance.capacity.map((gym, index) => {
                const utilization = (gym.current / gym.max) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{gym.gym}</span>
                      <span className="text-sm text-gray-600">{gym.current}/{gym.max}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${utilization}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600">{utilization.toFixed(1)}% d'occupation</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Insights & Recommandations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-green-900">Croissance Excellente</h4>
              </div>
              <p className="text-sm text-green-800">
                Votre taux de rétention de {formatPercentage(analyticsData.performance.retention)} est excellent. 
                Continuez à maintenir cette qualité de service.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-blue-900">Optimisation des Horaires</h4>
              </div>
              <p className="text-sm text-blue-800">
                Les heures de pointe sont entre 18h-19h. Considérez étendre les horaires 
                ou ajouter du personnel à ces créneaux.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900">Opportunités d'Amélioration</h4>
              </div>
              <p className="text-sm text-purple-800">
                Sport Center Mermoz a le taux de satisfaction le plus bas (4.4/5). 
                Planifiez une évaluation de la qualité de service.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-yellow-900">Expansion Recommandée</h4>
              </div>
              <p className="text-sm text-yellow-800">
                Wellness Hub Ouakam atteint 93% de capacité. Considérez l'expansion 
                ou l'ouverture d'une nouvelle salle dans cette zone.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-red-900">Attention Requise</h4>
              </div>
              <p className="text-sm text-red-800">
                Taux de conversion de {formatPercentage(analyticsData.performance.conversion)}. 
                Améliorez votre processus d'onboarding pour augmenter les conversions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900">Action Immédiate</h4>
              </div>
              <p className="text-sm text-indigo-800">
                {analyticsData.members.churn} membres ont quitté ce mois. 
                Implémentez un programme de fidélisation pour réduire le churn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;