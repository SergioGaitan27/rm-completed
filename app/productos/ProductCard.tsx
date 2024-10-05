import React from 'react';
import { Box, VStack, Heading, Text, Image, Badge, Button, Modal, ModalOverlay, ModalContent, ModalBody, useDisclosure } from "@chakra-ui/react";
import { useRouter } from 'next/navigation';

interface StockLocation {
  location: string;
  quantity: number;
}

interface Product {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
  cost: number;
  price1: number;
  price1MinQty: number;
  price2: number;
  price2MinQty: number;
  price3: number;
  price3MinQty: number;
  price4?: number;
  price5?: number;
  stockLocations: StockLocation[];
  imageUrl?: string;
  category: string;
  availability: boolean;
}

interface ProductCardProps {
  product: Product;
  userLocation: string;
  userRole: string;
}

const getProductStatus = (product: Product, userLocation: string): 'inStock' | 'available' | 'unavailable' => {
  const totalStock = product.stockLocations.reduce((sum, location) => sum + location.quantity, 0);
  const stockInUserLocation = product.stockLocations.find(loc => loc.location === userLocation)?.quantity || 0;

  if (stockInUserLocation > 0) {
    return 'inStock';
  } else if (totalStock > 0) {
    return 'available';
  } else {
    return 'unavailable';
  }
};

const calculateInventory = (quantity: number, piecesPerBox: number) => {
  const boxes = Math.floor(quantity / piecesPerBox);
  const loosePieces = quantity % piecesPerBox;
  return { boxes, loosePieces };
};

const ProductCard: React.FC<ProductCardProps> = ({ product, userLocation, userRole }) => {
  const status = getProductStatus(product, userLocation);
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const getBorderColor = (): string => {
    if (!product.availability) {
      return 'red.500';
    }
    switch (status) {
      case 'inStock':
      case 'available':
        return 'green.500';
      case 'unavailable':
        return 'black';
    }
  };

  const getAvailabilityBadge = () => {
    if (!product.availability) {
      return <Badge colorScheme="red">No disponible</Badge>;
    }
    switch (status) {
      case 'inStock':
        return <Badge colorScheme="green">Disponible</Badge>;
      case 'available':
        return <Badge colorScheme="green">Disponible</Badge>;
      case 'unavailable':
        return <Badge colorScheme="black">Sin existencia</Badge>;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'BUTTON') {
      onOpen();
    }
  };

  const sortedStockLocations = [
    ...product.stockLocations.filter(location => location.location === userLocation),
    ...product.stockLocations.filter(location => location.location !== userLocation),
  ];

  return (
    <Box
      borderWidth={2}
      borderRadius="lg"
      borderColor={getBorderColor()}
      p={4}
      bg="white"
      boxShadow="md"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-5px)", boxShadow: "lg", cursor: "pointer" }}
      onClick={handleCardClick}
    >
      <VStack align="start" spacing={3}>
        {product.imageUrl && (
          <Box width="100%" height="150px" overflow="hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              objectFit="contain"
              width="100%"
              height="100%"
            />
          </Box>
        )}
        <Heading as="h3" size="md">{product.name} {getAvailabilityBadge()}</Heading>
        <Text fontSize="sm"><strong>Código de caja:</strong> {product.boxCode}</Text>
        <Text fontSize="sm"><strong>Código de producto:</strong> {product.productCode}</Text>
        <Text fontSize="sm"><strong>Piezas por caja:</strong> {product.piecesPerBox}</Text>
        <Text fontSize="sm"><strong>Categoría:</strong> {product.category}</Text>
        {(userRole === 'super_administrador' || userRole === 'sistemas') && (
          <Text fontSize="sm"><strong>Costo:</strong> ${product.cost.toFixed(2)}</Text>
        )}
        <Text fontSize="sm"><strong>Precios:</strong></Text>
        <Text fontSize="xs">Menudeo: ${product.price1.toFixed(2)} | Min: {product.price1MinQty}</Text>
        <Text fontSize="xs">Mayoreo: ${product.price2.toFixed(2)} | Min: {product.price2MinQty}</Text>
        <Text fontSize="xs">Caja: ${product.price3.toFixed(2)} | Min: {product.price3MinQty}</Text>
        <Text fontSize="sm"><strong>Inventario:</strong></Text>
        {sortedStockLocations.map((location, index) => {
          const { boxes, loosePieces } = calculateInventory(location.quantity, product.piecesPerBox);
          const isUserLocation = location.location === userLocation;
          return (
            <Text key={index} fontSize="xs" fontWeight={isUserLocation ? 'bold' : 'normal'}>
              {location.location}: {boxes} {boxes === 1 ? 'caja' : 'cajas'}
              {loosePieces > 0 && ` y ${loosePieces} ${loosePieces === 1 ? 'pieza' : 'piezas'}`}
              {` (Total: ${location.quantity})`}
            </Text>
          );
        })}
      </VStack>
      
      {(userRole === 'super_administrador' || userRole === 'sistemas') && (
        <Box width="100%" display="flex" justifyContent="center" mt={4}>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/productos/modificar/${product._id}`);
            }}
          >
            Modificar
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <Image
              src={product.imageUrl}
              alt={product.name}
              objectFit="contain"
              width="100%"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProductCard;