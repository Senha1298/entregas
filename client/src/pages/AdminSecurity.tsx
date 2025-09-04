import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useScrollTop } from '@/hooks/use-scroll-top';

interface SecurityConfig {
  redirect_enabled: boolean;
  target_url: string;
  legitimate_domain: string;
  pushcut_url: string;
  audit_mode: boolean;
}

const AdminSecurity: React.FC = () => {
  useScrollTop();
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [config, setConfig] = useState<SecurityConfig>({
    redirect_enabled: false,
    target_url: '/entrega',
    legitimate_domain: 'https://shopee.cadastrodoentregador.com',
    pushcut_url: 'https://api.pushcut.io/CwRJR0BYsyJYezzN-no_e/notifications/Site%20clonado%20',
    audit_mode: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar configuração atual
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/security-config');
      const data = await response.json();
      
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração atual",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/admin/security-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sucesso!",
          description: "Configuração de segurança atualizada com sucesso",
        });
      } else {
        throw new Error(data.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConfiguration = async () => {
    try {
      const response = await fetch('/api/security-config');
      const data = await response.json();
      
      toast({
        title: "Teste realizado",
        description: `Redirecionamento: ${data.redirect_enabled ? 'ATIVO' : 'INATIVO'}. URL: ${data.target_url}`,
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a configuração",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E83D22] mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      
      <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
        
        <div className="flex items-center relative z-10">
          <div className="text-white mr-3">
            <i className="fas fa-shield-alt text-3xl font-black" style={{color: 'white'}}></i>
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Painel de Segurança</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Sistema Anti-Clone</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Status do Sistema */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22] flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                Status do Sistema
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Detecção de Clone</h4>
                  <p className="text-sm text-blue-700">
                    <i className="fas fa-check-circle mr-1"></i>
                    Ativa e funcionando
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg border ${config.redirect_enabled ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                  <h4 className={`font-medium mb-2 ${config.redirect_enabled ? 'text-orange-800' : 'text-green-800'}`}>
                    Redirecionamento
                  </h4>
                  <p className={`text-sm ${config.redirect_enabled ? 'text-orange-700' : 'text-green-700'}`}>
                    <i className={`fas ${config.redirect_enabled ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-1`}></i>
                    {config.redirect_enabled ? 'ATIVO' : 'Desabilitado'}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">Notificações</h4>
                  <p className="text-sm text-purple-700">
                    <i className="fas fa-bell mr-1"></i>
                    Via Pushcut
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Configurações Principais */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22] flex items-center">
                <i className="fas fa-cogs mr-2"></i>
                Configurações Principais
              </h3>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Ativar Redirecionamento */}
              <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Checkbox
                  id="redirect_enabled"
                  checked={config.redirect_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({...config, redirect_enabled: checked as boolean})
                  }
                />
                <div>
                  <label htmlFor="redirect_enabled" className="text-sm font-medium text-yellow-800">
                    Ativar Redirecionamento em Sites Clonados
                  </label>
                  <p className="text-xs text-yellow-700 mt-1">
                    Quando ativo, usuários em sites clonados serão redirecionados para sua URL
                  </p>
                </div>
              </div>

              {/* URL de Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Destino para Redirecionamento
                </label>
                <Input
                  value={config.target_url}
                  onChange={(e) => setConfig({...config, target_url: e.target.value})}
                  placeholder="https://seu-site-original.com ou /entrega"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use uma URL completa (com https://) ou um caminho interno como /entrega
                </p>
              </div>

              {/* Domínio Legítimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domínio Legítimo (seu site oficial)
                </label>
                <Input
                  value={config.legitimate_domain}
                  onChange={(e) => setConfig({...config, legitimate_domain: e.target.value})}
                  placeholder="https://shopee.cadastrodoentregador.com"
                  className="w-full"
                />
              </div>

              {/* URL do Pushcut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Notificação (Pushcut)
                </label>
                <Input
                  value={config.pushcut_url}
                  onChange={(e) => setConfig({...config, pushcut_url: e.target.value})}
                  placeholder="https://api.pushcut.io/..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL para receber notificações quando sites clonados forem detectados
                </p>
              </div>

              {/* Modo Auditoria */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="audit_mode"
                  checked={config.audit_mode}
                  onCheckedChange={(checked) => 
                    setConfig({...config, audit_mode: checked as boolean})
                  }
                />
                <label htmlFor="audit_mode" className="text-sm text-gray-700">
                  Modo Auditoria (logs detalhados no console)
                </label>
              </div>
            </div>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="flex-1 bg-[#E83D22] hover:bg-[#d73920] text-white"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Salvar Configurações
                </>
              )}
            </Button>
            
            <Button
              onClick={testConfiguration}
              variant="outline"
              className="flex-1 border-[#E83D22] text-[#E83D22] hover:bg-[#E83D22] hover:text-white"
            >
              <i className="fas fa-test-tube mr-2"></i>
              Testar Configuração
            </Button>
          </div>

          {/* Instruções */}
          <Card className="mt-6 overflow-hidden">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22] flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                Como Usar
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">🔍 Detecção Automática</h4>
                  <p>O sistema monitora automaticamente todos os acessos e detecta quando o site é acessado de um domínio diferente do legítimo.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">🚨 Notificações Instantâneas</h4>
                  <p>Quando um clone é detectado, você recebe uma notificação imediata via Pushcut com detalhes do domínio clonado.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">🎯 Redirecionamento Controlado</h4>
                  <p>Active o redirecionamento para enviar automaticamente usuários de sites clonados para seu site original. O clonador não percebe que isso está acontecendo.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">⚡ Funcionamento Discreto</h4>
                  <p>Todo o sistema funciona de forma transparente. Para o clonador, o código parece apenas uma "verificação de segurança" normal.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminSecurity;