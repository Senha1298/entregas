import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useScrollTop } from '@/hooks/use-scroll-top';
import { Loader2 } from 'lucide-react';

const Compartilhar = () => {
  useScrollTop();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [pixKeyType, setPixKeyType] = useState<string>('cpf');
  const [pixKey, setPixKey] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleShare = () => {
    if (!pixKey.trim()) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Por favor, preencha sua chave PIX para receber as recompensas.",
        variant: "destructive",
      });
      return;
    }

    // Salvar chave PIX no localStorage
    localStorage.setItem('referral_pix_key', pixKey);
    localStorage.setItem('referral_pix_type', pixKeyType);

    // Mensagem para WhatsApp
    const message = `🚨 NOVIDADE URGENTE!
🚗 A Shopee está contratando novos entregadores!

Você tem carro, moto, van ou kombi? Então essa pode ser a sua chance de ouro!

💰 Ganhe até R$ 750 por dia, receba após a rota e trabalhe nos dias e horários que quiser.
📦 Renda extra simples, rápida e sem burocracia!

📍 Vagas abertas na sua região agora!
👉 Cadastre-se já: https://shopee.cadastrodoentregador.com

⏰ As vagas estão sendo preenchidas rápido — garanta a sua antes que acabe!`;

    // Usar esquema whatsapp:// para abrir diretamente a lista de contatos
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp - tenta primeiro o esquema whatsapp://, depois fallback para wa.me
    window.location.href = whatsappUrl;

    // Iniciar estado de aguardo
    setIsSharing(true);
    setTimeLeft(20);

    toast({
      title: "WhatsApp aberto!",
      description: "Selecione os contatos e envie o convite.",
    });
  };

  // Timer de 20 segundos
  useEffect(() => {
    if (isSharing && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSharing && timeLeft === 0) {
      setShowContinueButton(true);
    }
  }, [isSharing, timeLeft]);

  const handleContinue = () => {
    // Redirecionar para a página de entrega
    setLocation('/entrega');
  };

  // Determinar tipo de input baseado no tipo de chave PIX
  const getInputType = () => {
    if (pixKeyType === 'cpf' || pixKeyType === 'telefone') {
      return 'tel';
    }
    return 'text';
  };

  const getInputMode = () => {
    if (pixKeyType === 'cpf' || pixKeyType === 'telefone') {
      return 'numeric';
    }
    return 'text';
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      
      <div className="w-full bg-[#EE4E2E] py-1 px-6 flex items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 h-full rounded-l-full bg-[#E83D22]"></div>
        
        <div className="flex items-center relative z-10">
          <div className="text-white mr-3">
            <i className="fas fa-share-alt text-3xl font-black" style={{color: 'white'}}></i>
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold text-white mb-0">Compartilhar Convite</h1>
            <p className="text-white text-sm mt-0" style={{transform: 'translateY(-2px)'}}>Shopee</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Aviso Urgente */}
          <div className="bg-[#FFF5F0] border border-[#FFCDC1] p-6 mb-6" style={{ borderRadius: '2px' }}>
            <div className="text-center mb-4">
              <div className="text-[#EE4D2D] text-5xl mb-3">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-lg font-bold text-[#EE4D2D] mb-3 uppercase">
                PRECISAMOS DE ENTREGADORES NA SUA REGIÃO!
              </h2>
            </div>
            <p className="text-[#1F2933] font-medium mb-3 text-center">
              A Shopee está expandindo rapidamente e <strong>precisa urgentemente</strong> de entregadores na sua região!
            </p>
            <p className="text-[#737373] mb-4 text-center">
              Ajude seus amigos e conhecidos a conquistar uma <strong>renda extra de até R$ 750,00 por dia</strong> 
              e ainda ganhe uma recompensa por cada indicação!
            </p>
            <div className="bg-white p-4 border border-[#FFCDC1]" style={{ borderRadius: '2px' }}>
              <p className="text-[#1F2933] font-semibold text-center">
                📢 Compartilhe o convite com <strong className="text-[#EE4D2D]">5 amigos</strong> e continue seu cadastro!
              </p>
            </div>
          </div>

          {/* Box de Recompensa */}
          <div className="bg-[#FFECE5] border border-[#FFCDC1] p-6 mb-6" style={{ borderRadius: '2px' }}>
            <div className="text-center mb-4">
              <div className="inline-block bg-[#EE4D2D] text-white px-6 py-3 text-lg font-bold mb-3 uppercase" style={{ borderRadius: '2px' }}>
                GANHE R$ 50,00 POR INDICAÇÃO!
              </div>
            </div>
            
            <div className="space-y-3 text-[#1F2933]">
              <p className="text-center font-medium">
                <i className="fas fa-check-circle text-[#1FB57A] mr-2"></i>
                Para cada amigo que você indicar e que <strong>realizar o cadastro completo</strong>
              </p>
              <p className="text-center font-medium">
                <i className="fas fa-check-circle text-[#1FB57A] mr-2"></i>
                Quando sua indicação fizer a <strong>primeira entrega</strong>
              </p>
              <p className="text-center font-bold text-[#EE4D2D] text-lg mt-3">
                A Shopee depositará R$ 50,00 na sua chave PIX!
              </p>
            </div>

            <div className="mt-6 bg-white p-4 border border-[#D1D5DB]" style={{ borderRadius: '2px' }}>
              <h3 className="font-semibold text-[#1F2933] mb-4 text-center">
                📝 Cadastre sua Chave PIX para receber as recompensas:
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2933] mb-2">
                    Tipo de Chave PIX:
                  </label>
                  <Select value={pixKeyType} onValueChange={setPixKeyType}>
                    <SelectTrigger className="w-full" data-testid="select-pix-type" style={{ borderRadius: '2px' }}>
                      <SelectValue placeholder="Selecione o tipo de chave" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2933] mb-2">
                    Chave PIX:
                  </label>
                  <Input
                    type={getInputType()}
                    inputMode={getInputMode()}
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={
                      pixKeyType === 'cpf' ? '000.000.000-00' :
                      pixKeyType === 'telefone' ? '(00) 00000-0000' :
                      pixKeyType === 'email' ? 'seu@email.com' :
                      'cole-sua-chave-aqui'
                    }
                    className="w-full"
                    style={{ borderRadius: '2px' }}
                    data-testid="input-pix-key"
                    disabled={isSharing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Instruções */}
          {!showContinueButton && (
            <div className="bg-[#F5F5F5] border border-[#D1D5DB] p-5 mb-6" style={{ borderRadius: '2px' }}>
              <h3 className="font-bold text-[#1F2933] mb-3 uppercase">Como funciona:</h3>
              <ol className="text-[#737373] space-y-2 text-sm">
                <li>1️⃣ Clique no botão laranja abaixo</li>
                <li>2️⃣ Selecione <strong>pelo menos 5 contatos</strong> no WhatsApp</li>
                <li>3️⃣ Envie o convite para eles</li>
                <li>4️⃣ Retorne a esta página e clique no botão "Continuar Cadastro"</li>
              </ol>
            </div>
          )}

          {/* Botão de Compartilhar */}
          <div className="text-center space-y-4">
            {!isSharing ? (
              <Button
                onClick={handleShare}
                className="w-full bg-[#25D366] hover:bg-[#1EBE5C] text-white font-bold py-6 text-lg uppercase"
                style={{ borderRadius: '6px' }}
                data-testid="button-share-whatsapp"
              >
                <i className="fab fa-whatsapp text-2xl mr-3"></i>
                Compartilhar no WhatsApp
              </Button>
            ) : !showContinueButton ? (
              <Button
                disabled
                className="w-full bg-[#D1D5DB] text-white font-bold py-6 text-lg cursor-not-allowed uppercase"
                style={{ borderRadius: '2px' }}
                data-testid="button-waiting"
              >
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Aguardando... ({timeLeft}s)
              </Button>
            ) : (
              <Button
                disabled
                className="w-full bg-[#D1D5DB] text-white font-bold py-6 text-lg cursor-not-allowed uppercase"
                style={{ borderRadius: '2px' }}
                data-testid="button-shared"
              >
                <i className="fas fa-check-circle text-2xl mr-3"></i>
                Convite Compartilhado
              </Button>
            )}

            {/* Aviso sobre cadastro não finalizado */}
            <div className="bg-[#FFF5F0] border border-[#FFCDC1] p-5" style={{ borderRadius: '2px' }}>
              <div className="text-center mb-3">
                <i className="fas fa-exclamation-circle text-[#EE4D2D] text-4xl"></i>
              </div>
              <h3 className="font-bold text-[#EE4D2D] mb-3 text-center uppercase">Seu cadastro ainda não está finalizado!</h3>
              <p className="text-[#1F2933] text-sm mb-2 text-center">
                Para completar seu cadastro, você precisa:
              </p>
              <ul className="text-[#737373] text-sm space-y-1 mb-3">
                <li>✓ Confirmar seu endereço de entrega</li>
                <li>✓ Receber o <strong>Kit EPI</strong> (equipamentos de proteção)</li>
                <li>✓ Receber o <strong>Cartão Shopee</strong> para pagamentos</li>
              </ul>
              <p className="text-[#1F2933] text-sm font-semibold text-center">
                📌 Após compartilhar o convite pelo WhatsApp, volte a esta página e clique no botão "Continuar Cadastro" para prosseguir.
              </p>
            </div>

            {/* Botão Continuar Cadastro */}
            <Button
              onClick={handleContinue}
              disabled={!showContinueButton}
              className={`w-full font-bold py-6 text-lg uppercase transition-all ${
                showContinueButton 
                  ? 'bg-[#1FB57A] hover:bg-[#17A369] text-white cursor-pointer' 
                  : 'bg-[#D1D5DB] text-[#9CA3AF] cursor-not-allowed'
              }`}
              style={{ borderRadius: '2px' }}
              data-testid="button-continue"
            >
              {showContinueButton ? (
                <>
                  <i className="fas fa-arrow-right mr-3"></i>
                  Continuar Cadastro
                </>
              ) : (
                <>
                  <i className="fas fa-lock mr-3"></i>
                  Continuar Cadastro (bloqueado)
                </>
              )}
            </Button>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 bg-[#F5F5F5] p-5 border border-[#D1D5DB]" style={{ borderRadius: '2px' }}>
            <h4 className="font-semibold text-[#1F2933] mb-3 uppercase">
              <i className="fas fa-gift text-[#EE4D2D] mr-2"></i>
              Como receber suas recompensas:
            </h4>
            <ul className="text-[#737373] space-y-2 text-sm">
              <li className="flex items-start">
                <i className="fas fa-check text-[#1FB57A] mr-2 mt-1"></i>
                <span>Suas indicações precisam completar o cadastro e fazer a primeira entrega</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-[#1FB57A] mr-2 mt-1"></i>
                <span>O pagamento de R$ 50,00 é feito automaticamente após a primeira entrega confirmada</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-[#1FB57A] mr-2 mt-1"></i>
                <span>Não há limite de indicações - quanto mais amigos, mais você ganha!</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-[#1FB57A] mr-2 mt-1"></i>
                <span>O depósito é feito na chave PIX cadastrada acima em até 48h</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Compartilhar;
