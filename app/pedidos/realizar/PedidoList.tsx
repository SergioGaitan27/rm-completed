import React from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Text,
  Button,
  Flex,
} from "@chakra-ui/react";
import Image from 'next/image';
import { IPedidoList } from '@/app/types/product';

interface PedidoListProps {
  pedidoList: IPedidoList[];
  onRemovePedido: (index: number) => void;
}

const formatQuantityDisplay = (quantity: number | string, piecesPerBox: number) => {
  const numQuantity = Number(quantity);
  if (isNaN(numQuantity) || numQuantity === 0) return '';
  const boxes = Math.floor(numQuantity / piecesPerBox);
  const loosePieces = numQuantity % piecesPerBox;
  return `${boxes} ${boxes === 1 ? 'caja' : 'cajas'}${loosePieces > 0 ? ` y ${loosePieces} ${loosePieces === 1 ? 'pieza' : 'piezas'}` : ''}`;
};

const PedidoList: React.FC<PedidoListProps> = ({ pedidoList, onRemovePedido }) => {
  const totalProducts = pedidoList.reduce((total, item) => total + Number(item.quantity), 0);

  return (
    <Box bg="white" p={6} borderRadius="md" boxShadow="md" w="full">
      <Heading as="h2" size="lg" mb={4} textAlign="center">
        Lista de productos en el pedido.
      </Heading>
      <SimpleGrid columns={[1, null, 2]} spacing={6}>
        {pedidoList.map((item, index) => (
          <Card key={index}>
            <CardBody>
              <Flex>
                {item.imageUrl && (
                  <Box w="100px" h="100px" position="relative" mr={4}>
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                )}
                <Stack spacing={2}>
                  <Heading size="md">{item.productName}</Heading>
                  <Text><strong>Código de Producto:</strong> {item.productCode}</Text>
                  <Text><strong>Código de Caja:</strong> {item.boxCode}</Text>
                  <Text><strong>Desde:</strong> {item.fromLocation}</Text>
                  <Text><strong>Hacia:</strong> {item.toLocation}</Text>
                  <Text><strong>Cantidad:</strong> {item.quantity} piezas ({formatQuantityDisplay(item.quantity, item.piecesPerBox)})</Text>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => onRemovePedido(index)}
                  >
                    Eliminar
                  </Button>
                </Stack>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default PedidoList;