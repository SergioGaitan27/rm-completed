import React from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Product } from '@/app/types/product';

interface MobileProductCardProps {
  product: Product;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  onQuantityChange: (quantity: number) => void;
  onUnitTypeChange: (unitType: 'pieces' | 'boxes') => void;
  onAddToCart: () => void;
  remainingQuantity: number;
  maxQuantity: number;
}

const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  quantity,
  unitType,
  onQuantityChange,
  onUnitTypeChange,
  onAddToCart,
  remainingQuantity,
  maxQuantity
}) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h3 className="text-lg font-bold mb-2">{product.name}</h3>
      <p className="text-sm mb-2">Código: {product.productCode}</p>
      <p className="text-sm mb-2">Disponible: {remainingQuantity} piezas</p>
      
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Cantidad:</span>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value))}
            min={1}
            max={maxQuantity}
            className="w-20 text-right"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Unidad:</span>
          <div className="space-x-2">
            <Button
              size="sm"
              variant={unitType === 'pieces' ? 'default' : 'outline'}
              onClick={() => onUnitTypeChange('pieces')}
            >
              Piezas
            </Button>
            <Button
              size="sm"
              variant={unitType === 'boxes' ? 'default' : 'outline'}
              onClick={() => onUnitTypeChange('boxes')}
            >
              Cajas
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="font-bold">${product.price1.toFixed(2)} / pieza</span>
        <Button onClick={onAddToCart}>Agregar al carrito</Button>
      </div>
    </div>
  );
};

export default MobileProductCard;