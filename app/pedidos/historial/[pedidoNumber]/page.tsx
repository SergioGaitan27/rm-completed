'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Input,
} from "@chakra-ui/react";

import { IPedidoNumber, IPedidoItem } from '@/app/types/product';
import { UserRole } from '@/app/lib/actions/categories';

const calculateBoxesAndPieces = (quantity: number, piecesPerBox: number): string => {
  if (piecesPerBox <= 1) return `${quantity} piezas`;
  
  const boxes = Math.floor(quantity / piecesPerBox);
  const pieces = quantity % piecesPerBox;
  let result = '';
  if (boxes > 0) result += `${boxes} caja${boxes > 1 ? 's' : ''}`;
  if (boxes > 0 && pieces > 0) result += ' y ';
  if (pieces > 0) result += `${pieces} pieza${pieces > 1 ? 's' : ''}`;
  return result;
};

const PedidoDetallePage = ({ params }: { params: { pedidoNumber: string } }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [pedido, setPedido] = useState<IPedidoNumber | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evidenceImage, setEvidenceImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPedidoDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/pedidos/${params.pedidoNumber}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener los detalles del pedido');
      }
      const data = await response.json();
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceImage(e.target.files[0]);
    }
  };

  const handleSurtirPedido = async () => {
    if (!evidenceImage) {
      toast({
        title: "Error",
        description: "Por favor, sube una imagen de evidencia antes de marcar como surtido.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload image to Cloudinary
      const formData = new FormData();
      formData.append('file', evidenceImage);
      formData.append('upload_preset', 'xgmwzgac');

      const imageResponse = await fetch('https://api.cloudinary.com/v1_1/dpsrtoyp7/image/upload', {
        method: 'POST',
        body: formData
      });

      if (!imageResponse.ok) {
        throw new Error('Error al subir la imagen de evidencia');
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.secure_url;

      // Update pedido status and add evidence image URL
      const response = await fetch(`/api/pedidos/${params.pedidoNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSurtido: true, evidenceImageUrl: imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el pedido');
      }

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido marcado como surtido y se ha subido la imagen de evidencia.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchPedidoDetails(); // Reload pedido details
    } catch (error) {
      console.error('Error al marcar el pedido como surtido:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar el pedido como surtido o subir la imagen",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const canMarkAsSurtido = useCallback(() => {
    const userRole = session?.user?.role as UserRole;
    return userRole === 'super_administrador' || userRole === 'sistemas';
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <Flex minH="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!session) return null;
  if (!pedido) return <Text>No se encontró el pedido</Text>;

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
                  <strong>Total de Unidades:</strong> {pedido.pedidos.reduce((acc, t) => acc + t.quantity, 0)}
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
              <Heading as="h2" size="lg" mb={4}>Productos solicitados</Heading>
              <VStack spacing={4} align="stretch">
                {pedido.pedidos.map((item: IPedidoItem, index: number) => (
                  <Box key={index} p={4} borderWidth={1} borderRadius="md">
                    <Heading as="h3" size="md" mb={2}>{item.productName}</Heading>
                    <SimpleGrid columns={[1, 2]} spacing={2}>
                      <Text><strong>Código de Producto:</strong> {item.productCode}</Text>
                      <Text><strong>Código de Caja:</strong> {item.boxCode}</Text>
                      <Text><strong>Desde:</strong> {item.fromLocation}</Text>
                      <Text><strong>Hacia:</strong> {item.toLocation}</Text>
                      <Text>
                        <strong>Cantidad:</strong> {item.quantity} ({calculateBoxesAndPieces(item.quantity, item.piecesPerBox)})
                      </Text>
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {!pedido.isSurtido && canMarkAsSurtido() && (
            <Card>
              <CardBody>
                <Heading as="h2" size="lg" mb={4}>Marcar como surtido</Heading>
                <VStack spacing={4} align="stretch">
                  <Text>Sube una imagen como evidencia antes de marcar el pedido como surtido:</Text>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    mb={4}
                  />
                  {evidenceImage && (
                    <Image
                      src={URL.createObjectURL(evidenceImage)}
                      alt="Vista previa de la evidencia"
                      width={300}
                      height={200}
                      objectFit="contain"
                    />
                  )}
                  <Button
                    onClick={handleSurtirPedido}
                    colorScheme="green"
                    isLoading={isUploading}
                    loadingText="Subiendo..."
                    isDisabled={!evidenceImage}
                  >
                    Marcar como Surtido y Subir Evidencia
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}

          {pedido.evidenceImageUrl && (
            <Card>
              <CardBody>
                <Heading as="h2" size="lg" mb={4}>Evidencia</Heading>
                <Image
                  src={pedido.evidenceImageUrl}
                  alt="Evidencia del pedido surtido"
                  width={300}
                  height={200}
                  objectFit="contain"
                />
              </CardBody>
            </Card>
          )}

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