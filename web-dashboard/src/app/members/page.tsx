'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  Activity,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  UserPlus,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Camera,
  QrCode,
  Shield,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';

interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gymId: string;
  gymName: string;
  membershipType: 'basic' | 'premium' | 'vip' | 'family';
  status: 'active' | 'expired' | 'suspended' | 'pending';
  joinDate: string;
  expiryDate: string;
  lastVisit: string;
  totalVisits: number;
  totalSpent: number;
  rating: number;
  profilePicture: string;
  emergencyContact: string;
  fitnessGoals: string[];
  preferredWorkoutTime: string;
  membershipNumber: string;
  qrCode: string;
}

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGym, setSelectedGym] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMembershipType, setSelectedMembershipType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Mock data
  useEffect(() => {
    const mockMembers: Member[] = [
      {
        id: '1',
        fullName: 'Fatou Diop',
        email: 'fatou.diop@email.com',
        phone: '+221 77 123 45 67',
        gymId: '1',
        gymName: 'Fitness Club Dakar Centre',
        membershipType: 'premium',
        status: 'active',
        joinDate: '2024-01-15',
        expiryDate: '2024-12-15',
        lastVisit: '2024-01-20',
        totalVisits: 45,
        totalSpent: 125000,
        rating: 4.8,
        profilePicture: '/api/placeholder/100/100',
        emergencyContact: '+221 77 987 65 43',
        fitnessGoals: ['Perte de poids', 'Tonification'],
        preferredWorkoutTime: '18:00',
        membershipNumber: 'M001234',
        qrCode: 'qr-code-1'
      },
      {
        id: '2',
        fullName: 'Moussa Sall',
        email: 'moussa.sall@email.com',
        phone: '+221 76 234 56 78',
        gymId: '2',
        gymName: 'Gym Elite Almadies',
        membershipType: 'vip',
        status: 'active',
        joinDate: '2023-11-10',
        expiryDate: '2024-11-10',
        lastVisit: '2024-01-19',
        totalVisits: 89,
        totalSpent: 250000,
        rating: 4.9,
        profilePicture: '/api/placeholder/100/100',
        emergencyContact: '+221 76 876 54 32',
        fitnessGoals: ['Musculation', 'Performance'],
        preferredWorkoutTime: '07:00',
        membershipNumber: 'M002345',
        qrCode: 'qr-code-2'
      },
      {
        id: '3',
        fullName: 'Aissatou Ba',
        email: 'aissatou.ba@email.com',
        phone: '+221 78 345 67 89',
        gymId: '3',
        gymName: 'Sport Center Mermoz',
        membershipType: 'basic',
        status: 'expired',
        joinDate: '2023-08-20',
        expiryDate: '2024-01-20',
        lastVisit: '2024-01-15',
        totalVisits: 23,
        totalSpent: 75000,
        rating: 4.2,
        profilePicture: '/api/placeholder/100/100',
        emergencyContact: '+221 78 765 43 21',
        fitnessGoals: ['Santé générale'],
        preferredWorkoutTime: '19:00',
        membershipNumber: 'M003456',
        qrCode: 'qr-code-3'
      },
      {
        id: '4',
        fullName: 'Omar Diallo',
        email: 'omar.diallo@email.com',
        phone: '+221 77 456 78 90',
        gymId: '4',
        gymName: 'Wellness Hub Ouakam',
        membershipType: 'family',
        status: 'active',
        joinDate: '2024-01-01',
        expiryDate: '2024-12-31',
        lastVisit: '2024-01-20',
        totalVisits: 12,
        totalSpent: 180000,
        rating: 4.7,
        profilePicture: '/api/placeholder/100/100',
        emergencyContact: '+221 77 654 32 10',
        fitnessGoals: ['Endurance', 'Flexibilité'],
        preferredWorkoutTime: '17:00',
        membershipNumber: 'M004567',
        qrCode: 'qr-code-4'
      }
    ];

    setMembers(mockMembers);
    setFilteredMembers(mockMembers);
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = members;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm) ||
        member.membershipNumber.includes(searchTerm)
      );
    }

    // Gym filter
    if (selectedGym !== 'all') {
      filtered = filtered.filter(member => member.gymId === selectedGym);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(member => member.status === selectedStatus);
    }

    // Membership type filter
    if (selectedMembershipType !== 'all') {
      filtered = filtered.filter(member => member.membershipType === selectedMembershipType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'joinDate':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'lastVisit':
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        case 'totalVisits':
          return b.totalVisits - a.totalVisits;
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        default:
          return 0;
      }
    });

    setFilteredMembers(filtered);
  }, [members, searchTerm, selectedGym, selectedStatus, selectedMembershipType, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'family': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-SN');
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Gestion des Membres</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <UserPlus className="w-4 h-4" />
                <span>Nouveau Membre</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Membres</p>
                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                <p className="text-xs text-green-600 mt-1">+5 ce mois</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Membres Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.status === 'active').length}
                </p>
                <p className="text-xs text-green-600 mt-1">85% du total</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expirations Proches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => getDaysUntilExpiry(m.expiryDate) <= 30 && getDaysUntilExpiry(m.expiryDate) > 0).length}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Dans 30 jours</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Mensuels</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(members.reduce((sum, m) => sum + m.totalSpent, 0))}
                </p>
                <p className="text-xs text-green-600 mt-1">+12% vs mois dernier</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedGym}
              onChange={(e) => setSelectedGym(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les salles</option>
              <option value="1">Fitness Club Dakar Centre</option>
              <option value="2">Gym Elite Almadies</option>
              <option value="3">Sport Center Mermoz</option>
              <option value="4">Wellness Hub Ouakam</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="expired">Expiré</option>
              <option value="suspended">Suspendu</option>
              <option value="pending">En attente</option>
            </select>

            <select
              value={selectedMembershipType}
              onChange={(e) => setSelectedMembershipType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="basic">Basique</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
              <option value="family">Famille</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Trier par nom</option>
              <option value="joinDate">Trier par date d'inscription</option>
              <option value="lastVisit">Trier par dernière visite</option>
              <option value="totalVisits">Trier par nombre de visites</option>
              <option value="totalSpent">Trier par dépenses</option>
            </select>
          </div>
        </div>

        {/* Members Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Membres ({filteredMembers.length})
              </h2>
              <p className="text-sm text-gray-600">Gérez tous vos membres en un seul endroit</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="grid grid-cols-2 gap-1 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="space-y-1 w-4 h-4">
                  <div className="bg-current rounded-sm h-0.5"></div>
                  <div className="bg-current rounded-sm h-0.5"></div>
                  <div className="bg-current rounded-sm h-0.5"></div>
                </div>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedMember(member);
                    setShowMemberModal(true);
                  }}
                >
                  <div className="relative">
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {member.status}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center space-x-1 text-white">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">{member.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.fullName}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {member.gymName}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMembershipTypeColor(member.membershipType)}`}>
                          {member.membershipType.toUpperCase()}
                        </span>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{member.totalVisits}</p>
                        <p className="text-xs text-gray-500">Visites</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(member.totalSpent)}</p>
                        <p className="text-xs text-gray-500">Total dépensé</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {member.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {member.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Membre depuis {formatDate(member.joinDate)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Expire le</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(member.expiryDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Dernière visite</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(member.lastVisit)}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Voir profil
                        </button>
                        <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          Renouveler
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Membre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière visite
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expire le
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.gymName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMembershipTypeColor(member.membershipType)}`}>
                          {member.membershipType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.totalVisits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.lastVisit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(member.expiryDate)}</div>
                        <div className="text-xs text-gray-500">
                          {getDaysUntilExpiry(member.expiryDate) > 0 
                            ? `${getDaysUntilExpiry(member.expiryDate)} jours restants`
                            : 'Expiré'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profil du Membre</h2>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Member Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedMember.fullName}</h3>
                    <p className="text-gray-600">{selectedMember.email}</p>
                    <p className="text-gray-600">{selectedMember.phone}</p>
                  </div>
                </div>

                {/* Membership Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Informations d'adhésion</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Numéro:</span>
                        <span className="font-medium">{selectedMember.membershipNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMembershipTypeColor(selectedMember.membershipType)}`}>
                          {selectedMember.membershipType.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMember.status)}`}>
                          {selectedMember.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Statistiques</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total visites:</span>
                        <span className="font-medium">{selectedMember.totalVisits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total dépensé:</span>
                        <span className="font-medium">{formatCurrency(selectedMember.totalSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Note:</span>
                        <span className="font-medium">{selectedMember.rating}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Modifier le profil
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    Renouveler l'adhésion
                  </button>
                  <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                    Voir l'historique
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;