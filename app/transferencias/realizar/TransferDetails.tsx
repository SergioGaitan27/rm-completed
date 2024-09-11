import React, { useState } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  useDisclosure,
} from "@chakra-ui/react";
import { Product, ITransfer, IStockLocation } from '@/app/types/product';

interface TransferDetailsProps {
  selectedProduct: Product;
  transfer: ITransfer;
  onTransferChange: (field: keyof ITransfer, value: string | number) => void;
  onAddToTransferList: () => void;
}

const TransferDetails: React.FC<TransferDetailsProps> = ({
  selectedProduct,
  transfer,
  onTransferChange,
  onAddToTransferList
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newLocation, setNewLocation] = useState('');

  const handleAddNewLocation = () => {
    if (newLocation) {
      const updatedProduct = {
        ...selectedProduct,
        stockLocations: [...selectedProduct.stockLocations, { location: newLocation, quantity: '0' }]
      };
      onTransferChange('toLocation', newLocation);
      setNewLocation('');
      onClose();
    }
  };

  const parseQuantity = (quantity: number | string): number => {
    return typeof quantity === 'string' ? parseInt(quantity, 10) || 0 : quantity;
  };

  const maxQuantity = parseQuantity(
    selectedProduct.stockLocations.find(loc => loc.location === transfer.fromLocation)?.quantity || '0'
  );

  return (
    <Box bg="white" p={6} borderRadius="md" boxShadow="md" w="full">
      <Heading as="h2" size="lg" mb={4}>Detalles de Transferencia</Heading>
      <Text fontWeight="bold" mb={2}>Producto Seleccionado:</Text>
      <Text mb={4}>{selectedProduct.boxCode} | {selectedProduct.name}</Text>
      
      <Text fontWeight="bold" mb={2}>Stock Actual:</Text>
      {selectedProduct.stockLocations.map((loc: IStockLocation, index: number) => (
        <Text key={index} mb={2}>
          {loc.location}: {loc.quantity}
        </Text>
      ))}

      <FormControl mt={4}>
        <FormLabel>Ubicación origen</FormLabel>
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

      <FormControl mt={4}>
        <FormLabel>Ubicación destino</FormLabel>
        <Select
          value={transfer.toLocation}
          onChange={(e) => {
            if (e.target.value === 'new') {
              onOpen();
            } else {
              onTransferChange('toLocation', e.target.value);
            }
          }}
        >
          <option value="">Seleccione ubicación destino</option>
          {selectedProduct.stockLocations.map((loc: IStockLocation, index: number) => (
            <option key={index} value={loc.location}>
              {loc.location} | Cantidad: {loc.quantity}
            </option>
          ))}
          <option value="new">+ Agregar nueva ubicación</option>
        </Select>
      </FormControl>

      <FormControl mt={4}>
        <FormLabel>Cantidad a transferir</FormLabel>
        <NumberInput
          value={transfer.quantity}
          onChange={(_, valueString) => {
            const numberValue = parseQuantity(valueString);
            onTransferChange('quantity', numberValue > maxQuantity ? maxQuantity.toString() : valueString);
          }}
          max={maxQuantity}
        >
          <NumberInputField />
        </NumberInput>
      </FormControl>

      <Button
        mt={4}
        colorScheme="blue"
        onClick={onAddToTransferList}
        isDisabled={!transfer.fromLocation || !transfer.toLocation || parseQuantity(transfer.quantity) <= 0}
      >
        Agregar a la lista de transferencias
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agregar nueva ubicación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Nueva ubicación</FormLabel>
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Ingrese la nueva ubicación"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddNewLocation}>
              Agregar
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TransferDetails;