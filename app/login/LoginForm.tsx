// app/login/LoginForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Box, 
  Button, 
  Checkbox, 
  Container, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  Stack, 
  Text, 
  useColorModeValue,
  VStack
} from "@chakra-ui/react";

export default function LoginForm() {
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        
        try {
            const formData = new FormData(event.currentTarget);
            const res = await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirect: false,
            });
    
            if (res?.error === "InvalidCredentials") {
                setError("Credenciales inválidas. Por favor, intenta de nuevo.");
            } else if (res?.error) {
                setError(`Error en el inicio de sesión: ${res.error}`);
            } else if (res?.ok) {
                router.push("/categorias");
            }
        } catch (error) {
            console.error("Error durante el inicio de sesión:", error);
            setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
        }
    };

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
            <Stack spacing="8">
                    <Stack spacing="6">
                        <VStack spacing="2" align="center">
                            {/* <Image src="/icon.png" alt="Logo" width={80} height={80} /> */}
                            <Heading size="xl" fontWeight="extrabold">
                                Iniciar Sesión
                            </Heading>
                        </VStack>
                    </Stack>
                    <Box
                        py={{ base: '0', sm: '8' }}
                        px={{ base: '4', sm: '10' }}
                        bg={useColorModeValue('white', 'gray.800')}
                        boxShadow={{ base: 'none', sm: 'md' }}
                        borderRadius={{ base: 'none', sm: 'xl' }}
                    >
                        <form onSubmit={handleSubmit}>
                            <Stack spacing="6">
                                {error && (
                                    <Text color="red.500" textAlign="center">
                                        {error}
                                    </Text>
                                )}
                                <Stack spacing="5">
                                    <FormControl>
                                        <FormLabel htmlFor="email">Correo Electrónico</FormLabel>
                                        <Input id="email" name="email" type="email" required />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel htmlFor="password">Contraseña</FormLabel>
                                        <Input id="password" name="password" type="password" required />
                                    </FormControl>
                                </Stack>
                                <Stack spacing="6">
                                    <Stack direction="row" align="center" justify="space-between">
                                        <Checkbox 
                                            isChecked={rememberMe} 
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        >
                                            Recordarme
                                        </Checkbox>
                                    </Stack>
                                    <Button type="submit" colorScheme="yellow" variant="solid">
                                        Iniciar Sesión
                                    </Button>
                                </Stack>
                            </Stack>
                        </form>
                    </Box>
                    <Text fontSize="sm" textAlign="center">
                        ¿No tienes una cuenta?{' '}
                        <Link href="/register" style={{ color: 'yellow.400' }}>
                            Regístrate
                        </Link>
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}