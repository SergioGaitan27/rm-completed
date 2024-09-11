// app/types/product.d.ts
export interface IStockLocation {
  location: string;
  quantity: number | string;
}

export interface IProductBase {
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
  cost: number;
  price1: number;
  price1MinQty: number;
  price2: number;
  price2MinQty: number;
  price3: number;
  price3MinQty: number;
  price4?: number;
  price5?: number;
  stockLocations: IStockLocation[];
  imageUrl?: string;
  category: string;
  availability: boolean;
}

export interface Product extends IProductBase {
  _id: string;
}

export interface CartItem extends Product {
  quantity: number;
  unitType: 'pieces' | 'boxes';
  appliedPrice: number;
  adjustedPrice?: number;
}

export interface IBusinessInfo {
  businessName: string;
  address: string;
  phone: string;
  taxId: string;
}

interface ITransfer {
  productId: string;
  productName: string;
  productCode: string;
  boxCode: string;
  imageUrl: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
}