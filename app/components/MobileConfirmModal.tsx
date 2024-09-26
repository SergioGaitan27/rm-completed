import React from 'react';
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
  amountPaid: string;
  change: number;
  totalAmount: number;
  isLoading: boolean;
  onPaymentTypeChange: (type: 'cash' | 'card') => void;
  onAmountPaidChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPayment: () => void;
}

const MobileConfirmModal: React.FC<MobileConfirmModalProps> = ({
  isOpen,
  onClose,
  paymentType,
  amountPaid,
  change,
  totalAmount,
  isLoading,
  onPaymentTypeChange,
  onAmountPaidChange,
  onConfirmPayment
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
          {/* {paymentType === 'cash' && (
            <>
              <div className="flex flex-col">
                <label htmlFor="amountPaid">Monto recibido:</label>
                <Input
                  id="amountPaid"
                  type="number"
                  value={amountPaid}
                  onChange={onAmountPaidChange}
                  placeholder="Ingrese el monto recibido"
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Cambio:</span>
                <span className="font-bold">${change.toFixed(2)}</span>
              </div>
            </>
          )} */}
        </div>
        <div className="flex justify-end">
          <Button onClick={onConfirmPayment} disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Confirmar Pedido'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileConfirmModal;