// app/layout.tsx
'use client'

import { ChakraProvider } from '@chakra-ui/react';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Provider from './provider'; // Importa el Provider

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ChakraProvider>
            <Provider> {/* Envuelve con QueryClientProvider */}
              {children}
              <Toaster />
            </Provider>
          </ChakraProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
