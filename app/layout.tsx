// app/layout.tsx
'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { Inter } from 'next/font/google'
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ChakraProvider>
            {children}
          </ChakraProvider>
        </SessionProvider>
      </body>
    </html>
  )
}