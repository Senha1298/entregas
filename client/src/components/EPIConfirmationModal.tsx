import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface EPIConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const EPIConfirmationModal: React.FC<EPIConfirmationModalProps> = ({
  isOpen,
  onOpenChange,
  onConfirm
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-md w-full" hideCloseButton>
        <div className="bg-white rounded-md shadow-2xl p-8 w-full relative">
          <div className="absolute top-0 left-0 w-full bg-[#EF4B28]/20 text-[#EF4B28] text-2sm font-medium p-4 rounded-t-md">
            Pagamento Obrigatório
          </div>
          <h1 className="text-xl font-bold mb-4 mt-48">Leia com atenção:</h1>
          <p className="text-gray-800 mb-6 text-sm">Ao clicar no botão abaixo você deverá realizar o pagamento da Taxa de Entrega do cartão de pagamento e do kit EPI. Após o pagamento aguarde na página para finalizar o processo.</p>
          <button 
            className="bg-[#EF4B28] hover:bg-[#EF4B28]/90 text-white font-bold py-2 px-4 rounded-md w-full transition-colors duration-200"
            onClick={onConfirm}
          >
            Pagar taxa de Entrega
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EPIConfirmationModal;