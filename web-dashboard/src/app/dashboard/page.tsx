'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Activity, 
  Building2, 
  TrendingUp,
  Calendar,
  Clock,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Target,
  Zap,
  Eye,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Bell,
  User,
  LogOut
} from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'maintenance' | 'closed';
  capacity: number;
  currentMembers: number;
  revenue: number;
  rating: number;
  lastActivity: string;
  image: string;
}

interface DashboardStats {
  totalGyms: number;
  totalMembers: number;
  totalRevenue: number;
  activeMemberships: number;
  pendingPayments: number;
  averageRating: number;
}

const DashboardPage = () => {
  const [selectedGym, setSelectedGym] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalGyms: 0,
    totalMembers: 0,
    totalRevenue: 0,
    activeMemberships: 0,
    pendingPayments: 0,
    averageRating: 0
  });

  // Mock data - would come from API
  useEffect(() => {
    const mockGyms: Gym[] = [
      {
        id: '1',
        name: 'Fitness Club Dakar Centre',
        location: 'Dakar, Sénégal',
        status: 'active',
        capacity: 200,
        currentMembers: 156,
        revenue: 2500000,
        rating: 4.8,
        lastActivity: '2 min ago',
        image: '/api/placeholder/300/200'
      },
      {
        id: '2',
        name: 'Gym Elite Almadies',
        location: 'Almadies, Dakar',
        status: 'active',
        capacity: 150,
        currentMembers: 134,
        revenue: 1800000,
        rating: 4.6,
        lastActivity: '5 min ago',
        image: '/api/placeholder/300/200'
      },
      {
        id: '3',
        name: 'Sport Center Mermoz',
        location: 'Mermoz, Dakar',
        status: 'maintenance',
        capacity: 120,
        currentMembers: 89,
        revenue: 1200000,
        rating: 4.4,
        lastActivity: '1 hour ago',
        image: '/api/placeholder/300/200'
      },
      {
        id: '4',
        name: 'Wellness Hub Ouakam',
        location: 'Ouakam, Dakar',
        status: 'active',
        capacity: 180,
        currentMembers: 167,
        revenue: 2200000,
        rating: 4.9,
        lastActivity: '30 sec ago',
        image: '/api/placeholder/300/200'
      }
    ];

    setGyms(mockGyms);
    
    // Calculate stats
    const totalRevenue = mockGyms.reduce((sum, gym) => sum + gym.revenue, 0);
    const totalMembers = mockGyms.reduce((sum, gym) => sum + gym.currentMembers, 0);
    const averageRating = mockGyms.reduce((sum, gym) => sum + gym.rating, 0) / mockGyms.length;
    
    setStats({
      totalGyms: mockGyms.length,
      totalMembers,
      totalRevenue,
      activeMemberships: totalMembers,
      pendingPayments: 15,
      averageRating: Math.round(averageRating * 10) / 10
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'maintenance': return <AlertCircle className="w-4 h-4" />;
      case 'closed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Arcadis Fit Pro</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-500">
                <span>Dashboard</span>
                <span>•</span>
                <span>Multi-Gym Management</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Salles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGyms}</p>
                <p className="text-xs text-green-600 mt-1">+2 ce mois</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Membres Actifs</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalMembers)}</p>
                <p className="text-xs text-green-600 mt-1">+12% vs mois dernier</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-green-600 mt-1">+8% vs mois dernier</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}/5</p>
                <p className="text-xs text-green-600 mt-1">+0.2 vs mois dernier</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Actions Rapides</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Voir tout
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Plus className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Nouvelle Salle</span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors">
              <Users className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Ajouter Membre</span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <CreditCard className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Nouveau Paiement</span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <BarChart3 className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Générer Rapport</span>
            </button>
          </div>
        </div>

        {/* Gyms Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mes Salles de Sport</h2>
              <p className="text-sm text-gray-600">Gérez toutes vos salles depuis un seul endroit</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une salle..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gyms.map((gym) => (
              <div
                key={gym.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedGym(gym.id)}
              >
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-white opacity-20" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gym.status)}`}>
                      {getStatusIcon(gym.status)}
                      <span className="ml-1 capitalize">{gym.status}</span>
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center space-x-1 text-white">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{gym.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{gym.name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {gym.location}
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{gym.currentMembers}</p>
                      <p className="text-xs text-gray-500">Membres</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{gym.capacity}</p>
                      <p className="text-xs text-gray-500">Capacité</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Occupation</span>
                      <span className="text-gray-900 font-medium">
                        {Math.round((gym.currentMembers / gym.capacity) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(gym.currentMembers / gym.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(gym.revenue)}</p>
                      <p className="text-xs text-gray-500">Revenus mensuels</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Dernière activité</p>
                      <p className="text-xs font-medium text-gray-900">{gym.lastActivity}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Gérer
                      </button>
                      <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Activité Récente</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {[
              { id: 1, type: 'member', message: 'Nouveau membre inscrit à Fitness Club Dakar', time: '2 min ago', icon: Users },
              { id: 2, type: 'payment', message: 'Paiement reçu de 25,000 XOF', time: '5 min ago', icon: CreditCard },
              { id: 3, type: 'maintenance', message: 'Maintenance planifiée pour Sport Center Mermoz', time: '1 hour ago', icon: Settings },
              { id: 4, type: 'rating', message: 'Nouvelle note 5 étoiles pour Wellness Hub Ouakam', time: '2 hours ago', icon: Star }
            ].map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <activity.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;