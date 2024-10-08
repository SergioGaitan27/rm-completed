// components/CashOutModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';

interface CashOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, concept: string, location: string) => void;
  location: string;
}

const CashOutModal: React.FC<CashOutModalProps> = ({ isOpen, onClose, onSubmit, location }) => {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      // Mostrar error
      return;
    }
    setIsSubmitting(true);
    await onSubmit(amountNumber, concept, location); // Pasar location
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Salida de Efectivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div >
            <Label htmlFor="amount">Monto</Label>
            <Input
            className='mt-2'
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ingrese el monto de la salida"
            />
          </div>
          <div>
            <Label htmlFor="concept">Concepto</Label>
            <Input
            className='mt-2'
              id="concept"
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ingrese el concepto"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashOutModal;
