import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AppLoginProps {
  onLogin: (cpf: string) => void;
}

const AppLogin: React.FC<AppLoginProps> = ({ onLogin }) => {
  const [cpf, setCpf] = useState('');

  // Função para formatar CPF automaticamente
  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica formatação
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    } else if (limited.length <= 9) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    } else {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCPF(e.target.value);
    setCpf(formattedCpf);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove formatação para validação
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length === 11) {
      onLogin(cleanCpf);
    }
  };

  const isValidCpf = cpf.replace(/\D/g, '').length === 11;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f55a1e] to-[#d73919] flex flex-col">
      {/* Header igual ao do app */}
      <div className="bg-[#f55a1e] px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between text-white max-w-md mx-auto">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full mr-3 flex items-center justify-center">
              <i className="fas fa-shopping-bag text-[#f55a1e] text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold">Entregas Shopee</h1>
              <p className="text-xs opacity-90">Entregador Parceiro</p>
            </div>
          </div>
          <div className="text-white mr-3">
            <i className="fas fa-chevron-right text-3xl font-black" style={{color: 'white'}}></i>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          
          {/* Box de aviso laranja sobre notificações */}
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <i className="fas fa-bell text-orange-600 text-lg mt-1"></i>
              <div>
                <h4 className="font-bold text-orange-800 mb-2">Notificações Obrigatórias</h4>
                <p className="text-sm text-orange-700">
                  É obrigatório permitir as notificações do app para receber avisos importantes sobre suas entregas.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de login */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso ao Aplicativo</h2>
              <p className="text-sm text-gray-600">Digite seu CPF para acessar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF
                </label>
                <Input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full text-center text-lg tracking-wider"
                  maxLength={14}
                  style={{ fontSize: '16px' }} // Evita zoom no iOS
                />
              </div>

              <Button
                type="submit"
                disabled={!isValidCpf}
                className={`w-full py-3 text-white font-bold rounded-lg transition-all ${
                  isValidCpf 
                    ? 'bg-[#f55a1e] hover:bg-[#d73919] shadow-lg transform active:translate-y-0.5' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: isValidCpf ? "0 4px 0 0 #c23218" : "none"
                }}
              >
                Acessar
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Ao continuar, você concorda com nossos termos de uso
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLogin;