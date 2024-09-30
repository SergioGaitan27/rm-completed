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

const MobileConfirmModal = lazy(() => import('@/app/components/MobileConfirmModal'));
const PaymentModal = lazy(() => import('@/app/components/PaymentModal'));
const CorteModal = lazy(() => import('@/app/components/CorteModal'));
const CorteConfirmationModal = lazy(() => import('@/app/components/CorteConfirmationModal'));


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
  
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);
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
        break;
    case 'CORTE':
        handleCorteCommand();
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
          if (result.boxCode.toLowerCase() === searchTerm.toLowerCase()) {
            setUnitType('boxes');
          } else if (result.productCode.toLowerCase() === searchTerm.toLowerCase()) {
            setUnitType('pieces');
          }
        } else {
          setSelectedProduct(null);
          setMobileProductInfoBottom(null);
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
      const response = await fetch('/api/corte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: session?.user?.location || '',
          actualCash: parseFloat(cashAmountCorte),
          actualCard: parseFloat(cardAmountCorte)
        }),
      });

      if (!response.ok) {
        throw new Error('Error al realizar el corte');
      }

      const data = await response.json();
      setCorteResults(data.data);
      toast.success('Corte realizado exitosamente');
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

  const handleSearchTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermTop(e.target.value.toUpperCase());
  };


  const calculatePrice = (product: Product, totalQuantity: number): number => {
    if (totalQuantity >= product.price3MinQty) return product.price3;
    if (totalQuantity >= product.price2MinQty) return product.price2;
    if (totalQuantity >= product.price1MinQty) return product.price1;
    return product.price1;
  };

  const getRemainingQuantity = useCallback((product: Product): number => {
    if (!session || !session.user?.location) {
      console.warn('No se pudo obtener la ubicación del usuario para verificar el stock');
      return 0;
    }
  
    if (!product.stockLocations) {
      console.warn(`El producto ${product.name} no tiene información de stock`);
      return 0;
    }
  
    const locationStock = product.stockLocations.find(
      location => location.location === session.user.location
    );
  
    if (locationStock) {
      const quantity = Number(locationStock.quantity);
      return isNaN(quantity) ? 0 : quantity;
    }
  
    return 0;
  }, [session]);

  const getCartQuantity = useCallback((productId: string): number => {
    return cart.reduce((total, item) => {
      if (item._id === productId) {
        return total + (item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity);
      }
      return total;
    }, 0);
  }, [cart]);

  const handleAddToCart = () => {
    if (selectedProduct) {
      const remainingQuantity = getRemainingQuantity(selectedProduct);
      const quantityToAdd = unitType === 'boxes' ? quantity * selectedProduct.piecesPerBox : quantity;
      const currentCartQuantity = getCartQuantity(selectedProduct._id);
      const totalQuantityAfterAdding = currentCartQuantity + quantityToAdd;
  
      if (totalQuantityAfterAdding > remainingQuantity) {
        toast.error(`No hay suficiente inventario. Cantidad disponible: ${remainingQuantity - currentCartQuantity} piezas.`);
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
      router.push(`/accionesMobile?ticketId=${result.data.ticket.ticketId}`);
  
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
        throw new Error('Error al guardar el ticket');
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
    
        handleClosePaymentModal();
        setCart([]);
        toast.success('Pago procesado exitosamente');
        setProductInfoBottom(null);
        setSearchTermBottom('');
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } else {
        throw new Error(result.message || 'Error desconocido al procesar el ticket');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      toast.error('Error al procesar el pago');
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
                    setQuantity(1);
                  }}
                  onAddToCart={handleAddToCart}
                  remainingQuantity={getRemainingQuantity(selectedProduct)}
                  maxQuantity={unitType === 'boxes' 
                    ? Math.floor(getRemainingQuantity(selectedProduct) / selectedProduct.piecesPerBox)
                    : getRemainingQuantity(selectedProduct)}
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
                    setQuantity(1);
                  }}
                  onAddToCart={handleAddToCart}
                  remainingQuantity={getRemainingQuantity(selectedProduct)}
                  maxQuantity={unitType === 'boxes' 
                    ? Math.floor(getRemainingQuantity(selectedProduct) / selectedProduct.piecesPerBox)
                    : getRemainingQuantity(selectedProduct)}
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
                  searchTermBottom={searchTermBottom}
                  handleSearchBottomChange={handleSearchBottomChange}
                  handleKeyPressBottom={handleKeyPressBottom}
                  handleSearchBottom={handleSearchBottom}
                  filteredProducts={filteredProducts}
                  handleSelectProduct={handleSelectProduct}
                  productInfoBottom={productInfoBottom}
                  isProductAvailable={isProductAvailable}
                  handleAddFromDetails={handleAddFromDetails}
                  productSearchedFromBottom={productSearchedFromBottom}
                  calculateStockDisplay={calculateStockDisplay}
                  getRemainingQuantity={getRemainingQuantity}
                  getCartQuantity={getCartQuantity}
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
      </Suspense>
    </div>
  );
};

export default MobileSalesPage;