import React from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

interface MobileCorteModalProps {
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

const MobileCorteModal: React.FC<MobileCorteModalProps> = ({
  isOpen,
  onClose,
  cashAmountCorte,
  cardAmountCorte,
  isCorteLoading,
  corteResults,
  onCashAmountChange,
  onCardAmountChange,
  onCorte
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Corte de Caja</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col">
            <label htmlFor="cashAmount">Monto en efectivo:</label>
            <Input
              id="cashAmount"
              type="number"
              value={cashAmountCorte}
              onChange={onCashAmountChange}
              placeholder="Ingrese el monto en efectivo"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="cardAmount">Monto en tarjeta:</label>
            <Input
              id="cardAmount"
              type="number"
              value={cardAmountCorte}
              onChange={onCardAmountChange}
              placeholder="Ingrese el monto en tarjeta"
            />
          </div>
          {corteResults && (
            <div className="mt-4">
              <h4 className="font-bold">Resultados del Corte:</h4>
              <p>Total en efectivo: ${corteResults.cashTotal.toFixed(2)}</p>
              <p>Total en tarjeta: ${corteResults.cardTotal.toFixed(2)}</p>
              <p>Total general: ${corteResults.grandTotal.toFixed(2)}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={onCorte} disabled={isCorteLoading}>
            {isCorteLoading ? 'Procesando...' : 'Realizar Corte'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileCorteModal;