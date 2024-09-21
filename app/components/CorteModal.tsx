import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

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
  onCorte
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Realizar Corte</DialogTitle>
        </DialogHeader>
        {!corteResults ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cashAmountCorte">Monto en Efectivo:</Label>
              <Input
                id="cashAmountCorte"
                type="number"
                value={cashAmountCorte}
                onChange={onCashAmountChange}
                placeholder="Ingrese el monto en efectivo"
                className="mt-2 mb-4"
              />
            </div>
            <div>
              <Label htmlFor="cardAmountCorte">Monto en Tarjeta:</Label>
              <Input
                id="cardAmountCorte"
                type="number"
                value={cardAmountCorte}
                onChange={onCardAmountChange}
                placeholder="Ingrese el monto en tarjeta"
                className="mt-2 mb-4"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold">Resultados del Corte:</h3>
            <p>Efectivo Esperado: ${corteResults.expectedCash.toFixed(2)}</p>
            <p>Efectivo Real: ${corteResults.actualCash.toFixed(2)}</p>
            <p>Diferencia Efectivo: ${(corteResults.actualCash - corteResults.expectedCash).toFixed(2)}</p>
            <p>Tarjeta Esperada: ${corteResults.expectedCard.toFixed(2)}</p>
            <p>Tarjeta Real: ${corteResults.actualCard.toFixed(2)}</p>
            <p>Diferencia Tarjeta: ${(corteResults.actualCard - corteResults.expectedCard).toFixed(2)}</p>
            <p>Total de Tickets: {corteResults.totalTickets}</p>
            {corteResults.tickets && corteResults.tickets.length > 0 && (
              <div>
                <h4 className="font-bold">Tickets Sumados:</h4>
                <ul>
                  {corteResults.tickets.map((ticket: any) => (
                    <li key={ticket.ticketId}>
                      ID: {ticket.ticketId} - Total: ${ticket.totalAmount.toFixed(2)} - Pago: {ticket.paymentType}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {!corteResults ? (
            <>
              <Button onClick={onClose} variant="outline">Cancelar</Button>
              <Button 
                onClick={onCorte} 
                disabled={isCorteLoading}
              >
                {isCorteLoading ? 'Procesando...' : 'Realizar Corte'}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CorteModal;