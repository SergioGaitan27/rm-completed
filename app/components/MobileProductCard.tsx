import React, { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PlusIcon, MinusIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog";

interface MobileProductCardProps {
  product: {
    _id: string;
    name: string;
    productCode: string;
    boxCode: string;
    piecesPerBox: number;
    price1: number;
    price2: number;
    price3: number;
    price1MinQty: number;
    price2MinQty: number;
    price3MinQty: number;
    imageUrl: string; // Asegúrate de que tu modelo de producto incluya esta propiedad
  };
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
  const [isImageOpen, setIsImageOpen] = useState(false);

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const calculateCurrentPrice = () => {
    const totalPieces = unitType === 'boxes' ? quantity * product.piecesPerBox : quantity;
    if (totalPieces >= product.price3MinQty) return product.price3;
    if (totalPieces >= product.price2MinQty) return product.price2;
    return product.price1;
  };

  const currentPrice = calculateCurrentPrice();

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogTrigger asChild>
          <h3 className="text-lg font-bold mb-2 cursor-pointer hover:text-blue-600">{product.name}</h3>
        </DialogTrigger>
        <DialogContent>
          <img src={product.imageUrl} alt={product.name} className="w-full h-auto" />
        </DialogContent>
      </Dialog>
      <p className="text-sm mb-2">Código de producto: {product.productCode}</p>
      <p className="text-sm mb-2">Código de caja: {product.boxCode}</p>
      <p className="text-sm mb-2">Disponible: {remainingQuantity} piezas</p>
      <p className="text-sm mb-2">Piezas por caja: {product.piecesPerBox}</p>
      
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Cantidad:</span>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleDecrement} disabled={quantity <= 1}>
              <MinusIcon size={16} />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(parseInt(e.target.value))}
              min={1}
              max={maxQuantity}
              className="w-16 text-center"
            />
            <Button size="sm" onClick={handleIncrement} disabled={quantity >= maxQuantity}>
              <PlusIcon size={16} />
            </Button>
          </div>
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
        <span className="font-bold">${currentPrice.toFixed(2)} / pieza</span>
        <Button onClick={onAddToCart}>Agregar al carrito</Button>
      </div>
    </div>
  );
};

export default MobileProductCard;