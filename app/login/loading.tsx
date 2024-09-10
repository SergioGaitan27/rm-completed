// app/login/loading.tsx
import { 
    Box, 
    Container, 
    Stack, 
    Skeleton,
  } from "@chakra-ui/react";
  
  export default function LoginLoading() {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
          <Stack spacing="8">
            <Skeleton height="40px" width="200px" mx="auto" />
            <Box
              py={{ base: '0', sm: '8' }}
              px={{ base: '4', sm: '10' }}
              bg="white"
              boxShadow={{ base: 'none', sm: 'md' }}
              borderRadius={{ base: 'none', sm: 'xl' }}
            >
              <Stack spacing="6">
                <Skeleton height="40px" />
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }