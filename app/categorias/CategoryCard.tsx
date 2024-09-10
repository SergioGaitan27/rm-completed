// app/categorias/CategoryCard.tsx
import { Box, Heading, Text, VStack, Link } from "@chakra-ui/react";

interface CategoryCardProps {
  name: string;
  description: string;
  link: string;
}

export default function CategoryCard({ name, description, link }: CategoryCardProps) {
  return (
    <Link href={link} _hover={{ textDecoration: 'none' }}>
      <Box
        borderWidth={1}
        borderRadius="lg"
        p={6}
        bg="white"
        boxShadow="md"
        transition="all 0.3s"
        _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
      >
        <VStack align="start" spacing={3}>
          <Heading as="h3" size="md">
            {name}
          </Heading>
          <Text>{description}</Text>
        </VStack>
      </Box>
    </Link>
  );
}