import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { CartItem } from '@/app/types/product';

interface AdjustedCartItem extends CartItem {
  adjustedPrice: number;
  totalPieces: number;
}

interface PriceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onApplyAdjustment: (adjustedCart: AdjustedCartItem[]) => void;
}

const PriceAdjustmentModal: React.FC<PriceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  cart,
  onApplyAdjustment
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'discount' | 'markup'>('discount');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [adjustedCart, setAdjustedCart] = useState<AdjustedCartItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Agrupa los productos y calcula las piezas totales
      const groupedCart = cart.reduce((acc, item) => {
        const existingItem = acc.find(i => i._id === item._id);
        const totalPieces = item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity;
        
        if (existingItem) {
          existingItem.quantity += item.quantity;
          existingItem.totalPieces += totalPieces;
        } else {
          acc.push({
            ...item,
            adjustedPrice: item.appliedPrice,
            totalPieces: totalPieces
          });
        }
        return acc;
      }, [] as AdjustedCartItem[]);
      
      setAdjustedCart(groupedCart);
      setAdjustmentValue('');
    }
  }, [isOpen, cart]);

  const calculateAdjustment = () => {
    const value = parseFloat(adjustmentValue) || 0;
    const newAdjustedCart = adjustedCart.map(item => {
      let newPrice;
      if (adjustmentType === 'discount') {
        newPrice = item.appliedPrice * (1 - value / 100);
      } else {
        newPrice = item.cost * (1 + value / 100);
      }
      return { ...item, adjustedPrice: newPrice };
    });
    setAdjustedCart(newAdjustedCart);
  };

  useEffect(() => {
    calculateAdjustment();
  }, [adjustmentType, adjustmentValue]);

  const calculateTotalProfit = () => {
    return adjustedCart.reduce((total, item) => {
      const profit = (item.adjustedPrice - item.cost) * item.totalPieces;
      return total + profit;
    }, 0);
  };

  const handleApply = () => {
    onApplyAdjustment(adjustedCart);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Ajuste de Precios</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup
            value={adjustmentType}
            onValueChange={(value: 'discount' | 'markup') => setAdjustmentType(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="discount" id="discount" />
              <Label htmlFor="discount">Descuento sobre precio de caja</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="markup" id="markup" />
              <Label htmlFor="markup">Margen sobre costo</Label>
            </div>
          </RadioGroup>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              placeholder="Porcentaje"
            />
            <span>%</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Producto</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-center">Costo</th>
                  <th className="text-center">Precio Caja</th>
                  <th className="text-center">Precio Ajustado</th>
                </tr>
              </thead>
              <tbody>
                {adjustedCart.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td className="text-center">
                      {Math.floor(item.totalPieces / item.piecesPerBox)} cajas +{' '}
                      {item.totalPieces % item.piecesPerBox} piezas
                    </td>
                    <td className="text-center">${item.cost.toFixed(2)}</td>
                    <td className="text-center">${item.price3.toFixed(2)}</td>
                    <td className="text-center text-red-500">${item.adjustedPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="font-bold text-lg">
            Ganancia Total: ${calculateTotalProfit().toFixed(2)}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAdjustmentModal;