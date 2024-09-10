// app/categorias/LogoutButton.tsx
'use client';

import { Button } from "@chakra-ui/react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <Button
      colorScheme="red"
      onClick={() => signOut({ callbackUrl: '/login' })}
      width={{ base: "full", sm: "auto" }}
      fontSize={{ base: "sm", sm: "md" }}
      py={{ base: 2, sm: 3 }}
    >
      Cerrar Sesión
    </Button>
  );
}