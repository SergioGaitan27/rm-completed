import React, { useEffect, useRef } from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

interface MobileConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: 'cash' | 'card';
  totalAmount: number;
  isLoading: boolean;
  customerName: string;
  onPaymentTypeChange: (type: 'cash' | 'card') => void;
  onCustomerNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
}

const MobileConfirmModal: React.FC<MobileConfirmModalProps> = ({
  isOpen,
  onClose,
  paymentType,
  totalAmount,
  isLoading,
  customerName,
  onPaymentTypeChange,
  onCustomerNameChange,
  onConfirm
}) => {
  const customerNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        customerNameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pedido</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col">
            <label htmlFor="customerName" className="mb-2">Nombre del Cliente:</label>
            <Input
              id="customerName"
              value={customerName}
              onChange={onCustomerNameChange}
              placeholder="Ingrese el nombre del cliente"
              ref={customerNameInputRef}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Total a pagar:</span>
            <span className="font-bold">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Método de pago:</span>
            <div className="space-x-2">
              <Button
                size="sm"
                variant={paymentType === 'cash' ? 'default' : 'outline'}
                onClick={() => onPaymentTypeChange('cash')}
              >
                Efectivo
              </Button>
              <Button
                size="sm"
                variant={paymentType === 'card' ? 'default' : 'outline'}
                onClick={() => onPaymentTypeChange('card')}
              >
                Tarjeta
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onConfirm} disabled={isLoading || !customerName.trim()}>
            {isLoading ? 'Procesando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileConfirmModal;