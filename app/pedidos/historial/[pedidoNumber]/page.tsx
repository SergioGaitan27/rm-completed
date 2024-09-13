import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Flex,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  useToast,
  Badge,
} from "@chakra-ui/react";

// Actualiza la interfaz IPedidoNumber para incluir los tipos correctos
interface IPedidoItem {
  productName: string;
  productCode: string;
  boxCode: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  piecesPerBox: number;
}

interface IPedidoNumber {
  _id: string;
  date: string;
  pedidos: IPedidoItem[];
  isSurtido: boolean;
}

const formatQuantityDisplay = (quantity: number, piecesPerBox: number): string => {
  if (isNaN(quantity) || quantity === 0) return '';
  const boxes = Math.floor(quantity / piecesPerBox);
  const loosePieces = quantity % piecesPerBox;
  return `${boxes} ${boxes === 1 ? 'caja' : 'cajas'}${loosePieces > 0 ? ` y ${loosePieces} ${loosePieces === 1 ? 'pieza' : 'piezas'}` : ''}`;
};

const PedidoDetallePage = ({ params }: { params: { pedidoNumber: string } }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [pedido, setPedido] = useState<IPedidoNumber | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPedidoDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/pedidos/${params.pedidoNumber}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener los detalles del pedido');
      }
      const data: IPedidoNumber = await response.json();
      setPedido(data);
    } catch (error) {
      console.error('Error al obtener los detalles del pedido:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al obtener los detalles del pedido',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.pedidoNumber, toast]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPedidoDetails();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, fetchPedidoDetails]);

  if (status === 'loading' || isLoading) {
    return (
      <Flex minH="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!session) return null;
  if (!pedido) return <Text>No se encontró el pedido</Text>;

  const totalUnidades = pedido.pedidos.reduce((acc, t) => acc + t.quantity, 0);
  const piecesPerBoxForTotal = pedido.pedidos[0]?.piecesPerBox || 1;

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">Detalles del Pedido</Heading>
          
          <Card>
            <CardBody>
              <Heading as="h2" size="lg" mb={4}>Información General</Heading>
              <Stack spacing={2}>
                <Text><strong>ID de Pedido:</strong> {pedido._id}</Text>
                <Text><strong>Fecha:</strong> {new Date(pedido.date).toLocaleString()}</Text>
                <Text><strong>Total de Productos:</strong> {pedido.pedidos.length}</Text>
                <Text>
                  <strong>Total de Unidades:</strong> {totalUnidades}
                  {' '}
                  ({formatQuantityDisplay(totalUnidades, piecesPerBoxForTotal)})
                </Text>
                <Flex alignItems="center">
                  <Text mr={2}><strong>Estado:</strong></Text>
                  <Badge colorScheme={pedido.isSurtido ? "green" : "yellow"}>
                    {pedido.isSurtido ? "Surtido" : "Pendiente"}
                  </Badge>
                </Flex>
              </Stack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading as="h2" size="lg" mb={4}>Productos Solicitados</Heading>
              <VStack spacing={4} align="stretch">
                {pedido.pedidos.map((item, index) => (
                  <Box key={index} p={4} borderWidth={1} borderRadius="md">
                    <Heading as="h3" size="md" mb={2}>{item.productName}</Heading>
                    <SimpleGrid columns={[1, 2]} spacing={2}>
                      <Text><strong>Código de Producto:</strong> {item.productCode}</Text>
                      <Text><strong>Código de Caja:</strong> {item.boxCode}</Text>
                      <Text><strong>Desde:</strong> {item.fromLocation}</Text>
                      <Text><strong>Hacia:</strong> {item.toLocation}</Text>
                      <Text>
                        <strong>Cantidad:</strong> {item.quantity}
                        {' '}
                        ({formatQuantityDisplay(item.quantity, item.piecesPerBox)})
                      </Text>
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          <Button 
            onClick={() => router.back()} 
            colorScheme="blue"
            size="lg"
          >
            Volver al Historial
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default PedidoDetallePage;