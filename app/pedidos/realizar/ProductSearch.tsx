import React, { useState } from 'react';
import {
  Box,
  Heading,
  Input,
  FormControl,
} from "@chakra-ui/react";
import { Product } from '@/app/types/product';

interface ProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ products, onProductSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowProductList(e.target.value.length > 0);
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setSearchTerm('');
    setShowProductList(false);
  };

  return (
    <Box bg="white" p={6} borderRadius="md" boxShadow="md" w="full">
      <Heading as="h2" size="lg" mb={4}>Buscar producto</Heading>
      <FormControl>
        <Input
          placeholder="Buscar por nombre, código de producto o código de caja"
          value={searchTerm}
          onChange={handleProductSearch}
        />
      </FormControl>
      {showProductList && (
        <Box mt={2} maxH="200px" overflowY="auto" bg="white" border="1px" borderColor="gray.200" borderRadius="md">
          {products
            .filter(product => 
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.boxCode.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((product) => (
              <Box
                key={product._id}
                p={2}
                cursor="pointer"
                _hover={{ bg: "gray.100" }}
                onClick={() => handleProductSelect(product)}
              >
                {product.boxCode} | {product.name} 
              </Box>
            ))
          }
        </Box>
      )}
    </Box>
  );
};

export default ProductSearch;