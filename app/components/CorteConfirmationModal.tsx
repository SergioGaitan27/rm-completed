import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

interface CorteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashAmount: string;
  cardAmount: string;
  isCorteLoading: boolean;
  onConfirm: () => void;
}

const CorteConfirmationModal: React.FC<CorteConfirmationModalProps> = ({
  isOpen,
  onClose,
  cashAmount,
  cardAmount,
  isCorteLoading,
  onConfirm
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Corte</DialogTitle>
        </DialogHeader>
        <p>¿Está seguro de que desea realizar el corte con los siguientes montos?</p>
        <p>Efectivo: ${parseFloat(cashAmount).toFixed(2)}</p>
        <p>Tarjeta: ${parseFloat(cardAmount).toFixed(2)}</p>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={onConfirm} disabled={isCorteLoading}>
            {isCorteLoading ? 'Procesando...' : 'Confirmar Corte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CorteConfirmationModal;