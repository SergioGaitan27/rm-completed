'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  Flex,
  Spinner,
  useDisclosure,
  Collapse,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  useToast,
  Badge,
  Select,
} from "@chakra-ui/react";
import { IPedidos } from '@/app/types/product';

const HistorialPedidosPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isFiltersOpen, onToggle: toggleFilters } = useDisclosure();

  const [pedidos, setPedidos] = useState<IPedidos[]>([]);
  const [filteredPedidos, setFilteredPedidos] = useState<IPedidos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPedidos = async () => {
    try {
      const response = await fetch('/api/pedidos');
      if (!response.ok) throw new Error('Error al obtener los pedidos');
      const data = await response.json();
      setPedidos(data);
      setFilteredPedidos(data);
    } catch (error) {
      console.error('Error al cargar los pedidos:', error);
      toast({
        title: "Error",
        description: "Error al cargar el historial de pedidos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPedidos();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const filterPedidos = useCallback(() => {
    let filtered = pedidos;

    if (startDate || endDate) {
      filtered = filtered.filter(pedido => {
        const pedidoDate = new Date(pedido.date);
        pedidoDate.setHours(0, 0, 0, 0);

        let isInRange = true;

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          isInRange = isInRange && pedidoDate >= start;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          isInRange = isInRange && pedidoDate <= end;
        }

        return isInRange;
      });
    }

    if (destinationFilter) {
      filtered = filtered.filter(pedido => 
        pedido.pedidos.some(t => 
          t.toLocation.toLowerCase().includes(destinationFilter.toLowerCase()) ||
          t.fromLocation.toLowerCase().includes(destinationFilter.toLowerCase())
        )
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(pedido => 
        statusFilter === 'surtido' ? pedido.isSurtido : !pedido.isSurtido
      );
    }

    setFilteredPedidos(filtered);
  }, [pedidos, startDate, endDate, destinationFilter, statusFilter]);

  useEffect(() => {
    filterPedidos();
  }, [filterPedidos]);

  const canMarkAsSurtido = useCallback(() => {
    const userRole = session?.user?.role;
    return userRole === 'super_administrador' || userRole === 'sistemas';
  }, [session]);

  const handleSurtirPedido = async (pedidoId: string) => {
    if (!canMarkAsSurtido()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para realizar esta acción",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSurtido: true }),
      });

      if (!response.ok) throw new Error('Error al actualizar el pedido');

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido marcado como surtido",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchPedidos(); // Recargar los pedidos
    } catch (error) {
      console.error('Error al marcar el pedido como surtido:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar el pedido como surtido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <Flex minH="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!session) return null;

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">Historial de pedidos</Heading>
          
          <Button onClick={toggleFilters} colorScheme="blue">
            {isFiltersOpen ? 'Ocultar filtros' : 'Filtrar pedidos'}
          </Button>

          <Collapse in={isFiltersOpen} animateOpacity>
            <SimpleGrid columns={[1, null, 2, 4]} spacing={4} bg="white" p={4} borderRadius="md" boxShadow="md">
              <Box>
                <Text mb={2}>Fecha inicial:</Text>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2}>Fecha final:</Text>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2}>Origen o destino:</Text>
                <Input
                  placeholder="Filtrar por origen o destino"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2}>Estado:</Text>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="surtido">Surtido</option>
                  <option value="pendiente">Pendiente</option>
                </Select>
              </Box>
            </SimpleGrid>
          </Collapse>

          {filteredPedidos.length === 0 ? (
            <Text>No hay pedidos en el historial que coincidan con los filtros.</Text>
          ) : (
            <SimpleGrid columns={[1, null, 2]} spacing={6}>
              {filteredPedidos.map((pedido) => {
                const pedidoDate = new Date(pedido.date);
                const origenDestino = pedido.pedidos.map(t => `${t.fromLocation} → ${t.toLocation}`);
                const uniqueOrigenDestino = Array.from(new Set(origenDestino));
                return (
                  <Card 
                    key={pedido._id} 
                    borderWidth={2}
                    borderColor={pedido.isSurtido ? "green.500" : "gray.200"}
                  >
                    <CardBody>
                      <Stack spacing={3}>
                        <Flex justifyContent="space-between" alignItems="center">
                          <Text><strong>Fecha:</strong> {pedidoDate.toLocaleDateString()}</Text>
                          <Badge colorScheme={pedido.isSurtido ? "green" : "yellow"}>
                            {pedido.isSurtido ? "Surtido" : "Pendiente"}
                          </Badge>
                        </Flex>
                        <Text><strong>Hora:</strong> {pedidoDate.toLocaleTimeString()}</Text>
                        <Text><strong>Total de productos:</strong> {pedido.pedidos.length}</Text>
                        <Text><strong>Total de unidades:</strong> {pedido.pedidos.reduce((acc, t) => acc + t.quantity, 0)}</Text>
                        <Text><strong>Origen → Destino:</strong> {uniqueOrigenDestino.join(', ')}</Text>
                        <Flex justifyContent="space-between">
                          <Link href={`/pedidos/historial/${pedido._id}`} passHref>
                            <Button as="a" colorScheme="blue">
                              Ver detalles
                            </Button>
                          </Link>
                          {!pedido.isSurtido && canMarkAsSurtido() && (
                            <Button 
                              colorScheme="green" 
                              onClick={() => handleSurtirPedido(pedido._id)}
                            >
                              Marcar como surtido
                            </Button>
                          )}
                        </Flex>
                      </Stack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default HistorialPedidosPage;