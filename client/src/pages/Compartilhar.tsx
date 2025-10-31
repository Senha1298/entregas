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
    const message = `🚗 *SHOPEE ESTÁ CONTRATANDO ENTREGADORES!* 🚗

🔥 *OPORTUNIDADE URGENTE!*

A Shopee está buscando entregadores de:
✅ Carro
✅ Moto
✅ Kombi
✅ Van

💰 *GANHE ATÉ R$ 750,00 POR DIA* como renda extra!

📍 Vagas disponíveis na sua região AGORA!

👉 Cadastre-se já: www.entrar.inc

⏰ Não perca essa chance!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

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
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-[#EE4E2E] rounded-lg p-6 mb-6 shadow-lg">
            <div className="flex items-start">
              <div className="text-[#EE4E2E] mr-4 text-4xl">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#EE4E2E] mb-3">
                  🚨 PRECISAMOS DE ENTREGADORES NA SUA REGIÃO!
                </h2>
                <p className="text-gray-800 font-medium mb-3">
                  A Shopee está expandindo rapidamente e <strong>precisa urgentemente</strong> de entregadores na sua região!
                </p>
                <p className="text-gray-700 mb-4">
                  Ajude seus amigos e conhecidos a conquistar uma <strong>renda extra de até R$ 750,00 por dia</strong> 
                  e ainda ganhe uma recompensa por cada indicação!
                </p>
                <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                  <p className="text-gray-800 font-semibold text-center">
                    📢 Compartilhe o convite com <strong className="text-[#EE4E2E]">5 amigos</strong> e continue seu cadastro!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Box de Recompensa */}
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6 shadow-md">
            <div className="text-center mb-4">
              <div className="inline-block bg-green-500 text-white px-6 py-3 rounded-full text-2xl font-bold mb-3">
                💰 GANHE R$ 50,00 POR INDICAÇÃO!
              </div>
            </div>
            
            <div className="space-y-3 text-gray-800">
              <p className="text-center font-medium">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                Para cada amigo que você indicar e que <strong>realizar o cadastro completo</strong>
              </p>
              <p className="text-center font-medium">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                Quando sua indicação fizer a <strong>primeira entrega</strong>
              </p>
              <p className="text-center font-bold text-green-700 text-lg mt-3">
                A Shopee depositará R$ 50,00 na sua chave PIX!
              </p>
            </div>

            <div className="mt-6 bg-white rounded-lg p-4 border border-green-300">
              <h3 className="font-semibold text-gray-800 mb-4 text-center">
                📝 Cadastre sua Chave PIX para receber as recompensas:
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Chave PIX:
                  </label>
                  <Select value={pixKeyType} onValueChange={setPixKeyType}>
                    <SelectTrigger className="w-full" data-testid="select-pix-type">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    data-testid="input-pix-key"
                    disabled={isSharing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Instruções e Botão de Compartilhar */}
          {!showContinueButton && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 mb-6">
              <div className="flex items-start mb-4">
                <i className="fas fa-info-circle text-blue-600 text-2xl mr-3 mt-1"></i>
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Como funciona:</h3>
                  <ol className="text-blue-800 space-y-2 text-sm">
                    <li>1️⃣ Clique no botão verde abaixo</li>
                    <li>2️⃣ Selecione <strong>pelo menos 5 contatos</strong> no WhatsApp</li>
                    <li>3️⃣ Envie o convite para eles</li>
                    <li>4️⃣ Retorne a esta página para continuar seu cadastro</li>
                  </ol>
                </div>
              </div>
              
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mt-3">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ <strong>Importante:</strong> Após enviar o convite pelo WhatsApp, retorne a esta página 
                  e aguarde para clicar no botão "Continuar Cadastro"
                </p>
              </div>
            </div>
          )}

          {/* Botão de Compartilhar */}
          <div className="text-center">
            {!isSharing ? (
              <Button
                onClick={handleShare}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-lg rounded-lg shadow-lg transform transition-all hover:scale-105"
                data-testid="button-share-whatsapp"
              >
                <i className="fab fa-whatsapp text-2xl mr-3"></i>
                Compartilhar no WhatsApp Agora
              </Button>
            ) : !showContinueButton ? (
              <Button
                disabled
                className="w-full bg-gray-400 text-white font-bold py-6 text-lg rounded-lg cursor-not-allowed"
                data-testid="button-waiting"
              >
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Aguardando... ({timeLeft}s)
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-3">
                    <i className="fas fa-check-circle text-green-600 text-5xl"></i>
                  </div>
                  <p className="text-green-800 font-bold text-lg text-center mb-2">
                    ✅ Já compartilhou o convite?
                  </p>
                  <p className="text-green-700 text-center">
                    Clique no botão abaixo para continuar seu cadastro
                  </p>
                </div>
                
                <Button
                  onClick={handleContinue}
                  className="w-full bg-[#EE4E2E] hover:bg-[#D73621] text-white font-bold py-6 text-lg rounded-lg shadow-lg"
                  data-testid="button-continue"
                >
                  Continuar Cadastro
                  <i className="fas fa-arrow-right ml-3"></i>
                </Button>
              </div>
            )}
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <i className="fas fa-gift text-orange-500 mr-2"></i>
              Como receber suas recompensas:
            </h4>
            <ul className="text-gray-700 space-y-2 text-sm">
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                <span>Suas indicações precisam completar o cadastro e fazer a primeira entrega</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                <span>O pagamento de R$ 50,00 é feito automaticamente após a primeira entrega confirmada</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                <span>Não há limite de indicações - quanto mais amigos, mais você ganha!</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
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
