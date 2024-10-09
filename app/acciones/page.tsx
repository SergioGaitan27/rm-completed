// MobileSalesPage.tsx
"use client"

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import MobileProductCard from '@/app/components/MobileProductCard'; 
import ProductCard from '@/app/components/ProductCard'; 
import { toast } from 'react-hot-toast';
import { Product, CartItem, IBusinessInfo, IStockLocation } from '@/app/types/product';
import PriceAdjustmentModal from '@/app/components/PriceAdjustmentModal';
import ProductInfo from '@/app/components/ProductInfo';
import ConectorPluginV3 from '@/app/utils/ConectorPluginV3';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';

const MobileConfirmModal = lazy(() => import('@/app/components/MobileConfirmModal'));
const PaymentModal = lazy(() => import('@/app/components/PaymentModal'));
const CorteModal = lazy(() => import('@/app/components/CorteModal'));
const CorteConfirmationModal = lazy(() => import('@/app/components/CorteConfirmationModal'));
const CashOutModal = lazy(() => import('@/app/components/CashOutModal'));
const CashInModal = lazy(() => import('@/app/components/CashInModal'));


interface AdjustedCartItem extends CartItem {
    adjustedPrice?: number;
}

interface CashMovement {
  amount: number;
  concept: string;
  type: 'in' | 'out';
  date: string; // O Date, dependiendo de cómo lo manejes
  location: string;
}

interface CorteResults {
  location: string;
  expectedCash: number;
  expectedCard: number;
  actualCash: number;
  actualCard: number;
  totalTickets: number;
  cashMovements: CashMovement[]; // Nueva propiedad
}


const groupCartItems = (cart: CartItem[]): Record<string, CartItem[]> => {
  return cart.reduce((acc, item) => {
    if (!acc[item._id]) {
      acc[item._id] = [];
    }
    acc[item._id].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);
};

const calculateProductTotals = (items: CartItem[]): {
  boxes: number;
  loosePieces: number;
  totalPieces: number;
} => {
  let boxes = 0;
  let loosePieces = 0;

  items.forEach(item => {
    if (item.unitType === 'boxes') {
      boxes += item.quantity;
      loosePieces += (item.quantity * item.piecesPerBox) % item.piecesPerBox;
    } else {
      loosePieces += item.quantity;
    }
  });

  const totalPieces = boxes * items[0].piecesPerBox + loosePieces;
  const additionalBoxes = Math.floor(loosePieces / items[0].piecesPerBox);
  boxes += additionalBoxes;
  loosePieces = loosePieces % items[0].piecesPerBox;
  return { boxes, loosePieces, totalPieces };
};

const useDeviceType = () => {
    const [isDesktop, setIsDesktop] = useState(true);
  
    useEffect(() => {
      const handleResize = () => {
        setIsDesktop(window.innerWidth >= 768); // Considera dispositivos con ancho >= 768px como desktop
      };
  
      handleResize(); // Llamada inicial
      window.addEventListener('resize', handleResize);
  
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    return isDesktop;
  };


const MobileSalesPage: React.FC = () => {
  const isDesktop = useDeviceType();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitType, setUnitType] = useState<'pieces' | 'boxes'>('pieces');
  const [searchTermTop, setSearchTermTop] = useState('');
  const [searchTermBottom, setSearchTermBottom] = useState('');
  const [MobileProductInfoBottom, setMobileProductInfoBottom] = useState<Product | null>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<IBusinessInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const searchInputBottomRef = useRef<HTMLInputElement>(null);
  const [isMobileConfirmModalOpen, setIsMobileConfirmModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [isPriceAdjustmentModalOpen, setIsPriceAdjustmentModalOpen] = useState(false);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productInfoBottom, setProductInfoBottom] = useState<Product | null>(null);
  const [productSearchedFromBottom, setProductSearchedFromBottom] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);
  const [isCorteModalOpen, setIsCorteModalOpen] = useState(false);
  const [cashAmountCorte, setCashAmountCorte] = useState('');
  const [cardAmountCorte, setCardAmountCorte] = useState('');
  const [corteResults, setCorteResults] = useState<any>(null);
  const [isCorteLoading, setIsCorteLoading] = useState(false);
  const [showCorteConfirmation, setShowCorteConfirmation] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<{ printerName: string; paperSize: string }>({
    printerName: '',
    paperSize: '80mm',
  });
  const [selectedCartProduct, setSelectedCartProduct] = useState<Product | null>(null);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [isCashInModalOpen, setIsCashInModalOpen] = useState(false);

  useEffect(() => {
    if (searchInputBottomRef.current) {
      searchInputBottomRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Cargar la configuración de la impresora
    const savedConfig = localStorage.getItem('printerConfig');
    if (savedConfig) {
      setPrinterConfig(JSON.parse(savedConfig));
    }
  }, []);

  const printTicket = async (ticketId?: string) => {
    if (!isDesktop) return; // Solo imprimir en modo escritorio

    try {
      const conector = new ConectorPluginV3(undefined, 'YmEwNzRiYWFfXzIwMjQtMTAtMDhfXzIwMjUtMDEtMDYjIyNaVVQ5amo0ckQ1bi9DL2I2Zk1Mb002N2F4TFd4UXJBMndFWkQ1TEtoNGhhN1B1NVFjc2FVY2Uvb1l4Vjdudk43NThzWk5kdUFoU3BJWnA4SkZLejJ2aHRlOGwzcnlZV00zVXpRajNiS2xWc1VPeFhMUDQrZmFHd1JrWDRLZERLaDFtekdBZWZWa2d6Wmg5ZEV3c1NxVHkxZkMwVW5rMnU5OVdGQ0laaDI4eGpYaU1qRzVCMGVPN1lNVG5YZUtLU1A4L2swMFplOGxaMUtGQ2hraHNyZmtJcWhKYnZJTHU3MWRzR2JsWDllTVIweVpVdEkzeXVwTC93Y2ZQRjVDVmZma1d6UUEwVlhENGRFbTlTOXgwU09QaXdpcDdDUWs1Y0lTbk9zMkFjT1V4Z3NBYUNKUkNFcXZZN3ZOZy9IbkRnays1WW5Zemo5WnZ1QmQwUjdTSWs2SjMwMENoZzZESnovZVZxSEttZVFaZWV6KzR2ZFd6WDJiWlhFdm51Z1ZiTmRZOWJmcnpkNHBVTDBRalBEbXNIQmhKS0JqU3l1TDhPd2RtemdKOGhYcUJIUnpqQzdsMUN6R1MyeTRCRGR3WmwrYm5CMGpjeVUxUGFxaFBXNmhEOFQzTnNEQkVqTTREdTlJMk9HVlFSRDVUdHdZS2VsaXBPY2hidVNaa1ZIdkFtQVF2UURrZHBqQkVWb0Y3MjJkenQ3a25YeGdrSTBDWG8rZEpqNFlMMWE4UmtmQSs1NzNDZE9NQnFnN0YxUEtod2xOa2V4WllqbTFZN0ZlZjV1eFZwUjJsK1dzRUtySXNDcWxsalJZVFZQRURFMWtFQktsVkpTSldUVVVYMGxhNXM0ODV5ZjFwelRBZEZlMi9kSURCZGh4aUc1dUhTQkhhOTdhcUFFcFRBS1RFYz0=');

      await conector.Iniciar();
      let anchoCaracteres;
      switch (printerConfig.paperSize) {
        case '58mm':
          anchoCaracteres = 32;
          break;
        case '80mm':
          anchoCaracteres = 48;
          break;
        case 'A4':
          anchoCaracteres = 64;
          break;
        default:
          anchoCaracteres = 48;
      }

      if (businessInfo) {
        conector.EstablecerEnfatizado(true);
        conector.EstablecerTamañoFuente(1, 1);
        conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_IZQUIERDA);
        conector.EscribirTexto(`${businessInfo.businessName}\n`);
        conector.EstablecerEnfatizado(false);
        conector.EscribirTexto(`${businessInfo.address}\n`);
        conector.EscribirTexto(`Tel: ${businessInfo.phone}\n`);
        conector.EscribirTexto(`RFC: ${businessInfo.taxId}\n`);
        conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
      }

      conector.EstablecerEnfatizado(true);
      conector.EstablecerTamañoFuente(1, 1);
      conector.EscribirTexto(`Fecha: ${new Date().toLocaleString()}\n`);
      if (ticketId) {
        conector.EscribirTexto(`ID: ${ticketId}\n`);
      }
      conector.EstablecerEnfatizado(false);
      conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");

      cart.forEach(item => {
        const totalPieces = item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity;
        conector.EscribirTexto(`${item.name}\n`);
        conector.EscribirTexto(`${totalPieces} pzs x $${item.appliedPrice.toFixed(2)} = $${(totalPieces * item.appliedPrice).toFixed(2)}\n`);
      });
  
      conector.EscribirTexto("\n");
      conector.EscribirTexto(`Total: $${calculateTotal().toFixed(2)}\n`);
      conector.EscribirTexto(`Método de pago: ${paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}\n`);
      if (paymentType === 'cash') {
        conector.EscribirTexto(`Monto pagado: $${amountPaid}\n`);
        conector.EscribirTexto(`Cambio: $${change.toFixed(2)}\n`);
      }

      conector.Corte(1);
    
      const resultado = await conector.imprimirEn(printerConfig.printerName);
      if (typeof resultado === 'object' && resultado !== null && 'error' in resultado) {
        throw new Error(resultado.error);
      } else if (resultado !== true) {
        throw new Error('La impresión no se completó correctamente');
      }

      toast.success('Ticket impreso correctamente');
    } catch (error) {
      console.error('Error al imprimir:', error);
      if (error instanceof Error) {
        toast.error(`Error al imprimir el ticket: ${error.message}`);
      } else {
        toast.error('Error desconocido al imprimir el ticket');
      }
    }
  };

// Ejemplo: printCorteTicket.ts

const printCorteTicket = async (
  corteResults: CorteResults,
  cashAmount: number,
  cardAmount: number
) => {
  console.log('printCorteTicket llamado con:', {
    corteResults,
    cashAmount,
    cardAmount,
  });

  if (!corteResults) {
    toast.error('No hay resultados de corte para imprimir');
    console.error('corteResults es null o undefined');
    return;
  }

  try {
    const conector = new ConectorPluginV3(undefined, 'YmEwNzRiYWFfXzIwMjQtMTAtMDhfXzIwMjUtMDEtMDYjIyNaVVQ5amo0ckQ1bi9DL2I2Zk1Mb002N2F4TFd4UXJBMndFWkQ1TEtoNGhhN1B1NVFjc2FVY2Uvb1l4Vjdudk43NThzWk5kdUFoU3BJWnA4SkZLejJ2aHRlOGwzcnlZV00zVXpRajNiS2xWc1VPeFhMUDQrZmFHd1JrWDRLZERLaDFtekdBZWZWa2d6Wmg5ZEV3c1NxVHkxZkMwVW5rMnU5OVdGQ0laaDI4eGpYaU1qRzVCMGVPN1lNVG5YZUtLU1A4L2swMFplOGxaMUtGQ2hraHNyZmtJcWhKYnZJTHU3MWRzR2JsWDllTVIweVpVdEkzeXVwTC93Y2ZQRjVDVmZma1d6UUEwVlhENGRFbTlTOXgwU09QaXdpcDdDUWs1Y0lTbk9zMkFjT1V4Z3NBYUNKUkNFcXZZN3ZOZy9IbkRnays1WW5Zemo5WnZ1QmQwUjdTSWs2SjMwMENoZzZESnovZVZxSEttZVFaZWV6KzR2ZFd6WDJiWlhFdm51Z1ZiTmRZOWJmcnpkNHBVTDBRalBEbXNIQmhKS0JqU3l1TDhPd2RtemdKOGhYcUJIUnpqQzdsMUN6R1MyeTRCRGR3WmwrYm5CMGpjeVUxUGFxaFBXNmhEOFQzTnNEQkVqTTREdTlJMk9HVlFSRDVUdHdZS2VsaXBPY2hidVNaa1ZIdkFtQVF2UURrZHBqQkVWb0Y3MjJkenQ3a25YeGdrSTBDWG8rZEpqNFlMMWE4UmtmQSs1NzNDZE9NQnFnN0YxUEtod2xOa2V4WllqbTFZN0ZlZjV1eFZwUjJsK1dzRUtySXNDcWxsalJZVFZQRURFMWtFQktsVkpTSldUVVVYMGxhNXM0ODV5ZjFwelRBZEZlMi9kSURCZGh4aUc1dUhTQkhhOTdhcUFFcFRBS1RFYz0=');

    await conector.Iniciar();
    let anchoCaracteres = 48; // Por defecto para 80mm

    switch (printerConfig.paperSize) {
      case '58mm':
        anchoCaracteres = 32;
        break;
      case '80mm':
        anchoCaracteres = 48;
        break;
      case 'A4':
        anchoCaracteres = 64;
        break;
      default:
        anchoCaracteres = 48;
    }

    console.log('Ancho de caracteres para impresión:', anchoCaracteres);

    // Título del Ticket
    conector.EstablecerEnfatizado(true);
    conector.EstablecerTamañoFuente(2, 2);
    conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
    conector.EscribirTexto("TICKET DE CORTE\n\n");
    console.log('Escribiendo "TICKET DE CORTE"');

    // Información Básica
    conector.EstablecerTamañoFuente(1, 1);
    conector.EscribirTexto(`Ubicación: ${corteResults.location}\n`);
    console.log(`Escribiendo Ubicación: ${corteResults.location}`);

    conector.EscribirTexto(`Fecha: ${new Date().toLocaleString()}\n`);
    console.log(`Escribiendo Fecha: ${new Date().toLocaleString()}`);

    conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
    console.log(`Escribiendo Separador: ${"=".repeat(anchoCaracteres)}`);

    // Montos Ingresados
    conector.EscribirTexto("Montos ingresados:\n");
    console.log('Escribiendo "Montos ingresados:"');

    conector.EscribirTexto(`Efectivo: $${cashAmount.toFixed(2)}\n`);
    console.log(`Escribiendo Efectivo ingresado: $${cashAmount.toFixed(2)}`);

    conector.EscribirTexto(`Tarjeta: $${cardAmount.toFixed(2)}\n`);
    console.log(`Escribiendo Tarjeta ingresada: $${cardAmount.toFixed(2)}`);

    conector.EscribirTexto(`Total ingresado: $${(cashAmount + cardAmount).toFixed(2)}\n`);
    console.log(`Escribiendo Total ingresado: $${(cashAmount + cardAmount).toFixed(2)}`);

    conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
    console.log(`Escribiendo Separador: ${"=".repeat(anchoCaracteres)}`);

    // Resultados Esperados
    const cashInMovements = corteResults.cashMovements.filter(mov => mov.type === 'in');
    const totalCashIn = cashInMovements.reduce((sum, mov) => sum + mov.amount, 0);
    const cashOutMovements = corteResults.cashMovements.filter(mov => mov.type === 'out');
    const totalCashOut = cashOutMovements.reduce((sum, mov) => sum + mov.amount, 0);
    const totalSalesCash = corteResults.expectedCash - totalCashIn ;
    const totalCash = totalSalesCash + totalCashIn;
    
    conector.EscribirTexto("Resultados esperados:\n");
    console.log('Escribiendo "Resultados esperados:"');

    conector.EscribirTexto(`Efectivo Total: $${totalCash.toFixed(2)}\n`);
    console.log(`Escribiendo Efectivo Total: $${totalCash.toFixed(2)}`);
    conector.EscribirTexto("Entradas de Efectivo:\n");
    console.log('Escribiendo "Entradas de Efectivo:"');

    cashInMovements.forEach(mov => {
      conector.EscribirTexto(`${mov.concept}: $${mov.amount.toFixed(2)}\n`);
      console.log(`Escribiendo Entrada: ${mov.concept}: $${mov.amount.toFixed(2)}`);
    });

    conector.EscribirTexto(`Total Entradas: $${totalCashIn.toFixed(2)}\n`);
    console.log(`Escribiendo Total Entradas: $${totalCashIn.toFixed(2)}`);

    conector.EscribirTexto("Salidas de Efectivo:\n");
    console.log('Escribiendo "Salidas de Efectivo:"');

    cashOutMovements.forEach(mov => {
      conector.EscribirTexto(`${mov.concept}: $${mov.amount.toFixed(2)}\n`);
      console.log(`Escribiendo Salida: ${mov.concept}: $${mov.amount.toFixed(2)}`);
    });

    conector.EscribirTexto(`Total Salidas: $${totalCashOut.toFixed(2)}\n`);
    console.log(`Escribiendo Total Salidas: $${totalCashOut.toFixed(2)}`);

    conector.EscribirTexto(`Total de venta: $${totalSalesCash.toFixed(2)}\n`);
    console.log(`Escribiendo Total de venta: $${totalSalesCash.toFixed(2)}`);

    conector.EscribirTexto(`Total tarjeta: $${corteResults.expectedCard.toFixed(2)}\n`);
    console.log(`Escribiendo Total tarjeta: $${corteResults.expectedCard.toFixed(2)}`);

    conector.EscribirTexto(`Total esperado: $${(corteResults.expectedCash + corteResults.expectedCard).toFixed(2)}\n`);
    console.log(`Escribiendo Total esperado: $${(corteResults.expectedCash + corteResults.expectedCard).toFixed(2)}`);

    conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
    console.log(`Escribiendo Separador: ${"=".repeat(anchoCaracteres)}`);

    // Diferencias
    const cashDifference = cashAmount - corteResults.expectedCash;
    const cardDifference = cardAmount - corteResults.expectedCard;
    const totalDifference = cashDifference + cardDifference;

    conector.EscribirTexto("Diferencias:\n");
    console.log('Escribiendo "Diferencias:"');

    conector.EscribirTexto(`Efectivo: $${cashDifference.toFixed(2)} (${cashDifference >= 0 ? 'Sobra' : 'Falta'})\n`);
    console.log(`Escribiendo Diferencia Efectivo: $${cashDifference.toFixed(2)} (${cashDifference >= 0 ? 'Sobra' : 'Falta'})`);

    conector.EscribirTexto(`Tarjeta: $${cardDifference.toFixed(2)} (${cardDifference >= 0 ? 'Sobra' : 'Falta'})\n`);
    console.log(`Escribiendo Diferencia Tarjeta: $${cardDifference.toFixed(2)} (${cardDifference >= 0 ? 'Sobra' : 'Falta'})`);

    conector.EscribirTexto(`Total: $${totalDifference.toFixed(2)} (${totalDifference >= 0 ? 'Sobra' : 'Falta'})\n`);
    console.log(`Escribiendo Diferencia Total: $${totalDifference.toFixed(2)} (${totalDifference >= 0 ? 'Sobra' : 'Falta'})`);

    conector.EscribirTexto("\n");
    console.log('Escribiendo línea en blanco');


    conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
    console.log(`Escribiendo Separador: ${"=".repeat(anchoCaracteres)}`);

    // Solicitar Corte de Papel
    conector.Corte(1);
    console.log('Solicitando corte de papel');

    // Ejecutar la impresión
    const resultado = await conector.imprimirEn(printerConfig.printerName);
    console.log('Resultado de la impresión:', resultado);

    // Manejo de Errores de Impresión
    if (typeof resultado === 'object' && resultado !== null && 'error' in resultado) {
      throw new Error(resultado.error);
    } else if (resultado !== true) {
      throw new Error('La impresión no se completó correctamente');
    }

    toast.success('Ticket de corte impreso correctamente');
  } catch (error: any) {
    console.error('Error al imprimir el ticket de corte:', error);
    if (error instanceof Error) {
      toast.error(`Error al imprimir el ticket de corte: ${error.message}`);
    } else {
      toast.error('Error desconocido al imprimir el ticket de corte');
    }
  }
};

  useEffect(() => {
    // Generar un ID de dispositivo único si no existe
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setDeviceId(newDeviceId);
      localStorage.setItem('deviceId', newDeviceId);
    }

    // Obtener coordenadas GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error obteniendo la ubicación:", error);
          toast.error("No se pudo obtener la ubicación GPS");
        }
      );
    } else {
      toast.error("Geolocalización no soportada en este dispositivo");
    }
  }, []);

  const fetchBusinessInfo = useCallback(async () => {
    if (!session || !session.user?.location) return;
    
    try {
      const response = await fetch(`/api/business?location=${encodeURIComponent(session.user.location)}`);
      if (!response.ok) {
        throw new Error('Error al obtener la información del negocio');
      }
      const data = await response.json();
      setBusinessInfo(data);
    } catch (error) {
      console.error('Error al obtener la información del negocio:', error);
    }
  }, [session]);

  useEffect(() => {
    fetchBusinessInfo();
  }, [fetchBusinessInfo]);

  const fetchProducts = useCallback(async () => {
    if (isProductsLoaded && !isInitialLoad) return;
    setIsUpdating(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      const data = await response.json();
      setProducts(data);
      setIsProductsLoaded(true);
      if (isInitialLoad) {
        setIsInitialLoad(false);
        toast.success('Productos cargados correctamente');
      } else {
        toast.success('Productos actualizados correctamente');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar/actualizar productos');
    } finally {
      setIsUpdating(false);
    }
  }, [isInitialLoad, isProductsLoaded]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && isInitialLoad) {
      fetchProducts();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, session, fetchProducts, isInitialLoad]);

  const applyPriceToCart = (priceType: 'regular' | 'mayoreo' | 'caja') => {
    const updatedCart = cart.map(item => {
      let newPrice;
      switch (priceType) {
        case 'mayoreo':
          newPrice = item.price2;
          break;
        case 'caja':
          newPrice = item.price3;
          break;
        case 'regular':
        default:
          newPrice = item.price1;
          break;
      }
      return {
        ...item,
        appliedPrice: newPrice
      };
    });
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    toast.success(`Precio ${priceType === 'regular' ? 'regular' : priceType} aplicado a todos los productos`);
  };

  const handleOpenCashOutModal = () => {
    setIsCashOutModalOpen(true);
  };

  const handleCloseCashOutModal = () => {
    setIsCashOutModalOpen(false);
  };

  const handleOpenCashInModal = () => {
    setIsCashInModalOpen(true);
  };

  const handleCloseCashInModal = () => {
    setIsCashInModalOpen(false);
  };

  const handleCashOutSubmit = async (amount: number, concept: string) => {
    try {
      const response = await fetch('/api/cashMovements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: -amount, concept, type: 'out', location: session?.user?.location }),
      });
      if (!response.ok) throw new Error('Error al registrar la salida de efectivo');
      toast.success('Salida de efectivo registrada');
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar la salida de efectivo');
    }
  };

  const handleCashInSubmit = async (amount: number, concept: string) => {
    try {
      const response = await fetch('/api/cashMovements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, concept, type: 'in', location: session?.user?.location }),
      });
      if (!response.ok) throw new Error('Error al registrar la entrada de efectivo');
      toast.success('Entrada de efectivo registrada');
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar la entrada de efectivo');
    }
  };

  const handleCorteCommand = () => {
    setIsCorteModalOpen(true);
    setCashAmountCorte('');
    setCardAmountCorte('');
    setCorteResults(null);
  };


  const handleSearchTop = () => {
    const searchTerm = searchTermTop.trim().toUpperCase();
    switch (searchTerm) {
      case 'ACTUALIZAR':
        fetchProducts();
        setSearchTermTop('');
        break;
      case 'CORTE':
        handleCorteCommand();
        setSearchTermTop('');
        break;
      case 'SALIDA':
        handleOpenCashOutModal();
        setSearchTermTop('');
        break;
      case 'ENTRADA':
        handleOpenCashInModal();
        setSearchTermTop('');
        break;
      case 'P-MAYOREO':
        applyPriceToCart('mayoreo');
        setSearchTermTop('');
        break;
      case 'P-CAJA':
        applyPriceToCart('caja');
        break;
      case 'P-REGULAR':
        applyPriceToCart('regular');
        break;
      case '231089-P':
        setIsPriceAdjustmentModalOpen(true);
        break;
      case 'INFO':
        printBusinessInfoTicket();
        break;
      case 'PEDIDO':
        window.open('/pedidos', '_blank');
        break;
        default:
            const result = products.find(product => 
              product.boxCode.toLowerCase() === searchTerm.toLowerCase() ||
              product.productCode.toLowerCase() === searchTerm.toLowerCase() ||
              product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
          
            if (result) {
              setSelectedProduct(result);
              setMobileProductInfoBottom(result);
              // Actualizar ProductInfo al mismo tiempo
              setProductInfoBottom(result);
              setProductSearchedFromBottom(true);
              if (result.boxCode.toLowerCase() === searchTerm.toLowerCase()) {
                setUnitType('boxes');
              } else if (result.productCode.toLowerCase() === searchTerm.toLowerCase()) {
                setUnitType('pieces');
              }
            } else {
              setSelectedProduct(null);
              setMobileProductInfoBottom(null);
              setProductInfoBottom(null);
              setProductSearchedFromBottom(false);
            }
        }
        setSearchTermTop('');
      };

      const handleCorte = async () => {
        const cashAmount = parseFloat(cashAmountCorte);
        const cardAmount = parseFloat(cardAmountCorte);
      
        if (isNaN(cashAmount) || isNaN(cardAmount)) {
          toast.error('Por favor, ingrese montos válidos para efectivo y tarjeta.');
          return;
        }
        setShowCorteConfirmation(true);
      };
      
      const confirmCorte = async () => {
        setIsCorteLoading(true);
        try {
          const cashAmount = parseFloat(cashAmountCorte);
          const cardAmount = parseFloat(cardAmountCorte);
      
          // **Agregar log de los montos ingresados**
          console.log('Iniciando Corte con los siguientes montos:', {
            cashAmount,
            cardAmount,
            location: session?.user?.location || '',
          });
      
          const response = await fetch('/api/corte', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location: session?.user?.location || '',
              actualCash: cashAmount,
              actualCard: cardAmount,
            }),
          });
      
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Respuesta de la API /api/corte no OK:', errorText);
            throw new Error('Error al realizar el corte');
          }
      
          const data = await response.json();
      
          // **Logear la respuesta de la API**
          console.log('Respuesta de la API /api/corte:', data);
      
          setCorteResults(data.data);
          toast.success('Corte realizado exitosamente');
      
          // **Logear los datos que se van a imprimir**
          console.log('Datos de Corte para imprimir:', {
            corteResults: data.data,
            cashAmountCorte,
            cardAmountCorte,
          });
      
          // Imprimir el ticket de corte
          if (isDesktop) {
            await printCorteTicket(data.data as CorteResults, cashAmount, cardAmount);
          }
        } catch (error: any) {
          console.error('Error en confirmCorte:', error);
          toast.error('Error al realizar el corte');
        } finally {
          setIsCorteLoading(false);
          setShowCorteConfirmation(false);
          closeCorteModal();
        }
      };
      
      

  const closeCorteModal = () => {
    setIsCorteModalOpen(false);
    setCashAmountCorte('');
    setCardAmountCorte('');
    setCorteResults(null);
    setShowCorteConfirmation(false);
  };
  
  const handleApplyPriceAdjustment = (adjustedCart: AdjustedCartItem[]) => {
    const updatedCart: CartItem[] = adjustedCart.map(item => ({
      ...item,
      appliedPrice: item.adjustedPrice ?? item.appliedPrice
    }));
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartUpdateTrigger(prev => prev + 1);
    toast.success('Precios ajustados correctamente');
  };

  const handleSearchBottom = (searchTerm: string) => {
    setSearchTermBottom(searchTerm);

    if (searchTerm === '') {
      setFilteredProducts([]);
    } else {
      const filtered = products.filter(product =>
        product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setFilteredProducts(filtered);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setProductInfoBottom(product);
    setSearchTermBottom('');
    setFilteredProducts([]);
    setProductSearchedFromBottom(true);
  };

  const handleSearchBottomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperCaseValue = e.target.value.toUpperCase();
    setSearchTermBottom(upperCaseValue);
    handleSearchBottom(upperCaseValue);
  };

  const handleKeyPressBottom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredProducts.length > 0) {
        handleSelectProduct(filteredProducts[0]);
      }
    }
  };

  const handleAddFromDetails = (product: Product) => {
    setSelectedProduct(product);
    setUnitType('pieces');
    setQuantity(1);
    if (searchInputBottomRef.current) {
      searchInputBottomRef.current.focus();
    }
  };

  const handleCartProductClick = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setSelectedCartProduct(product);
    }
  };

  const calculateStockDisplay = (stockLocations: IStockLocation[], piecesPerBox: number) => {
    return stockLocations.map(location => {
      const quantity = Number(location.quantity);
      const boxes = Math.floor(quantity / piecesPerBox);
      const loosePieces = quantity % piecesPerBox;
      return {
        location: location.location,
        boxes,
        loosePieces,
        total: quantity
      };
    });
  };

  const handleSearchTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermTop(e.target.value.toUpperCase());
  };


  const calculatePrice = (product: Product, totalQuantity: number): number => {
    if (totalQuantity >= product.price3MinQty) return product.price3;
    if (totalQuantity >= product.price2MinQty) return product.price2;
    if (totalQuantity >= product.price1MinQty) return product.price1;
    return product.price1;
  };

  const getCartQuantity = useCallback((productId: string): number => {
    return cart.reduce((total, item) => {
      if (item._id === productId) {
        return total + (item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity);
      }
      return total;
    }, 0);
  }, [cart]);

  const printBusinessInfoTicket = async () => {
    if (!businessInfo) {
      toast.error('No se pudo obtener la información del negocio');
      return;
    }
  
    try {
      const conector = new ConectorPluginV3(undefined, 'YmEwNzRiYWFfXzIwMjQtMDctMTBfXzIwMjQtMTAtMDgjIyMxUXJaS2xpWjVjbU01VEVmckg5Zm93RWxWOHVmQmhYNjVFQnE1akVFMzBZWG51QUs5YUd0U3Ayc2d0N2E0a1ZiOExEMm1EV2NnTjJhTWR0dDhObUw2bFBLTERGYjBXYkFpTTBBNjJTYlo5KzBLRUVLMzlFeEVLcVR5d2dEcWdsQzUvWlhxZCtxUC9aQ1RnL2M5UVhKRUxJRXVYOGVRU0dxZlg4UFF1MkFiY3doME5mdUdYaitHVk1LMzRvcmRDN0FEeTg4ZStURmlQRktrRW9UcnBMSisrYkJQTC8wZ1ZZdFIxdTNGV3dYQWR0Ylg3U25paU5qZ0I5QmNTQlZRRmp5NWRGYUVyODFnak1UR2VPWHB6T2xMZUhWWmJFVUJCQkhEOENyUGJ4NlNQYXBxOHA1NVlCNS9IZkJ0VWpsSDdMa1JocGlBSWF6Z2hVdzRPMFZ6aVZ6enpVbHNnR091VElWdTdaODRvUDlvWjg5bGI5djIxbTcwSDB4L1ZqSXlGNU52b2JTemoyNXMzL3NxS2I1SEtYVHduVW5tTXBvcWxGZmwwajZXM1ZFQnhkdjh2Y2VRMWtaSWkyY1ZWbjNUK29tTkJLWFRkR0NQSS9UaWgyaWNWdFlQZ05IbENxUXBBK0c3ZHFBUTd4VEh6TEJuT2dMemU2THZuRkpRajBpZkt0dlNHNDNzVU82bmRUaS8zbHpta1orK2lIWmVZR3pIampKWnV5RFRRbEo2MUpOamVYUWpHMTliREFaNFZ3SDhJanBWOEUyRERBLzVDcEYwL1l5MTByTTdlT0t0K1JaTWFlc3pHbkRpeXoydHpRK0Z4ZjNrdFV3U1ZFbCtCcFQ2Y1NLSzVNaFFjWDJjMmlrcWpCbVZSNDBzSVhKMjV1VXB1Nko0L1liMzgzNE1iWT0=');
  
      await conector.Iniciar();
      let anchoCaracteres = 48; // Por defecto para 80mm
  
      switch (printerConfig.paperSize) {
        case '58mm':
          anchoCaracteres = 32;
          break;
        case '80mm':
          anchoCaracteres = 48;
          break;
        case 'A4':
          anchoCaracteres = 64;
          break;
      }
  
      conector.EstablecerEnfatizado(true);
      conector.EstablecerTamañoFuente(2, 2);
      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
      conector.EscribirTexto("INFORMACIÓN DEL NEGOCIO\n\n");
      conector.EstablecerTamañoFuente(1, 1);
      conector.EstablecerEnfatizado(false);
  
      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_IZQUIERDA);
      conector.EscribirTexto(`Nombre: ${businessInfo.businessName}\n`);
      conector.EscribirTexto(`Dirección: ${businessInfo.address}\n`);
      conector.EscribirTexto(`Teléfono: ${businessInfo.phone}\n`);
      conector.EscribirTexto(`RFC: ${businessInfo.taxId}\n`);
  
      conector.EscribirTexto("\n");
      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
      conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
      conector.EscribirTexto(`Fecha de impresión: ${new Date().toLocaleString()}\n`);
      conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
  
      conector.Corte(1);
      
      const resultado = await conector.imprimirEn(printerConfig.printerName);
      if (typeof resultado === 'object' && resultado !== null && 'error' in resultado) {
        throw new Error(resultado.error);
      } else if (resultado !== true) {
        throw new Error('La impresión no se completó correctamente');
      }
  
      toast.success('Ticket de información impreso correctamente');
    } catch (error) {
      console.error('Error al imprimir el ticket de información:', error);
      if (error instanceof Error) {
        toast.error(`Error al imprimir el ticket de información: ${error.message}`);
      } else {
        toast.error('Error desconocido al imprimir el ticket de información');
      }
    }
  };

  const getTotalStockAcrossLocations = useCallback((product: Product): number => {
    if (!product.stockLocations) {
      console.warn(`El producto ${product.name} no tiene información de stock`);
      return 0;
    }
  
    // Obtener la ubicación actual del usuario
    const userLocation = session?.user?.location || '';
  
    // Filtrar ubicaciones: la ubicación actual y las que comienzan con 'B'
    const filteredLocations = product.stockLocations.filter(location => {
      return (
        location.location === userLocation ||
        location.location.toUpperCase().startsWith('B')
      );
    });
  
    // Sumar las cantidades de las ubicaciones filtradas
    return filteredLocations.reduce((total, location) => {
      const quantity = Number(location.quantity);
      return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);
  }, [session]);
  

  const getRemainingQuantity = useCallback((product: Product): number => {
    if (!session || !session.user?.location) {
      console.warn('No se pudo obtener la ubicación del usuario para verificar el stock');
      return 0;
    }
  
    if (!product.stockLocations) {
      console.warn(`El producto ${product.name} no tiene información de stock`);
      return 0;
    }
  
    // Obtener la ubicación actual del usuario
    const userLocation = session.user.location;
  
    // Filtrar ubicaciones: la ubicación actual y las que comienzan con 'B'
    const relevantLocations = product.stockLocations.filter(location => {
      return (
        location.location === userLocation ||
        location.location.toUpperCase().startsWith('B')
      );
    });
  
    // Sumar las cantidades de las ubicaciones filtradas
    const totalRelevantStock = relevantLocations.reduce((total, location) => {
      const quantity = Number(location.quantity);
      return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);
  
    // Restar la cantidad en el carrito
    const cartQuantity = getCartQuantity(product._id);
    const remainingQuantity = totalRelevantStock - cartQuantity;
  
    return remainingQuantity;
  }, [session, getCartQuantity]);
  

  const handleAddToCart = () => {
    if (selectedProduct) {
      const totalStockAcrossLocations = getTotalStockAcrossLocations(selectedProduct);
      const quantityToAdd = unitType === 'boxes' ? quantity * selectedProduct.piecesPerBox : quantity;
      const currentCartQuantity = getCartQuantity(selectedProduct._id);
      const totalQuantityAfterAdding = currentCartQuantity + quantityToAdd;
  
      if (totalQuantityAfterAdding > totalStockAcrossLocations) {
        toast.error(`La cantidad excede el inventario total. Cantidad disponible: ${totalStockAcrossLocations - currentCartQuantity} piezas.`);
        return;
      }
  
      const updatedCart = [...cart];
      const existingItems = updatedCart.filter(item => item._id === selectedProduct._id);
      const totalQuantityInCart = existingItems.reduce((total, item) => 
        total + (item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity), 0);
      const newTotalQuantity = totalQuantityInCart + quantityToAdd;
      const newAppliedPrice = calculatePrice(selectedProduct, newTotalQuantity);
  
      const existingItemIndex = updatedCart.findIndex(
        item => item._id === selectedProduct._id && item.unitType === unitType
      );
  
      if (existingItemIndex !== -1) {
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity,
          appliedPrice: newAppliedPrice
        };
      } else {
        updatedCart.push({
          ...selectedProduct,
          quantity,
          unitType,
          appliedPrice: newAppliedPrice
        });
      }
      updatedCart.forEach(item => {
        if (item._id === selectedProduct._id) {
          item.appliedPrice = newAppliedPrice;
        }
      });
  
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      setSelectedProduct(null);
      setQuantity(1);
      setUnitType('pieces');
      toast.success('Producto añadido al carrito');
  
      // Actualizar ProductInfo después de agregar al carrito
      setProductInfoBottom(selectedProduct);
      setProductSearchedFromBottom(true);
  
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (selectedProduct) {
      const totalStockAcrossLocations = getTotalStockAcrossLocations(selectedProduct);
      const maxQuantity = unitType === 'boxes' 
        ? Math.floor(totalStockAcrossLocations / selectedProduct.piecesPerBox)
        : totalStockAcrossLocations;
  
      if (newQuantity > maxQuantity) {
        toast.error(`La cantidad máxima disponible es ${maxQuantity} ${unitType === 'boxes' ? 'cajas' : 'piezas'}.`);
        setQuantity(maxQuantity);
      } else {
        setQuantity(newQuantity);
      }
    } else {
      setQuantity(newQuantity);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.unitType === 'boxes'
        ? item.appliedPrice * item.quantity * item.piecesPerBox
        : item.appliedPrice * item.quantity;
      return total + itemTotal;
    }, 0);
  };

  const handleKeyPressTop = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchTop();
    }
  };

  const isProductAvailable = (product: Product): boolean => {
    return product.availability && getRemainingQuantity(product) > 0;
  };

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(e.target.value);
  };
  
  const handlePaymentTypeChange = (type: 'cash' | 'card') => {
    setPaymentType(type);
  };
  
  const handleOpenMobileConfirmModal = () => {
    setIsMobileConfirmModalOpen(true);
    setCustomerName('');
    setPaymentType('cash');
  };
  
  const handleCloseMobileConfirmModal = () => {
    setIsMobileConfirmModalOpen(false);
  };

  const handleConfirmOrder = async () => {
    if (!session || !session.user?.location) {
      toast.error('No se pudo obtener la ubicación del usuario');
      return;
    }
    setIsLoading(true);
  
    const orderData = {
      action: 'createOrder',
      orderData: {
        items: cart.map(item => ({
          productId: item._id,
          productName: item.name,
          quantity: item.quantity,
          unitType: item.unitType,
          pricePerUnit: item.appliedPrice,
        })),
        totalAmount: calculateTotal(),
        paymentType,
        location: session.user.location,
        deviceId,
        gpsCoordinates,
        employeeId: session.user.id,
        customerName: customerName.trim()
      }
    };
  
    try {
      const response = await fetch('/api/mobileTickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
  
      if (!response.ok) {
        throw new Error('Error al crear el ticket de pedido');
      }
  
      const result = await response.json();
      console.log('Orden confirmada:', result);
      
      // Vaciar el carrito
      setCart([]);
      localStorage.removeItem('cart');
  
      // Redirigir a la página de pago con el ID del ticket
      router.push(`/acciones`);
  
      handleCloseMobileConfirmModal();
      toast.success('Pedido confirmado. 🎉');
    } catch (error) {
      console.error('Error al confirmar el pedido:', error);
      toast.error('Error al confirmar el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPaymentModal = () => {
    if (isDesktop) {
      setIsPaymentModalOpen(true);
      setAmountPaid('');
      setChange(0);
      setPaymentType('cash');
    } else {
      handleOpenMobileConfirmModal();
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentType('cash');
    setAmountPaid('');
    setChange(0);
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setAmountPaid(inputValue);
    
    const paid = parseFloat(inputValue) || 0;
    const total = calculateTotal();
    setChange(paid - total);
  };

  const handlePayment = async () => {
    if (!session || !session.user?.location) {
      toast.error('No se pudo obtener la ubicación del usuario');
      return;
    }
    setIsLoading(true);
  
    let amountPaidValue: number;
  
    if (paymentType === 'cash') {
      amountPaidValue = parseFloat(amountPaid);
      if (isNaN(amountPaidValue)) {
        toast.error('Por favor, ingrese un monto válido');
        setIsLoading(false);
        return;
      }
    } else if (paymentType === 'card') {
      amountPaidValue = calculateTotal();
    } else {
      toast.error('Tipo de pago no válido');
      setIsLoading(false);
      return;
    }
  
    const ticketData = {
      items: cart.map(item => ({
        productId: item._id,
        productName: item.name,
        quantity: item.quantity,
        unitType: item.unitType,
        pricePerUnit: item.appliedPrice,
        total: item.appliedPrice * item.quantity * (item.unitType === 'boxes' ? item.piecesPerBox : 1)
      })),
      totalAmount: calculateTotal(),
      paymentType,
      amountPaid: amountPaidValue,
      change: paymentType === 'cash' ? change : 0,
      location: session.user?.location
    };
  
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar el pago');
      }
    
      const result = await response.json();
      
      if (result.success && result.data) {
        const { ticket, updatedProducts } = result.data;
        
        if (updatedProducts && Array.isArray(updatedProducts)) {
          setProducts(prevProducts => {
            const newProducts = [...prevProducts];
            updatedProducts.forEach((updatedProduct: Product) => {
              const index = newProducts.findIndex(p => p._id === updatedProduct._id);
              if (index !== -1) {
                newProducts[index] = updatedProduct;
              }
            });
            return newProducts;
          });
        } else {
          console.warn('No se recibieron productos actualizados del servidor');
        }
    
        if (isDesktop) {
          await printTicket(ticket?.ticketId);
        }
  
        handleClosePaymentModal();
        setCart([]);
        toast.success('Pago procesado exitosamente');
        setProductInfoBottom(null);
        setSearchTermBottom('');
        if (searchInputBottomRef.current) {
          searchInputBottomRef.current.focus();
        }
      } else {
        throw new Error(result.message || 'Error desconocido al procesar el ticket');
      }
    } catch (error: any) {
      console.error('Error al procesar el pago o imprimir:', error);
      toast.error(error.message || 'Error al procesar el pago o imprimir el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground p-2 sm:p-4 flex flex-col overflow-hidden">
      <div className="flex-grow flex flex-col sm:flex-row gap-4 overflow-hidden">
        {/* Columna izquierda */}
        <div className="w-full sm:w-1/2 flex flex-col gap-2 overflow-y-auto">
          <Card className="flex-shrink-0">
            <CardHeader>
              <CardTitle>Agregar productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="Ingrese código de caja, código de producto o categoría"
                  value={searchTermTop}
                  onChange={handleSearchTopChange}
                  onKeyDown={handleKeyPressTop}
                  className="flex-grow"
                  ref={searchInputRef}
                />
                <Button
                  onClick={handleSearchTop}
                  className="w-full sm:w-auto"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Actualizando...' : 'Buscar'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          
          {selectedProduct && (
            <div className={`border-2 ${isProductAvailable(selectedProduct) ? 'border-green-500' : 'border-red-500'} rounded-lg p-4`}>
              {isDesktop ? (
                <ProductCard
                  product={selectedProduct}
                  quantity={quantity}
                  unitType={unitType}
                  onQuantityChange={handleQuantityChange}
                  onUnitTypeChange={(value: 'pieces' | 'boxes') => {
                    setUnitType(value);
                    setQuantity(0);
                  }}
                  onAddToCart={handleAddToCart}
                  remainingQuantity={getRemainingQuantity(selectedProduct)}
                  totalStockAcrossLocations={getTotalStockAcrossLocations(selectedProduct)}
                  maxQuantity={unitType === 'boxes' 
                    ? Math.floor(getTotalStockAcrossLocations(selectedProduct) / selectedProduct.piecesPerBox)
                    : getTotalStockAcrossLocations(selectedProduct)}
                  getCartQuantity={getCartQuantity} 
                />
              ) : (
                <MobileProductCard
                  product={{
                    ...selectedProduct,
                    imageUrl: selectedProduct.imageUrl || '/path/to/default-image.jpg'
                  }}
                  quantity={quantity}
                  unitType={unitType}
                  onQuantityChange={handleQuantityChange}
                  onUnitTypeChange={(value: 'pieces' | 'boxes') => {
                    setUnitType(value);
                    setQuantity(0);
                  }}
                  onAddToCart={handleAddToCart}
                  remainingQuantity={getRemainingQuantity(selectedProduct)}
                  totalStockAcrossLocations={getTotalStockAcrossLocations(selectedProduct)}
                  maxQuantity={unitType === 'boxes' 
                    ? Math.floor(getTotalStockAcrossLocations(selectedProduct) / selectedProduct.piecesPerBox)
                    : getTotalStockAcrossLocations(selectedProduct)}
                  getCartQuantity={getCartQuantity} 
                />
              )}
            </div>
          )}
          
          {isDesktop && (
            <Card className="flex-grow overflow-hidden flex flex-col mt-2">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Información de productos</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto">
              <ProductInfo
                ref={searchInputBottomRef}
                searchTermBottom={searchTermBottom}
                handleSearchBottomChange={handleSearchBottomChange}
                handleKeyPressBottom={handleKeyPressBottom}
                handleSearchBottom={handleSearchBottom}
                filteredProducts={filteredProducts}
                handleSelectProduct={handleSelectProduct}
                productInfoBottom={productInfoBottom}
                getRemainingQuantity={getRemainingQuantity}
                isProductAvailable={isProductAvailable}
                handleAddFromDetails={handleAddFromDetails}
                productSearchedFromBottom={productSearchedFromBottom}
                calculateStockDisplay={calculateStockDisplay}
                getCartQuantity={getCartQuantity}
                getTotalStockAcrossLocations={getTotalStockAcrossLocations}
              />
              </CardContent>
            </Card>
          )}
        </div>
        {/* Columna derecha */}
        <div className="w-full sm:w-1/2 flex flex-col overflow-hidden">
          <Card className="flex-grow flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>Artículos en el carrito</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto pb-20">
              {cart.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupCartItems(cart)).map(([productId, items]) => {
                    const { boxes, loosePieces, totalPieces } = calculateProductTotals(items);
                    const appliedPrice = items[0].appliedPrice;
                    return (
                      <div key={productId} className="p-3 bg-gray-100 rounded-lg">
                        <h3
                          className="font-bold text-lg mb-2 cursor-pointer hover:underline"
                          onClick={() => handleCartProductClick(items[0]._id)}
                        >
                          {items[0].name}
                        </h3>
                        <p>
                          {boxes > 0 && `${boxes} ${boxes === 1 ? 'caja' : 'cajas'} (${boxes * items[0].piecesPerBox} ${boxes * items[0].piecesPerBox === 1 ? 'pieza' : 'piezas'})`}
                          {boxes > 0 && loosePieces > 0 && ' + '}
                          {loosePieces > 0 && `${loosePieces} ${loosePieces === 1 ? 'pieza' : 'piezas'}`}
                          {' = '}
                          <span className="font-bold">{totalPieces} {totalPieces === 1 ? 'pieza' : 'piezas'} en total</span>
                        </p>
                        <p className="mt-1">Precio aplicado: ${appliedPrice.toFixed(2)} por pieza</p>
                        <p className="font-bold">Subtotal: ${(appliedPrice * totalPieces).toFixed(2)}</p>
                        <div className="mt-2 flex justify-end">
                          <Button
                            onClick={() => removeFromCart(items[0]._id)}
                            variant="destructive"
                            size="sm"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>El carrito está vacío.</p>
              )}
      
              {/* Modal to display product image */}
              {selectedCartProduct && (
                <Dialog open={true} onOpenChange={() => setSelectedCartProduct(null)}>
                  <DialogContent>
                    <img src={selectedCartProduct.imageUrl} alt={selectedCartProduct.name} className="w-full h-auto" />
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
            
          </Card>
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 sm:left-auto sm:w-[calc(50%-1rem)] p-2 bg-background">
              <Card>
                <CardContent className="flex justify-between items-center p-4">
                  <div className="text-xl font-bold">
                    Total: ${calculateTotal().toFixed(2)}
                  </div>
                  <Button 
                    onClick={handleOpenPaymentModal}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isDesktop ? 'Pagar' : 'Confirmar Pedido'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modales con Suspense */}
      <Suspense fallback={<div>Cargando...</div>}>
        {isDesktop ? (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={handleClosePaymentModal}
            paymentType={paymentType}
            amountPaid={amountPaid}
            change={change}
            totalAmount={calculateTotal()}
            isLoading={isLoading}
            onPaymentTypeChange={handlePaymentTypeChange}
            onAmountPaidChange={handleAmountPaidChange}
            onConfirmPayment={handlePayment}
          />
        ) : (
          <MobileConfirmModal
            isOpen={isMobileConfirmModalOpen}
            onClose={handleCloseMobileConfirmModal}
            paymentType={paymentType}
            totalAmount={calculateTotal()}
            isLoading={isLoading}
            customerName={customerName}
            onPaymentTypeChange={handlePaymentTypeChange}
            onCustomerNameChange={handleCustomerNameChange}
            onConfirm={handleConfirmOrder}
          />
        )}
      </Suspense>

      <Suspense fallback={<div>Cargando...</div>}>
        <PriceAdjustmentModal
          isOpen={isPriceAdjustmentModalOpen}
          onClose={() => setIsPriceAdjustmentModalOpen(false)}
          cart={cart}
          onApplyAdjustment={handleApplyPriceAdjustment}
        />
        <CorteModal
          isOpen={isCorteModalOpen}
          onClose={closeCorteModal}
          cashAmountCorte={cashAmountCorte}
          cardAmountCorte={cardAmountCorte}
          isCorteLoading={isCorteLoading}
          corteResults={corteResults}
          onCashAmountChange={(e) => setCashAmountCorte(e.target.value)}
          onCardAmountChange={(e) => setCardAmountCorte(e.target.value)}
          onCorte={handleCorte}
        />
        <CorteConfirmationModal
          isOpen={showCorteConfirmation}
          onClose={() => setShowCorteConfirmation(false)}
          cashAmount={cashAmountCorte}
          cardAmount={cardAmountCorte}
          isCorteLoading={isCorteLoading}
          onConfirm={confirmCorte}
        />
        <CashOutModal
          isOpen={isCashOutModalOpen}
          onClose={handleCloseCashOutModal}
          onSubmit={handleCashOutSubmit}
          location={session?.user?.location || ''} // Pasar location
        />
        <CashInModal
          isOpen={isCashInModalOpen}
          onClose={handleCloseCashInModal}
          onSubmit={handleCashInSubmit}
          location={session?.user?.location || ''} // Pasar location
        />
      </Suspense>
    </div>
  );
};

export default MobileSalesPage;