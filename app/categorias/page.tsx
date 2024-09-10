// app/categorias/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Box, Container, Heading, SimpleGrid, Text, Flex } from "@chakra-ui/react";
import CategoryCard from "./CategoryCard";
import { getAuthOptions } from "@/app/lib/actions/auth";
import LogoutButton from "./LogoutButton";
import { UserRole, Category, roleCategories } from "@/app/lib/actions/categories";

export default async function CategoriesPage() {
  const session = await getServerSession(getAuthOptions());

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user?.role as UserRole;
  const userName = session.user?.name;
  const categories = roleCategories[userRole] || [];
  const userLocation = session.user?.location;

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <Flex justifyContent="space-between" alignItems="center" mb={8}>
          <Box>
            <Heading as="h1" mb={2}>Bienvenido: {userName}</Heading>
            <Text color="gray.600">Rol: {userRole}</Text>
              <Text color="gray.600">Ubicación Actual: {userLocation}</Text>
          </Box>
          <LogoutButton />
        </Flex>
        {categories.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {categories.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </SimpleGrid>
        ) : (
          <Text>No categories available for your role.</Text>
        )}
      </Container>
    </Box>
  );
}