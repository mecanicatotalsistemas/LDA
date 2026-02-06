import React from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FooterProps {
  onNavigateToUsers?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToUsers }) => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
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

        {isAdmin && onNavigateToUsers && (
          <div className="text-center mt-4">
            <button
              onClick={onNavigateToUsers}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              <Users className="w-5 h-5" />
              <span>Gerenciar Usuários</span>
            </button>
          </div>
        )}

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