import React from 'react';
import {
  Box,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  Button,
  VStack,
  HStack,
  Image,
} from "@chakra-ui/react";
import { Product, IStockLocation, ITransfer } from '@/app/types/product';

interface TransferDetailsProps {
  selectedProduct: Product;
  transfer: ITransfer;
  onTransferChange: (field: keyof ITransfer, value: string | number) => void;
  onAddToTransferList: () => void;
  userLocation: string;
}

const TransferDetails: React.FC<TransferDetailsProps> = ({
  selectedProduct,
  transfer,
  onTransferChange,
  onAddToTransferList,
  userLocation
}) => {
  const handleQuantityChange = (valueString: string) => {
    onTransferChange('quantity', valueString === '' ? '' : Number(valueString));
  };

  const maxQuantity = selectedProduct.stockLocations.find(
    loc => loc.location === transfer.fromLocation
  )?.quantity || 0;

  const safeMaxQuantity: number = Number(maxQuantity);

  return (
    <Box bg="white" p={6} borderRadius="md" boxShadow="md" w="full">
      <VStack spacing={4} align="stretch">
        <Heading as="h2" size="lg">Detalles de producto</Heading>
        
        <HStack spacing={4} align="start">
          {transfer.imageUrl && (
            <Image 
              src={transfer.imageUrl} 
              alt={selectedProduct.name}
              boxSize="100px"
              objectFit="cover"
              borderRadius="md"
            />
          )}
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Producto Seleccionado:</Text>
            <Text>{selectedProduct.boxCode} | {selectedProduct.name}</Text>
            <Text fontWeight="bold">Código de Producto:</Text>
            <Text>{selectedProduct.productCode}</Text>
          </VStack>
        </HStack>

        <Box>
          <Text fontWeight="bold" mb={2}>Stock Actual:</Text>
          {selectedProduct.stockLocations.map((loc: IStockLocation, index: number) => (
            <Text key={index}>
              {loc.location}: {loc.quantity}
            </Text>
          ))}
        </Box>

        <FormControl>
          <FormLabel fontWeight="bold">Ubicación origen:</FormLabel>
          <Select
            value={transfer.fromLocation}
            onChange={(e) => onTransferChange('fromLocation', e.target.value)}
          >
            <option value="">Seleccione ubicación origen</option>
            {selectedProduct.stockLocations.map((loc: IStockLocation, index: number) => (
              <option key={index} value={loc.location}>
                {loc.location} | Cantidad: {loc.quantity}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontWeight="bold">Ubicación destino:</FormLabel>
          <Text color="blue.500" fontWeight="semibold">{userLocation}</Text>
        </FormControl>

        <FormControl>
        <FormLabel fontWeight="bold">Cantidad solicitada:</FormLabel>
        <NumberInput
          value={transfer.quantity === 0 ? '' : transfer.quantity}
          onChange={handleQuantityChange}
          min={0}
          max={safeMaxQuantity}
          keepWithinRange={true}
          clampValueOnBlur={false}
        >
          <NumberInputField />
        </NumberInput>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Cantidad máxima disponible: {maxQuantity}
        </Text>
      </FormControl>

      <Button
        colorScheme="blue"
        onClick={onAddToTransferList}
        isDisabled={
          !transfer.fromLocation || 
          transfer.quantity === '' ||
          (typeof transfer.quantity === 'number' && (transfer.quantity <= 0 || transfer.quantity > safeMaxQuantity))
        }
      >
        Agregar a la lista
      </Button>
      </VStack>
    </Box>
  );
};

export default TransferDetails;