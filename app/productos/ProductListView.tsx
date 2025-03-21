import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Badge,
  Box,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from "@chakra-ui/react";

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
  price2: number;
  price3: number;
  stockLocations: StockLocation[];
  imageUrl?: string;
  category: string;
  availability: boolean;
}

interface ProductListViewProps {
  products: Product[];
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

const ProductListView: React.FC<ProductListViewProps> = ({ products, userLocation, userRole }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  const getAvailabilityBadge = (product: Product) => {
    const status = getProductStatus(product, userLocation);
    if (!product.availability) {
      return <Badge colorScheme="red" variant="solid" fontSize="xs" px={2}>No disponible</Badge>;
    }
    switch (status) {
      case 'inStock':
        return <Badge colorScheme="green" variant="solid" fontSize="xs" px={2}>Disponible</Badge>;
      case 'available':
        return <Badge colorScheme="yellow" variant="solid" fontSize="xs" px={2}>Otras ubicaciones</Badge>;
      case 'unavailable':
        return <Badge colorScheme="red" variant="solid" fontSize="xs" px={2}>Sin existencia</Badge>;
    }
  };

  const handleImageClick = (imageUrl?: string) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      onOpen();
    }
  };

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Nombre</Th>
            <Th>Código de caja</Th>
            <Th>Código de producto</Th>
            <Th>Categoría</Th>
            <Th width="150px">Disponibilidad</Th>
            <Th>Inventario</Th>
            {userRole === 'super_administrador' && (
              <>
                <Th>Costo</Th>
                <Th>Precio 1</Th>
                <Th>Precio 2</Th>
                <Th>Precio 3</Th>
              </>
            )}
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => (
            <Tr key={product._id}>
              <Td 
                cursor="pointer" 
                onClick={() => handleImageClick(product.imageUrl)}
                _hover={{ textDecoration: 'underline' }}
              >
                {product.name}
              </Td>
              <Td>{product.boxCode}</Td>
              <Td>{product.productCode}</Td>
              <Td>{product.category}</Td>
              <Td width="150px" textAlign="center">
                {getAvailabilityBadge(product)}
              </Td>
              <Td>
                <Text fontSize="sm">
                  {product.stockLocations.map((location, index) => (
                    <React.Fragment key={index}>
                      <Text textColor="blue" fontWeight="bold">{location.location}:</Text> {location.quantity}
                      {index < product.stockLocations.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </Text>
              </Td>
              {userRole === 'super_administrador' && (
                <>
                  <Td>${product.cost.toFixed(2)}</Td>
                </>
              )}
            <Td>${product.price1}</Td>
            <Td>${product.price2}</Td>
            <Td>${product.price3}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Producto"
                objectFit="contain"
                width="100%"
                height="auto"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProductListView;