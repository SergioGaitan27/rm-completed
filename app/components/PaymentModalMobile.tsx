import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";

interface PaymentModalMobileProps {
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

const PaymentModalMobile: React.FC<PaymentModalMobileProps> = ({
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
      // Limpiar el campo y enfocar
      const timeoutId = setTimeout(() => {
        if (amountPaidInputRef.current) {
          amountPaidInputRef.current.value = '';
          amountPaidInputRef.current.focus();
        }
      }, 100);
  
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, paymentType]);

  const getChangeText = () => {
    if (amountPaid === '') return '';
    const amountPaidNumber = parseFloat(amountPaid);
    if (isNaN(amountPaidNumber)) return '';
    const changeAmount = amountPaidNumber - totalAmount;
    if (changeAmount === 0) return "Monto exacto";
    if (changeAmount > 0) return `Cambio: $${changeAmount.toFixed(2)}`;
    return `Falta: $${Math.abs(changeAmount).toFixed(2)}`;
  };

  const getChangeTextColor = () => {
    if (amountPaid === '') return '';
    const amountPaidNumber = parseFloat(amountPaid);
    if (isNaN(amountPaidNumber)) return '';
    const changeAmount = amountPaidNumber - totalAmount;
    if (changeAmount === 0) return "text-green-500";
    if (changeAmount > 0) return "text-blue-500";
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
                className="mt-2 mb-2"
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
            disabled={paymentType === 'cash' && parseFloat(amountPaid) < totalAmount || isLoading}
          >
            {isLoading ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModalMobile;