import React from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FooterProps {
  onNavigateToUsers?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToUsers }) => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Debug logs
  console.log('Footer - Profile:', profile);
  console.log('Footer - isAdmin:', isAdmin);
  console.log('Footer - onNavigateToUsers:', onNavigateToUsers);

  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        {/* Botão de Admin no topo - Mais visível */}
        {isAdmin && onNavigateToUsers && (
          <div className="text-center mb-6">
            <button
              onClick={onNavigateToUsers}
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors font-bold shadow-lg text-lg"
            >
              <Users className="w-6 h-6" />
              <span>GERENCIAR USUÁRIOS (ADMIN)</span>
            </button>
          </div>
        )}

        {/* Debug visual - remover depois */}
        <div className="text-center mb-4 text-xs text-gray-500">
          Debug: Role = {profile?.role || 'null'} | Email = {profile?.email || 'null'}
        </div>

        <div className="flex items-center justify-center space-x-4">
          <img
            src="/LOGO.jpg"
            alt="Mecânica Total"
            className="h-8 w-auto opacity-80"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <p className="text-center text-gray-300">
            © 2025 - Desenvolvido por <span className="text-blue-400 font-bold">Mecânica Total®</span>
          </p>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Ferramenta de Life Data Analysis - Análise de Confiabilidade de Ativos
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;