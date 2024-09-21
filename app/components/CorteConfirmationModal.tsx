// components/CorteConfirmationModal.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

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
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Corte</DialogTitle>
          <DialogDescription>
            ¿Está seguro de que desea realizar el corte con los siguientes montos?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>Efectivo: ${parseFloat(cashAmount).toFixed(2)}</p>
          <p>Tarjeta: ${parseFloat(cardAmount).toFixed(2)}</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} disabled={isCorteLoading}>
              {isCorteLoading ? 'Procesando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CorteConfirmationModal;
