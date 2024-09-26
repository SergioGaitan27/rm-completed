import React from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Product, IStockLocation } from '@/app/types/product';

interface MobileProductInfoProps {
  searchTermBottom: string;
  handleSearchBottomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPressBottom: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSearchBottom: (searchTerm: string) => void;
  filteredProducts: Product[];
  handleSelectProduct: (product: Product) => void;
  productInfoBottom: Product | null;
  isProductAvailable: (product: Product) => boolean;
  handleAddFromDetails: () => void;
  productSearchedFromBottom: boolean;
  calculateStockDisplay: (stockLocations: IStockLocation[], piecesPerBox: number) => any[];
  getRemainingQuantity: (product: Product) => number;
  getCartQuantity: (productId: string) => number;
}

const MobileProductInfo: React.FC<MobileProductInfoProps> = ({
  searchTermBottom,
  handleSearchBottomChange,
  handleKeyPressBottom,
  handleSearchBottom,
  filteredProducts,
  handleSelectProduct,
  productInfoBottom,
  isProductAvailable,
  handleAddFromDetails,
  productSearchedFromBottom,
  calculateStockDisplay,
  getRemainingQuantity,
  getCartQuantity
}) => {
  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Buscar producto"
        value={searchTermBottom}
        onChange={handleSearchBottomChange}
        onKeyDown={handleKeyPressBottom}
      />
      
      {filteredProducts.length > 0 && (
        <ul className="mt-2 space-y-2">
          {filteredProducts.map((product) => (
            <li 
              key={product._id} 
              className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
              onClick={() => handleSelectProduct(product)}
            >
              {product.name}
            </li>
          ))}
        </ul>
      )}

      {productInfoBottom && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">{productInfoBottom.name}</h3>
          <p>Código: {productInfoBottom.productCode}</p>
          <p>Precio: ${productInfoBottom.price1.toFixed(2)}</p>
          <p>Disponible: {getRemainingQuantity(productInfoBottom)} piezas</p>
          <p>En carrito: {getCartQuantity(productInfoBottom._id)} piezas</p>
          
          {productInfoBottom.stockLocations && (
            <div className="mt-2">
              <h4 className="font-semibold">Stock por ubicación:</h4>
              <ul>
                {calculateStockDisplay(productInfoBottom.stockLocations, productInfoBottom.piecesPerBox).map((stock, index) => (
                  <li key={index}>
                    {stock.location}: {stock.boxes} cajas, {stock.loosePieces} piezas (Total: {stock.total})
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Button 
            onClick={handleAddFromDetails}
            className="mt-4"
            disabled={!isProductAvailable(productInfoBottom)}
          >
            Agregar al carrito
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobileProductInfo;