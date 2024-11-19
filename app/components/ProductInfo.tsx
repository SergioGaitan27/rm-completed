// components/ProductInfo.tsx
'use client'

import React, { useImperativeHandle, useRef, forwardRef } from 'react';
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Product } from '@/app/types/product';

interface ProductInfoProps {
  searchTermBottom: string;
  handleSearchBottomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPressBottom: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSearchBottom: (term: string) => void;
  filteredProducts: Product[];
  handleSelectProduct: (product: Product) => void;
  productInfoBottom: Product | null;
  handleAddFromDetails: (product: Product) => void;
  productSearchedFromBottom: boolean;
}

const ProductInfo = forwardRef<HTMLInputElement, ProductInfoProps>((props, ref) => {
  const {
    searchTermBottom,
    handleSearchBottomChange,
    handleKeyPressBottom,
    handleSearchBottom,
    filteredProducts,
    handleSelectProduct,
    productInfoBottom,
    handleAddFromDetails,
    productSearchedFromBottom
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);

  // Expose the input's ref to the parent component
  useImperativeHandle(ref, () => inputRef.current!);

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
          ref={inputRef}
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
        <div className={`mt-4 border-2 ${productInfoBottom.availability ? 'border-green-500' : 'border-red-500'} rounded-lg p-4`}>
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
                <div className="w-[100px] h-[100px] bg-gray-200 flex items-center justify-center rounded">
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
            </div>
          </div>
          {productSearchedFromBottom && (
            <Button 
              onClick={() => handleAddFromDetails(productInfoBottom)}
              className="text-white px-4 py-2 rounded mt-4 w-full bg-green-500 hover:bg-green-600"
            >
              Seleccionar producto
            </Button>
          )}
        </div>
      )}
    </>
  );
});

export default ProductInfo;
