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
import { Product, IStockLocation, IPedidoList } from '@/app/types/product';

interface PedidoDetailsProps {
  selectedProduct: Product;
  pedido: IPedidoList;
  onPedidoChange: (field: keyof IPedidoList, value: string | number) => void;
  onAddToPedidoList: () => void;
  userLocation: string;
  userRole: string;
  allLocations: string[];
}

const calculateStockDisplay = (stockLocations: IStockLocation[], piecesPerBox: number) => {
  return stockLocations.map(location => {
    const totalPieces = Number(location.quantity);
    const boxes = Math.floor(totalPieces / piecesPerBox);
    const loosePieces = totalPieces % piecesPerBox;
    return {
      location: location.location,
      boxes,
      loosePieces,
      total: totalPieces
    };
  });
};

const PedidoDetails: React.FC<PedidoDetailsProps> = ({
  selectedProduct,
  pedido,
  onPedidoChange,
  onAddToPedidoList,
  userLocation,
  userRole,
  allLocations
}) => {
  const handleQuantityChange = (valueString: string) => {
    onPedidoChange('quantity', valueString);
  };

  const maxQuantity = Number(selectedProduct.stockLocations.find(
    loc => loc.location === pedido.fromLocation
  )?.quantity || 0);

  const safeMaxQuantity: number = Number(maxQuantity);

  const stockDisplay = calculateStockDisplay(selectedProduct.stockLocations, selectedProduct.piecesPerBox);

  const formatQuantityDisplay = (quantity: number) => {
    if (isNaN(quantity) || quantity === 0) return '';
    const boxes = Math.floor(quantity / selectedProduct.piecesPerBox);
    const loosePieces = quantity % selectedProduct.piecesPerBox;
    return `${boxes} ${boxes === 1 ? 'caja' : 'cajas'}${loosePieces > 0 ? ` y ${loosePieces} ${loosePieces === 1 ? 'pieza' : 'piezas'}` : ''}`;
  };

  const canChooseDestination = userRole === 'super_administrador' || userRole === 'sistemas';

  return (
    <Box bg="white" p={6} borderRadius="md" boxShadow="md" w="full">
      <VStack spacing={4} p={4} align="stretch">
        <Heading mb={2} as="h2" size="lg">Detalles de producto:</Heading>
        <HStack spacing={4} align="start">
          {pedido.imageUrl && (
            <Image 
              src={pedido.imageUrl} 
              alt={selectedProduct.name}
              boxSize="300px"
              objectFit="cover"
              borderRadius="md"
            />
          )}
          <VStack paddingLeft={4} paddingRight={4} align="start" spacing={2}>
            <Text fontWeight="bold">Producto Seleccionado:</Text>
            <Text>{selectedProduct.boxCode} | {selectedProduct.name}</Text>
            <Text fontWeight="bold">Código de Producto:</Text>
            <Text>{selectedProduct.productCode}</Text>
            <Text fontWeight="bold">Piezas por caja:</Text>
            <Text>{selectedProduct.piecesPerBox}</Text>
          </VStack>
          <VStack align="start" spacing={2}>
          <Text fontWeight="bold">Stock Actual:</Text>
            {stockDisplay.map((location, index) => (
              <Text key={index}>
                <strong>{location.location}:</strong>
                {location.boxes > 0 && ` ${location.boxes} ${location.boxes === 1 ? 'caja' : 'cajas'}`}
                {location.boxes > 0 && location.loosePieces > 0 && ' y'}
                {location.loosePieces > 0 && ` ${location.loosePieces} ${location.loosePieces === 1 ? 'pieza' : 'piezas'}`}
                {' | Total: '}{location.total} {location.total === 1 ? 'pieza' : 'piezas'}
              </Text>
            ))}
          </VStack>
        </HStack>

        <FormControl>
          <FormLabel fontWeight="bold">Ubicación origen:</FormLabel>
          <Select
            value={pedido.fromLocation}
            onChange={(e) => onPedidoChange('fromLocation', e.target.value)}
          >
            <option value="">Seleccione ubicación origen</option>
            {stockDisplay.map((loc, index) => (
              <option key={index} value={loc.location}>
                {loc.location} | 
                {loc.boxes > 0 && ` ${loc.boxes} ${loc.boxes === 1 ? 'caja' : 'cajas'}`}
                {loc.boxes > 0 && loc.loosePieces > 0 && ' y'}
                {loc.loosePieces > 0 && ` ${loc.loosePieces} ${loc.loosePieces === 1 ? 'pieza' : 'piezas'}`}
                {' | Total: '}{loc.total} {loc.total === 1 ? 'pieza' : 'piezas'}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontWeight="bold">Ubicación destino:</FormLabel>
          {canChooseDestination ? (
            <Select
              value={pedido.toLocation}
              onChange={(e) => onPedidoChange('toLocation', e.target.value)}
            >
              <option value="">Seleccione ubicación destino</option>
              {allLocations.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))}
            </Select>
          ) : (
            <Text color="blue.500" fontWeight="semibold">{userLocation}</Text>
          )}
        </FormControl>

        <FormControl>
          <FormLabel fontWeight="bold">Cantidad solicitada:</FormLabel>
          <NumberInput
            value={pedido.quantity}
            onChange={handleQuantityChange}
            min={0}
            max={safeMaxQuantity}
            keepWithinRange={true}
            clampValueOnBlur={false}
          >
            <NumberInputField />
          </NumberInput>
          {pedido.quantity !== '' && Number(pedido.quantity) > 0 && (
            <Text fontSize="sm" color="gray.600" mt={1}>
              Conversión a cajas y piezas: {formatQuantityDisplay(Number(pedido.quantity))}
            </Text>
          )}
          <Text fontSize="sm" color="gray.600" mt={1}>
            Cantidad máxima disponible: {maxQuantity} piezas 
            ({formatQuantityDisplay(maxQuantity)})
          </Text>
        </FormControl>

        <Button
          colorScheme="blue"
          onClick={onAddToPedidoList}
          isDisabled={
            !pedido.fromLocation || 
            pedido.quantity === '' ||
            Number(pedido.quantity) === 0 ||
            Number(pedido.quantity) > safeMaxQuantity ||
            (canChooseDestination && !pedido.toLocation)
          }
        >
          Agregar a la lista
        </Button>
      </VStack>
    </Box>
  );
};

export default PedidoDetails;