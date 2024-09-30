import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent } from "@/app/components/ui/card";
import { Plus, Minus } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  productCode: string;
  category: string;
  imageUrl?: string;
  availability: boolean;
  piecesPerBox: number;
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  onQuantityChange: (quantity: number) => void;
  onUnitTypeChange: (unitType: 'pieces' | 'boxes') => void;
  onAddToCart: () => void;
  remainingQuantity: number;
  totalStockAcrossLocations: number;
  maxQuantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  quantity, 
  unitType, 
  onQuantityChange, 
  onUnitTypeChange, 
  onAddToCart,
  remainingQuantity,
  totalStockAcrossLocations,
  maxQuantity
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());
  const isAvailable = product.availability && totalStockAcrossLocations > 0;

  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const handleQuantityChange = (value: string) => {
    setLocalQuantity(value);
    const newQuantity = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(newQuantity)) {
      onQuantityChange(newQuantity);
    }
  };

  const handleUnitTypeChange = (newUnitType: 'pieces' | 'boxes') => {
    onUnitTypeChange(newUnitType);
    setLocalQuantity('');
    onQuantityChange(0);
  };

  return (
    <Card className="mb-4">
      <CardContent className="flex items-stretch p-4 space-x-4">
        {/* Sección 1: Nombre del producto e Imagen */}
        <div className="w-1/3 flex flex-col items-center justify-center space-y-2">
          <h3 className="text-sm font-medium text-center">{product.name}</h3>
          {product.imageUrl ? (
            <Image 
              src={product.imageUrl} 
              alt={product.name} 
              width={100} 
              height={100} 
              className="object-cover rounded"
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-gray-200 flex items-center justify-center rounded">
              No imagen
            </div>
          )}
        </div>

        <div className="w-1/12 flex items-center justify-center">
          <span className="text-5xl font-bold select-none transform rotate-45">+</span>
        </div>
        
        {/* Sección 2: Controles de cantidad y radio inputs */}
        <div className="w-2/5 flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-center space-x-2 pb-4">
            <Button 
              onClick={() => handleQuantityChange((parseInt(localQuantity) - 1).toString())}
              disabled={parseInt(localQuantity) <= 0 || !isAvailable}
              size="sm"
              variant="outline"
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="0"
              max={maxQuantity}
              value={localQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onClick={handleInputClick}
              className="w-16 text-center no-spinners"
              aria-label="Cantidad"
              disabled={!isAvailable}
            />
            <Button 
              onClick={() => handleQuantityChange((parseInt(localQuantity) + 1).toString())}
              disabled={parseInt(localQuantity) >= maxQuantity || !isAvailable}
              size="sm"
              variant="outline"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <RadioGroup 
            value={unitType} 
            onValueChange={handleUnitTypeChange} 
            className="flex justify-center space-x-4"
            disabled={!isAvailable}
          >
            <div className="flex items-center">
              <RadioGroupItem value="pieces" id="pieces" disabled={!isAvailable} />
              <Label htmlFor="pieces" className={`ml-2 ${!isAvailable ? 'text-gray-400' : ''}`}>Piezas</Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="boxes" id="boxes" disabled={!isAvailable} />
              <Label htmlFor="boxes" className={`ml-2 ${!isAvailable ? 'text-gray-400' : ''}`}>Cajas</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Sección 3: Botón de agregar */}
        <div className="w-1/4 flex items-center justify-center">
          <Button 
            onClick={onAddToCart}
            className="w-full"
            disabled={!isAvailable || parseInt(localQuantity) === 0}
          >
            {isAvailable ? (parseInt(localQuantity) === 0 ? 'Ingrese cantidad' : 'Agregar') : 'No disponible'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;