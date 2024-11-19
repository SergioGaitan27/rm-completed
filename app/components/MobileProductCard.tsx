// components/MobileProductCard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog";
import { Plus, Minus } from 'lucide-react';

interface Product {
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
  imageUrl: string;
  availability: boolean;
  category?: string;
}

interface MobileProductCardProps {
  product: Product;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  onQuantityChange: (quantity: number) => void;
  onUnitTypeChange: (unitType: 'pieces' | 'boxes') => void;
  onAddToCart: () => void;
}

const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  quantity,
  unitType,
  onQuantityChange,
  onUnitTypeChange,
  onAddToCart,
}) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());

  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  const handleQuantityChange = (value: string) => {
    const newQuantity = value === '' ? 0 : parseInt(value, 10);

    if (!isNaN(newQuantity)) {
      setLocalQuantity(value);
      onQuantityChange(newQuantity);
    }
  };

  const handleInputSelectAll = (
    e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>
  ) => {
    e.currentTarget.select();
  };

  const handleUnitTypeChange = (newUnitType: 'pieces' | 'boxes') => {
    const currentQuantity = parseInt(localQuantity, 10) || 0;

    // Update the unit type
    onUnitTypeChange(newUnitType);

    // No need to recalculate max quantity since stock no longer es considerado
    // Solo actualizar la cantidad si es necesario
    setLocalQuantity(currentQuantity.toString());
    onQuantityChange(currentQuantity);
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
      <p className="text-sm mb-2">Piezas por caja: {product.piecesPerBox}</p>
      
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Cantidad:</span>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              onClick={() => handleQuantityChange((quantity - 1).toString())}
              disabled={quantity <= 0 || !product.availability}
            >
              <Minus size={16} />
            </Button>
            <Input
              type="number"
              value={localQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onClick={handleInputSelectAll}
              onFocus={handleInputSelectAll}
              min={0}
              className="w-16 text-center"
              disabled={!product.availability}
            />
            <Button 
              size="sm" 
              onClick={() => handleQuantityChange((quantity + 1).toString())}
              disabled={!product.availability}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
        <RadioGroup 
          value={unitType} 
          onValueChange={handleUnitTypeChange as (value: string) => void}
          className="flex justify-center space-x-4"
          disabled={!product.availability}
        >
          <div className="flex items-center">
            <RadioGroupItem value="pieces" id="pieces-mobile" disabled={!product.availability} />
            <Label htmlFor="pieces-mobile" className={`ml-2 ${!product.availability ? 'text-gray-400' : ''}`}>Piezas</Label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem value="boxes" id="boxes-mobile" disabled={!product.availability} />
            <Label htmlFor="boxes-mobile" className={`ml-2 ${!product.availability ? 'text-gray-400' : ''}`}>Cajas</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="font-bold">${currentPrice.toFixed(2)} / pieza</span>
        <Button 
          onClick={onAddToCart}
          disabled={!product.availability || quantity === 0}
        >
          {product.availability ? (quantity === 0 ? 'Ingrese cantidad' : 'Agregar al carrito') : 'No disponible'}
        </Button>
      </div>
    </div>
  );
};

export default MobileProductCard;
