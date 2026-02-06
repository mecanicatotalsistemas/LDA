import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Search, Shield, Eye, Lock, Unlock, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { profile, isAdmin } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('error', 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!isAdmin) {
      showMessage('error', 'Apenas administradores podem bloquear/desbloquear usuários');
      return;
    }

    if (userId === profile?.id) {
      showMessage('error', 'Você não pode bloquear sua própria conta');
      return;
    }

    try {
      setActionLoading(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));

      showMessage('success', `Usuário ${!currentStatus ? 'desbloqueado' : 'bloqueado'} com sucesso`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      showMessage('error', 'Erro ao alterar status do usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
    if (!isAdmin) {
      showMessage('error', 'Apenas administradores podem alterar papéis');
      return;
    }

    if (userId === profile?.id) {
      showMessage('error', 'Você não pode alterar seu próprio papel');
      return;
    }

    try {
      setActionLoading(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      showMessage('success', 'Papel do usuário atualizado com sucesso');
    } catch (error) {
      console.error('Error updating user role:', error);
      showMessage('error', 'Erro ao atualizar papel do usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!isAdmin) {
      showMessage('error', 'Apenas administradores podem excluir usuários');
      return;
    }

    if (userId === profile?.id) {
      showMessage('error', 'Você não pode excluir sua própria conta');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
      showMessage('success', 'Usuário excluído com sucesso');
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('error', 'Erro ao excluir usuário');
    } finally {
      setActionLoading(null);
    }
  };

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

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-gray-600">
            Apenas administradores podem acessar o gerenciamento de usuários.
          </p>
        </div>
      </div>
    );
  }

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

      {message && (
        <div className={`rounded-lg p-4 flex items-start space-x-3 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </div>
      )}

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
              onClick={loadUsers}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Loader className="w-5 h-5" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all ${
                  user.is_active ? 'border-gray-200 hover:border-blue-400' : 'border-red-200 bg-red-50'
                }`}
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
                  {user.is_active ? (
                    <Unlock className="w-5 h-5 text-green-500" title="Ativo" />
                  ) : (
                    <Lock className="w-5 h-5 text-red-500" title="Bloqueado" />
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Papel:</span>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'user' | 'viewer')}
                      disabled={actionLoading === user.id || user.id === profile?.id}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="user">Usuário</option>
                      <option value="viewer">Visualizador</option>
                    </select>
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
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 font-semibold ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {user.is_active ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    disabled={actionLoading === user.id || user.id === profile?.id}
                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      user.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {actionLoading === user.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : user.is_active ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {user.is_active ? 'Bloquear' : 'Desbloquear'}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteUser(user.id, user.email)}
                    disabled={actionLoading === user.id || user.id === profile?.id}
                    className="flex items-center justify-center space-x-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-600">
              Ajuste os filtros para encontrar usuários
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
            <div className="text-sm text-red-600 font-medium mb-1">Usuários Bloqueados</div>
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
