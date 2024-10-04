'use client'

import React from 'react';
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Product, IStockLocation } from '@/app/types/product';

interface ProductInfoProps {
  searchTermBottom: string;
  handleSearchBottomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPressBottom: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSearchBottom: (term: string) => void;
  filteredProducts: Product[];
  handleSelectProduct: (product: Product) => void;
  productInfoBottom: Product | null;
  getRemainingQuantity: (product: Product) => number;
  isProductAvailable: (product: Product) => boolean;
  handleAddFromDetails: (product: Product) => void;
  productSearchedFromBottom: boolean;
  calculateStockDisplay: (stockLocations: IStockLocation[], piecesPerBox: number) => any[];
  getCartQuantity: (productId: string) => number;
  getTotalStockAcrossLocations: (product: Product) => number;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  searchTermBottom,
  handleSearchBottomChange,
  handleKeyPressBottom,
  handleSearchBottom,
  filteredProducts,
  handleSelectProduct,
  productInfoBottom,
  getRemainingQuantity,
  isProductAvailable,
  handleAddFromDetails,
  productSearchedFromBottom,
  calculateStockDisplay,
  getCartQuantity,
  getTotalStockAcrossLocations
}) => {


  const getAvailableQuantityTotal = (product: Product) => {
    const totalQuantity = getTotalStockAcrossLocations(product);
    const cartQuantity = getCartQuantity(product._id);
    return totalQuantity - cartQuantity;
  };

  return (
    <>
      <div className="mb-4 mt-4 flex relative">
        <Input
          type="text"
          placeholder="Buscar por código, nombre o categoría"
          value={searchTermBottom}
          onChange={handleSearchBottomChange}
          onKeyDown={handleKeyPressBottom}
          className="flex-grow"
        />
        <Button
          onClick={() => handleSearchBottom(searchTermBottom)}
          className="ml-2"
        >
          Buscar
        </Button>
        {filteredProducts.length > 0 && (
          <ul className="absolute z-10 bg-white border rounded shadow-lg w-full mt-12 max-h-40 overflow-y-auto">
            {filteredProducts.map((product) => (
              <li
                key={product._id}
                onClick={() => handleSelectProduct(product)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {product.name} | {product.productCode} | ({product.boxCode})
              </li>
            ))}
          </ul>
        )}
      </div>

      {productInfoBottom && (
        <div className={`mt-4 border-2 ${isProductAvailable(productInfoBottom) ? 'border-green-500' : 'border-red-500'} rounded-lg p-4`}>
          <div className="flex space-x-4">
            <div className="w-1/4">
              {productInfoBottom.imageUrl ? (
                <Image 
                  src={productInfoBottom.imageUrl} 
                  alt={productInfoBottom.name} 
                  width={100} 
                  height={100} 
                  className="object-cover"
                />
              ) : (
                <div className="w-[100px] h-[100px] bg-gray-200 flex items-center justify-center">
                  No imagen
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{productInfoBottom.name}</h3>
              <p>Código de caja: {productInfoBottom.boxCode}</p>
              <p>Código de producto: {productInfoBottom.productCode}</p>
              <p>Categoría: {productInfoBottom.category}</p>
              <p>Disponibilidad: {productInfoBottom.availability ? 'Disponible' : 'No disponible'}</p>
              <p>Piezas por caja: {productInfoBottom.piecesPerBox}</p>
              <p>Precio menudeo: ${productInfoBottom.price1.toFixed(2)} (Cantidad mínima: {productInfoBottom.price1MinQty})</p>
              <p>Precio mayoreo: ${productInfoBottom.price2.toFixed(2)} (Cantidad mínima: {productInfoBottom.price2MinQty})</p>
              <p>Precio caja: ${productInfoBottom.price3.toFixed(2)} (Cantidad mínima: {productInfoBottom.price3MinQty})</p>
              {productInfoBottom.price4 && <p>Precio 4: ${productInfoBottom.price4.toFixed(2)}</p>}
              {productInfoBottom.price5 && <p>Precio 5: ${productInfoBottom.price5.toFixed(2)}</p>}
              
              {productInfoBottom.ajustado ? (
                <>
                  <div className="mt-4 p-2 bg-gray-100 rounded">
                    <p className={`font-bold text-center ${getAvailableQuantityTotal(productInfoBottom) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Disponible para venta: {getAvailableQuantityTotal(productInfoBottom)} piezas
                    </p>
                  </div>
                  
                  {/* Aquí puedes agregar más detalles sobre el stock si lo deseas */}
                </>
              ) : (
                <p></p>
              )}

              {/* Comentado el detalle por ubicaciones */}
              {/* <h4 className="font-bold mt-4">Detalle por ubicaciones:</h4>
              <ul className="mt-2">
                {calculateStockDisplay(productInfoBottom.stockLocations, productInfoBottom.piecesPerBox).map((location, index) => (
                  <li key={index} className="mb-1">
                    <span className="font-semibold">{location.location}:</span> 
                    {location.boxes > 0 && ` ${location.boxes} ${location.boxes === 1 ? 'caja' : 'cajas'}`}
                    {location.boxes > 0 && location.loosePieces > 0 && ' y'}
                    {location.loosePieces > 0 && ` ${location.loosePieces} ${location.loosePieces === 1 ? 'pieza' : 'piezas'}`}
                    {' | Total: '}{location.total} {location.total === 1 ? 'pieza' : 'piezas'}
                  </li>
                ))}
              </ul> */}
            </div>
          </div>
          {productSearchedFromBottom && (
            <Button 
              onClick={() => handleAddFromDetails(productInfoBottom)}
              className={`text-white px-4 py-2 rounded mt-4 w-full ${
                getAvailableQuantityTotal(productInfoBottom) > 0
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600 cursor-not-allowed'
              }`}
              disabled={getAvailableQuantityTotal(productInfoBottom) <= 0}
            >
              {getAvailableQuantityTotal(productInfoBottom) > 0
                ? 'Seleccionar producto' 
                : 'Sin inventario disponible para venta'}
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export default ProductInfo;
