import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Search, Shield, Eye } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'viewer';
  company: string;
  phone: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const mockUsers: UserProfile[] = [
    {
      id: '1',
      email: 'admin@empresa.com',
      full_name: 'João Silva',
      role: 'admin',
      company: 'Empresa XYZ',
      phone: '(11) 98765-4321',
      is_active: true,
      last_login: '2024-02-06T10:30:00Z',
      created_at: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      email: 'maria@empresa.com',
      full_name: 'Maria Santos',
      role: 'user',
      company: 'Empresa ABC',
      phone: '(11) 91234-5678',
      is_active: true,
      last_login: '2024-02-05T15:45:00Z',
      created_at: '2024-01-20T09:30:00Z'
    },
    {
      id: '3',
      email: 'carlos@empresa.com',
      full_name: 'Carlos Oliveira',
      role: 'viewer',
      company: 'Empresa XYZ',
      phone: '(11) 99876-5432',
      is_active: false,
      last_login: '2024-01-30T11:20:00Z',
      created_at: '2024-01-10T14:00:00Z'
    }
  ];

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Shield, label: 'Admin' },
      user: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Users, label: 'Usuário' },
      viewer: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Eye, label: 'Visualizador' }
    };

    const config = roleConfig[role as keyof typeof roleConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gerenciamento de Usuários</h2>
            <p className="text-blue-100">Controle completo de acesso e permissões</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <Users className="w-12 h-12" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os papéis</option>
              <option value="admin">Admin</option>
              <option value="user">Usuário</option>
              <option value="viewer">Visualizador</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <UserPlus className="w-5 h-5" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{user.full_name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Papel:</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Empresa:</span> {user.company || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Telefone:</span> {user.phone || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Último acesso:</span>
                  <div className="text-xs mt-1">{formatDate(user.last_login)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEditingUser(user)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Editar</span>
                </button>
                <button
                  className="flex-1 flex items-center justify-center space-x-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-600">
              Ajuste os filtros ou adicione um novo usuário
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Estatísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">Total de Usuários</div>
            <div className="text-3xl font-bold text-blue-900">{users.length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">Administradores</div>
            <div className="text-3xl font-bold text-purple-900">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Usuários Ativos</div>
            <div className="text-3xl font-bold text-green-900">
              {users.filter(u => u.is_active).length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium mb-1">Usuários Inativos</div>
            <div className="text-3xl font-bold text-red-900">
              {users.filter(u => !u.is_active).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
