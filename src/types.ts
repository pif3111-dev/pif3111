export interface CartItem {
  type: 'set' | 'addon';
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  deliveryMethod: string;
  address: string;
  bankLast5: string;
  note: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  totalAmount: number;
  status: string;
}
