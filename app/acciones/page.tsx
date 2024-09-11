"use client"

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense  } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/app/acciones/components/ui/button";
import { Input } from "@/app/acciones/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/acciones/components/ui/card";
import ProductCard from '@/app/acciones/components/ProductCard'; 
import { toast } from 'react-hot-toast';
import ProductInfo from '@/app/acciones/components/ProductInfo';
import ConectorPluginV3 from '@/app/utils/ConectorPluginV3';
import { Product, CartItem, IBusinessInfo, IStockLocation } from '@/app/types/product';
import PriceAdjustmentModal from '@/app/acciones/components/PriceAdjustmentModal';

const PaymentModal = lazy(() => import('@/app/acciones/components/PaymentModal'));
const CorteModal = lazy(() => import('@/app/acciones/components/CorteModal'));
const CorteConfirmationModal = lazy(() => import('@/app/acciones/components/CorteConfirmationModal'));

interface AdjustedCartItem extends CartItem {
    adjustedPrice?: number;
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
  
  // Convertir piezas sueltas a cajas si es posible
  const additionalBoxes = Math.floor(loosePieces / items[0].piecesPerBox);
  boxes += additionalBoxes;
  loosePieces = loosePieces % items[0].piecesPerBox;

  return { boxes, loosePieces, totalPieces };
};


const SalesPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitType, setUnitType] = useState<'pieces' | 'boxes'>('pieces');
  const [searchTermTop, setSearchTermTop] = useState('');
  const [searchTermBottom, setSearchTermBottom] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productInfoBottom, setProductInfoBottom] = useState<Product | null>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const [productSearchedFromBottom, setProductSearchedFromBottom] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pluginConnected, setPluginConnected] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<IBusinessInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCorteModalOpen, setIsCorteModalOpen] = useState(false);
  const [cashAmountCorte, setCashAmountCorte] = useState('');
  const [cardAmountCorte, setCardAmountCorte] = useState('');
  const [corteResults, setCorteResults] = useState<any>(null);
  const [isCorteLoading, setIsCorteLoading] = useState(false);
  const [showCorteConfirmation, setShowCorteConfirmation] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);
  const [isPriceAdjustmentModalOpen, setIsPriceAdjustmentModalOpen] = useState(false);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);


  const fetchBusinessInfo = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      const response = await fetch(`/api/business?location=${encodeURIComponent(userLocation)}`);
      if (!response.ok) {
        throw new Error('Error al obtener la información del negocio');
      }
      const data = await response.json();
      setBusinessInfo(data);
    } catch (error) {
      console.error('Error al obtener la información del negocio:', error);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchBusinessInfo();
  }, [fetchBusinessInfo]);

  useEffect(() => {
    // El plugin siempre estará disponible ahora que es un módulo TypeScript
    setPluginConnected(true);
  }, []);

  const fetchUserLocation = useCallback(async () => {
    try {
      const response = await fetch('/api/user/location');
      if (!response.ok) {
        throw new Error('Error al obtener la ubicación del usuario');
      }
      const data = await response.json();
      setUserLocation(data.location);
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      const data = await response.json();
      setProducts(data);
      toast.success('Productos actualizados correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar productos');
    } finally {
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserLocation();
      fetchProducts();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, session, fetchUserLocation, fetchProducts]);

  const applyPriceToCart = (priceType: 'regular' | 'mayoreo' | 'caja') => {
    const updatedCart = cart.map(item => {
      let newPrice;
      switch (priceType) {
        case 'mayoreo':
          newPrice = item.price2; // Precio de mayoreo
          break;
        case 'caja':
          newPrice = item.price3; // Precio de caja
          break;
        case 'regular':
        default:
          newPrice = item.price1; // Precio regular (menudeo)
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

  const handleSearchTop = () => {
    const searchTerm = searchTermTop.trim().toUpperCase();
    
    switch (searchTerm) {
      case 'ACTUALIZAR':
        fetchProducts();
        break;
      case 'CORTE':
        setIsCorteModalOpen(true);
        break;
      case 'P-MAYOREO':
        applyPriceToCart('mayoreo');
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
      default:
        const result = products.find(product => 
          product.boxCode.toLowerCase() === searchTerm.toLowerCase() ||
          product.productCode.toLowerCase() === searchTerm.toLowerCase() ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
        if (result) {
          setSelectedProduct(result);
          setProductInfoBottom(result);
      
          if (result.boxCode.toLowerCase() === searchTerm.toLowerCase()) {
            setUnitType('boxes');
          } else if (result.productCode.toLowerCase() === searchTerm.toLowerCase()) {
            setUnitType('pieces');
          }
        } else {
          setSelectedProduct(null);
          setProductInfoBottom(null);
          setProductSearchedFromBottom(false);
        }
    }
  
    setSearchTermTop('');
  };

  
  const handleApplyPriceAdjustment = (adjustedCart: AdjustedCartItem[]) => {
    const updatedCart: CartItem[] = adjustedCart.map(item => ({
      ...item,
      appliedPrice: item.adjustedPrice ?? item.appliedPrice // Usa el precio ajustado si existe, si no, mantén el precio aplicado original
    }));
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartUpdateTrigger(prev => prev + 1); // Forzar re-renderización
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

  const handleSearchTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermTop(e.target.value.toUpperCase());
  };

  const handleSearchBottomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperCaseValue = e.target.value.toUpperCase();
    setSearchTermBottom(upperCaseValue);
    handleSearchBottom(upperCaseValue);
  };

  const calculatePrice = (product: Product, totalQuantity: number): number => {
    if (totalQuantity >= product.price3MinQty) return product.price3;
    if (totalQuantity >= product.price2MinQty) return product.price2;
    if (totalQuantity >= product.price1MinQty) return product.price1;
    return product.price1;
  };

  const getRemainingQuantity = (product: Product): number => {
    const locationStock = product.stockLocations.find(location => location.location === userLocation);
    return locationStock ? Number(locationStock.quantity) : 0;
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      const remainingQuantity = getRemainingQuantity(selectedProduct);
      const quantityToAdd = unitType === 'boxes' ? quantity * selectedProduct.piecesPerBox : quantity;
  
      if (quantityToAdd > remainingQuantity) {
        toast.error(`No hay suficiente inventario. Cantidad disponible: ${remainingQuantity} piezas.`);
        return;
      }
  
      const updatedCart = [...cart];
      
      // Encontrar todos los items del mismo producto en el carrito
      const existingItems = updatedCart.filter(item => item._id === selectedProduct._id);
      
      // Calcular la cantidad total de este producto en el carrito
      const totalQuantityInCart = existingItems.reduce((total, item) => 
        total + (item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity), 0);
  
      // Añadir la nueva cantidad
      const newTotalQuantity = totalQuantityInCart + quantityToAdd;
  
      // Calcular el nuevo precio basado en la cantidad total
      const newAppliedPrice = calculatePrice(selectedProduct, newTotalQuantity);
  
      const existingItemIndex = updatedCart.findIndex(
        item => item._id === selectedProduct._id && item.unitType === unitType
      );
  
      if (existingItemIndex !== -1) {
        // Actualizar item existente
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity,
          appliedPrice: newAppliedPrice
        };
      } else {
        // Añadir nuevo item
        updatedCart.push({
          ...selectedProduct,
          quantity,
          unitType,
          appliedPrice: newAppliedPrice
        });
      }
  
      // Actualizar precios para todos los items del mismo producto
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

      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (selectedProduct) {
      const remainingQuantity = getRemainingQuantity(selectedProduct);
      const maxQuantity = unitType === 'boxes' 
        ? Math.floor(remainingQuantity / selectedProduct.piecesPerBox)
        : remainingQuantity;
  
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

  const handleKeyPressBottom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredProducts.length > 0) {
        handleSelectProduct(filteredProducts[0]);
      }
    }
  };

  const handleAddFromDetails = () => {
    if (productInfoBottom) {
      setSelectedProduct(productInfoBottom);
      setUnitType('pieces');
      setQuantity(1);
      clearProductInfo();
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
      }
    }
  };

  const clearProductInfo = () => {
    setProductInfoBottom(null);
    setSearchTermBottom('');
    setProductSearchedFromBottom(false);
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

  const [printerConfig, setPrinterConfig] = useState<{ printerName: string; paperSize: string }>({
    printerName: '',
    paperSize: '80mm',
  });

  useEffect(() => {
    // Cargar la configuración de la impresora
    const savedConfig = localStorage.getItem('printerConfig');
    if (savedConfig) {
      setPrinterConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Modificar la función printTicket para usar la configuración
  const printTicket = async (ticketId?: string) => {
    if (!pluginConnected) {
      toast.error('El plugin de impresión no está conectado');
      return;
    }
  
    try {
      const conector = new ConectorPluginV3(undefined, 'YmEwNzRiYWFfXzIwMjQtMDctMTBfXzIwMjQtMTAtMDgjIyMxUXJaS2xpWjVjbU01VEVmckg5Zm93RWxWOHVmQmhYNjVFQnE1akVFMzBZWG51QUs5YUd0U3Ayc2d0N2E0a1ZiOExEMm1EV2NnTjJhTWR0dDhObUw2bFBLTERGYjBXYkFpTTBBNjJTYlo5KzBLRUVLMzlFeEVLcVR5d2dEcWdsQzUvWlhxZCtxUC9aQ1RnL2M5UVhKRUxJRXVYOGVRU0dxZlg4UFF1MkFiY3doME5mdUdYaitHVk1LMzRvcmRDN0FEeTg4ZStURmlQRktrRW9UcnBMSisrYkJQTC8wZ1ZZdFIxdTNGV3dYQWR0Ylg3U25paU5qZ0I5QmNTQlZRRmp5NWRGYUVyODFnak1UR2VPWHB6T2xMZUhWWmJFVUJCQkhEOENyUGJ4NlNQYXBxOHA1NVlCNS9IZkJ0VWpsSDdMa1JocGlBSWF6Z2hVdzRPMFZ6aVZ6enpVbHNnR091VElWdTdaODRvUDlvWjg5bGI5djIxbTcwSDB4L1ZqSXlGNU52b2JTemoyNXMzL3NxS2I1SEtYVHduVW5tTXBvcWxGZmwwajZXM1ZFQnhkdjh2Y2VRMWtaSWkyY1ZWbjNUK29tTkJLWFRkR0NQSS9UaWgyaWNWdFlQZ05IbENxUXBBK0c3ZHFBUTd4VEh6TEJuT2dMemU2THZuRkpRajBpZkt0dlNHNDNzVU82bmRUaS8zbHpta1orK2lIWmVZR3pIampKWnV5RFRRbEo2MUpOamVYUWpHMTliREFaNFZ3SDhJanBWOEUyRERBLzVDcEYwL1l5MTByTTdlT0t0K1JaTWFlc3pHbkRpeXoydHpRK0Z4ZjNrdFV3U1ZFbCtCcFQ2Y1NLSzVNaFFjWDJjMmlrcWpCbVZSNDBzSVhKMjV1VXB1Nko0L1liMzgzNE1iWT0=');
  
      await conector.Iniciar();
  
      // Ajustar el ancho de impresión según el tamaño del papel
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
          anchoCaracteres = 48; // valor por defecto
          console.warn(`Tamaño de papel desconocido: ${printerConfig.paperSize}. Usando ancho por defecto.`);
      }

      // Imprimir información del negocio
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

        // Añadir fecha y hora

        conector.EstablecerEnfatizado(true);
        conector.EstablecerTamañoFuente(1, 1);
        conector.EscribirTexto(`Fecha: ${new Date().toLocaleString()}\n`);
        if (ticketId) {
          conector.EscribirTexto(`ID: ${ticketId}\n`);
        }
        conector.EstablecerEnfatizado(false);
        conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
        // Modificación: Mostrar solo piezas totales para cada producto
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

        conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
        const qrUrl = `https://www.rmazh.com.mx/consultarTicketID?id=${ticketId}`;
        conector.ImprimirCodigoQr(qrUrl, anchoCaracteres * 8, ConectorPluginV3.RECUPERACION_QR_MEJOR, ConectorPluginV3.TAMAÑO_IMAGEN_NORMAL);
        
    // Centrar el texto debajo del QR
    conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
    conector.EscribirTexto("\nEscanea el código QR para más detalles\n");
    conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_IZQUIERDA);

    conector.Corte(1);
      
      const resultado = await conector.imprimirEn(printerConfig.printerName);

      if (typeof resultado === 'object' && resultado !== null && 'error' in resultado) {
        throw new Error(resultado.error);
      } else if (resultado !== true) {
        throw new Error('La impresión no se completó correctamente');
      }
  
      toast.success('Ticket impreso correctamente');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      if (error instanceof Error) {
        toast.error(`Error al imprimir el ticket: ${error.message}`);
      } else {
        toast.error('Error desconocido al imprimir el ticket');
      }
    }
  };

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
    setAmountPaid('');
    setChange(0);
    setPaymentType('cash');
  };

  useEffect(() => {
    if (isPaymentModalOpen && paymentType === 'cash') {
      const timeoutId = setTimeout(() => {
        amountPaidInputRef.current?.focus();
      }, 100);
  
      return () => clearTimeout(timeoutId);
    }
  }, [isPaymentModalOpen, paymentType]);

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentType('cash');
    setAmountPaid('');
    setChange(0);
  };

  const handlePaymentTypeChange = (value: 'cash' | 'card') => {
    setPaymentType(value);
    if (value === 'card') {
      setAmountPaid(calculateTotal().toFixed(2));
      setChange(0);
    } else {
      setAmountPaid('');
      setChange(0); 
      // Enfocamos el input cuando cambiamos a efectivo
      setTimeout(() => {
        amountPaidInputRef.current?.focus();
      }, 0);
    }
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setAmountPaid(inputValue);
    
    const paid = parseFloat(inputValue) || 0;
    const total = calculateTotal();
    setChange(paid - total);
  };

  const getChangeText = () => {
    if (amountPaid === '') return '';
    if (change === 0) return "Monto exacto";
    if (change > 0) return `Cambio: $${change.toFixed(2)}`;
    return `Falta: $${Math.abs(change).toFixed(2)}`;
  };

  const getChangeTextColor = () => {
    if (amountPaid === '') return '';
    if (change === 0) return "text-green-500";
    if (change > 0) return "text-blue-500";
    return "text-red-500";
  };

  const isProductAvailable = (product: Product): boolean => {
    return product.availability && getRemainingQuantity(product) > 0;
  };

  const handlePayment = async () => {
    setIsLoading(true);

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
    amountPaid: parseFloat(amountPaid),
    change,
    location: userLocation // Asegúrate de que userLocation esté definido y sea correcto
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
      throw new Error('Error al guardar el ticket');
    }

    const data = await response.json();
    
    // Actualizar los productos en el estado local
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      data.updatedProducts.forEach((updatedProduct: Product) => {
        const index = updatedProducts.findIndex(p => p._id === updatedProduct._id);
        if (index !== -1) {
          updatedProducts[index] = updatedProduct;
        }
      });
      return updatedProducts;
    });

    // Imprimir el ticket con el ticketId si está disponible
    await printTicket(data.ticket?.ticketId);
  
      // Limpiar el carrito y cerrar el modal de pago
      handleClosePaymentModal();
      setCart([]);
      
      // Mostrar mensaje de éxito
      toast.success('Pago procesado e impreso exitosamente');
  
      // Limpiar la información del producto seleccionado
      setProductInfoBottom(null);
      setSearchTermBottom('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error al procesar el pago o imprimir:', error);
      toast.error('Error al procesar el pago o imprimir el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorte = async () => {
    // Validación de los valores ingresados
    const cashAmount = parseFloat(cashAmountCorte);
    const cardAmount = parseFloat(cardAmountCorte);

    if (isNaN(cashAmount) || isNaN(cardAmount)) {
      toast.error('Por favor, ingrese montos válidos para efectivo y tarjeta.');
      return;
    }

    // Mostrar confirmación antes de proceder
    setShowCorteConfirmation(true);
  };

  const printCorteTicket = async (corteData: any) => {
    if (!pluginConnected) {
      toast.error('El plugin de impresión no está conectado');
      return;
    }
  
    try {
      const conector = new ConectorPluginV3(undefined, 'YmEwNzRiYWFfXzIwMjQtMDctMTBfXzIwMjQtMTAtMDgjIyMxUXJaS2xpWjVjbU01VEVmckg5Zm93RWxWOHVmQmhYNjVFQnE1akVFMzBZWG51QUs5YUd0U3Ayc2d0N2E0a1ZiOExEMm1EV2NnTjJhTWR0dDhObUw2bFBLTERGYjBXYkFpTTBBNjJTYlo5KzBLRUVLMzlFeEVLcVR5d2dEcWdsQzUvWlhxZCtxUC9aQ1RnL2M5UVhKRUxJRXVYOGVRU0dxZlg4UFF1MkFiY3doME5mdUdYaitHVk1LMzRvcmRDN0FEeTg4ZStURmlQRktrRW9UcnBMSisrYkJQTC8wZ1ZZdFIxdTNGV3dYQWR0Ylg3U25paU5qZ0I5QmNTQlZRRmp5NWRGYUVyODFnak1UR2VPWHB6T2xMZUhWWmJFVUJCQkhEOENyUGJ4NlNQYXBxOHA1NVlCNS9IZkJ0VWpsSDdMa1JocGlBSWF6Z2hVdzRPMFZ6aVZ6enpVbHNnR091VElWdTdaODRvUDlvWjg5bGI5djIxbTcwSDB4L1ZqSXlGNU52b2JTemoyNXMzL3NxS2I1SEtYVHduVW5tTXBvcWxGZmwwajZXM1ZFQnhkdjh2Y2VRMWtaSWkyY1ZWbjNUK29tTkJLWFRkR0NQSS9UaWgyaWNWdFlQZ05IbENxUXBBK0c3ZHFBUTd4VEh6TEJuT2dMemU2THZuRkpRajBpZkt0dlNHNDNzVU82bmRUaS8zbHpta1orK2lIWmVZR3pIampKWnV5RFRRbEo2MUpOamVYUWpHMTliREFaNFZ3SDhJanBWOEUyRERBLzVDcEYwL1l5MTByTTdlT0t0K1JaTWFlc3pHbkRpeXoydHpRK0Z4ZjNrdFV3U1ZFbCtCcFQ2Y1NLSzVNaFFjWDJjMmlrcWpCbVZSNDBzSVhKMjV1VXB1Nko0L1liMzgzNE1iWT0=');
  
      await conector.Iniciar();
  
      conector.EstablecerEnfatizado(true);
      conector.EstablecerTamañoFuente(1, 1);
      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
      conector.EscribirTexto("Corte de Caja\n\n");
      conector.EstablecerEnfatizado(false);
      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_IZQUIERDA);
  
      conector.EscribirTexto(`Fecha: ${new Date().toLocaleString()}\n`);
      conector.EscribirTexto(`Ubicación: ${userLocation}\n\n`);
  
      conector.EscribirTexto("Efectivo:\n");
      conector.EscribirTexto(`  Esperado: $${corteData.expectedCash.toFixed(2)}\n`);
      conector.EscribirTexto(`  Real: $${corteData.actualCash.toFixed(2)}\n`);
      conector.EscribirTexto(`  Diferencia: $${(corteData.actualCash - corteData.expectedCash).toFixed(2)}\n\n`);
  
      conector.EscribirTexto("Tarjeta:\n");
      conector.EscribirTexto(`  Esperado: $${corteData.expectedCard.toFixed(2)}\n`);
      conector.EscribirTexto(`  Real: $${corteData.actualCard.toFixed(2)}\n`);
      conector.EscribirTexto(`  Diferencia: $${(corteData.actualCard - corteData.expectedCard).toFixed(2)}\n\n`);
  
      conector.EscribirTexto(`Total de Tickets: ${corteData.totalTickets}\n\n`);
  
      conector.EscribirTexto("Total:\n");
      conector.EscribirTexto(`  Esperado: $${(corteData.expectedCash + corteData.expectedCard).toFixed(2)}\n`);
      conector.EscribirTexto(`  Real: $${(corteData.actualCash + corteData.actualCard).toFixed(2)}\n`);
      conector.EscribirTexto(`  Diferencia: $${((corteData.actualCash + corteData.actualCard) - (corteData.expectedCash + corteData.expectedCard)).toFixed(2)}\n`);
  
      conector.Corte(1);
  
      const resultado = await conector.imprimirEn(printerConfig.printerName);
  
      if (typeof resultado === 'object' && resultado !== null && 'error' in resultado) {
        throw new Error(resultado.error);
      } else if (resultado !== true) {
        throw new Error('La impresión no se completó correctamente');
      }
  
      toast.success('Ticket de corte impreso correctamente');
    } catch (error) {
      console.error('Error al imprimir el ticket de corte:', error);
      toast.error('Error al imprimir el ticket de corte');
    }
  };

  const confirmCorte = async () => {
    setIsCorteLoading(true);
    try {
      const response = await fetch('/api/corte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: userLocation,
          actualCash: parseFloat(cashAmountCorte),
          actualCard: parseFloat(cardAmountCorte)
        }),
      });

      if (!response.ok) {
        throw new Error('Error al realizar el corte');
      }

      const data = await response.json();
      setCorteResults(data.data);
      await printCorteTicket(data.data);
      toast.success('Corte realizado exitosamente');

      // No cerramos el modal inmediatamente para mostrar los resultados
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al realizar el corte');
    } finally {
      setIsCorteLoading(false);
      setShowCorteConfirmation(false);
    }
  };

  const closeCorteModal = () => {
    setIsCorteModalOpen(false);
    setCashAmountCorte('');
    setCardAmountCorte('');
    setCorteResults(null);
    setShowCorteConfirmation(false);
  };

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="h-screen bg-background text-foreground p-4 flex overflow-hidden">
      {/* Columna izquierda */}
      <div className="w-1/2 pr-2 flex flex-col space-y-4">
        <Card className="flex-shrink-0 flex flex-col">
          <CardHeader>
            <CardTitle>Agregar productos</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <div className="mb-4 mt-4 flex">
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
                className="ml-2"
                disabled={isUpdating}
              >
                {isUpdating ? 'Actualizando...' : 'Buscar'}
              </Button>
            </div>
            {selectedProduct && (
            <div className={`border-2 ${isProductAvailable(selectedProduct) ? 'border-green-500' : 'border-red-500'} rounded-lg p-4 mb-4`}>
              <ProductCard
                product={selectedProduct}
                quantity={quantity}
                unitType={unitType}
                onQuantityChange={handleQuantityChange}
                onUnitTypeChange={(value: 'pieces' | 'boxes') => {
                  setUnitType(value);
                  setQuantity(1); // Reset quantity when changing unit type
                }}
                onAddToCart={handleAddToCart}
                isAvailable={getRemainingQuantity(selectedProduct) > 0}
                maxQuantity={unitType === 'boxes' 
                  ? Math.floor(getRemainingQuantity(selectedProduct) / selectedProduct.piecesPerBox)
                  : getRemainingQuantity(selectedProduct)}
              />
            </div>
          )}
          </CardContent>
        </Card>
       
        <Card className="flex-grow overflow-hidden flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Información de productos</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <ProductInfo
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
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Columna derecha */}
      <div className="w-1/2 pl-2 flex flex-col overflow-hidden">
        <Card className="flex-grow flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Artículos en el carrito</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto pb-20">
            {cart.length > 0 ? (
              <div>
                {Object.entries(groupCartItems(cart)).map(([productId, items]) => {
                  const { boxes, loosePieces, totalPieces } = calculateProductTotals(items);
                  const appliedPrice = items[0].appliedPrice;
                  return (
                    <div key={productId} className="mb-4 p-3 bg-gray-100 rounded-lg">
                      <h3 className="font-bold text-lg mb-2">{items[0].name}</h3>
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
          </CardContent>
        </Card>
        {/* Total fijo */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 right-0 w-[calc(50%-0.5rem)] mr-2 mb-2">
            <Card>
              <CardContent className="flex justify-between items-center p-4">
                <div className="text-xl font-bold">
                  Total: ${calculateTotal().toFixed(2)}
                </div>
                <Button 
                  onClick={handleOpenPaymentModal}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Pagar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

       {/* Modales con Suspense */}
      <Suspense fallback={<div>Cargando...</div>}>
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
      </Suspense>

      <Suspense fallback={<div>Cargando...</div>}>
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
      </Suspense>

      <Suspense fallback={<div>Cargando...</div>}>
        <CorteConfirmationModal
          isOpen={showCorteConfirmation}
          onClose={() => setShowCorteConfirmation(false)}
          cashAmount={cashAmountCorte}
          cardAmount={cardAmountCorte}
          isCorteLoading={isCorteLoading}
          onConfirm={confirmCorte}
        />
      </Suspense>
      <Suspense fallback={<div>Cargando...</div>}>
        <PriceAdjustmentModal
          isOpen={isPriceAdjustmentModalOpen}
          onClose={() => setIsPriceAdjustmentModalOpen(false)}
          cart={cart}
          onApplyAdjustment={handleApplyPriceAdjustment}
        />
      </Suspense>
      </div>
  );
};

export default SalesPage;