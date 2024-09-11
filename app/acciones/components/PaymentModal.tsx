import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/acciones/components/ui/dialog";
import { Button } from "@/app/acciones/components/ui/button";
import { Input } from "@/app/acciones/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/acciones/components/ui/radio-group";
import { Label } from "@/app/acciones/components/ui/label";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: 'cash' | 'card';
  amountPaid: string;
  change: number;
  totalAmount: number;
  isLoading: boolean;
  onPaymentTypeChange: (value: 'cash' | 'card') => void;
  onAmountPaidChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPayment: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
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
  const amountPaidInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && paymentType === 'cash') {
      const timeoutId = setTimeout(() => {
        amountPaidInputRef.current?.focus();
      }, 100);
  
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, paymentType]);

  const getChangeText = () => {
    if (amountPaid === '') return '';
    if (change === 0) return "Monto exacto";
    if (change > 0) return `Cambio: $${change.toFixed(2)}`;
    return `Falta: $${Math.abs(change).toFixed(2)}`;
  };

  const getChangeTextColor = () => {
    if (amountPaid === '') return '';
    if (change === 0) return "text-green-500";
    if (change > 0) return "text-blue-500";
    return "text-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={paymentType} onValueChange={onPaymentTypeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash">Efectivo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card">Tarjeta</Label>
            </div>
          </RadioGroup>
          <p className="font-bold text-lg">Total a pagar: ${totalAmount.toFixed(2)}</p>
          {paymentType === 'cash' && (
            <div>
              <Label htmlFor="amountPaid">Monto pagado:</Label>
              <Input
                id="amountPaid"
                type="number"
                value={amountPaid}
                onChange={onAmountPaidChange}
                placeholder="Ingrese el monto pagado"
                className="mt-4 mb-4"
                ref={amountPaidInputRef}
              />
              <p className={`mt-2 font-bold ${getChangeTextColor()}`}>
                {getChangeText()}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isLoading}>Cancelar</Button>
          <Button 
            onClick={onConfirmPayment}
            disabled={paymentType === 'cash' && change < 0 || isLoading}
          >
            {isLoading ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;