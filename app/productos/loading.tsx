// app/catalogo/loading.tsx
import { Box, Container, Skeleton, SimpleGrid } from "@chakra-ui/react";

export default function CatalogoLoading() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <Skeleton height="40px" width="200px" mb={4} />
        <Skeleton height="20px" width="300px" mb={8} />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} height="200px" />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}