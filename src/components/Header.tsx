import React from 'react';
import { Activity } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b-4 border-blue-500">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/LOGO.jpg" 
                alt="Mecânica Total" 
                className="h-12 w-auto"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.classList.remove('hidden');
                  }
                }}
              />
              <Activity className="h-12 w-12 text-blue-600 hidden" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Life Data Analysis
              </h1>
              <p className="text-gray-600 text-sm">
                Ferramenta de Análise de Confiabilidade
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 font-medium">
              Desenvolvido por <span className="text-blue-600 font-bold">Mecânica Total®</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;