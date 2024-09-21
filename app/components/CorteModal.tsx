// components/CorteModal.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';

interface CorteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashAmountCorte: string;
  cardAmountCorte: string;
  isCorteLoading: boolean;
  corteResults: any;
  onCashAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCardAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCorte: () => void;
}

const CorteModal: React.FC<CorteModalProps> = ({
  isOpen,
  onClose,
  cashAmountCorte,
  cardAmountCorte,
  isCorteLoading,
  corteResults,
  onCashAmountChange,
  onCardAmountChange,
  onCorte,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corte de Caja</DialogTitle>
          <DialogDescription>
            Ingrese los montos reales de efectivo y tarjeta para realizar el corte.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cashAmount">Monto en Efectivo</Label>
            <Input
              id="cashAmount"
              type="number"
              value={cashAmountCorte}
              onChange={onCashAmountChange}
              placeholder="Ingrese el monto en efectivo"
              className="mt-2" 
            />
          </div>
          <div>
            <Label htmlFor="cardAmount">Monto en Tarjeta</Label>
            <Input
              id="cardAmount"
              type="number"
              value={cardAmountCorte}
              onChange={onCardAmountChange}
              placeholder="Ingrese el monto en tarjeta"
              className="mt-2" 
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onCorte} disabled={isCorteLoading}>
              {isCorteLoading ? 'Procesando...' : 'Realizar Corte'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CorteModal;
