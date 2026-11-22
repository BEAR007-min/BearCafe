export interface Product {
  id: number; name: string; description: string | null; price: number;
  imageUrl: string | null; categoryId: number; isAvailable: boolean;
}
export interface Category {
  id: number; name: string; description: string | null; isActive: boolean;
}
export interface OrderItem {
  id: number; productId: number; productName: string; quantity: number;
  unitPrice: number; subTotal: number;
}
export interface Order {
  id: number; customerId: number | null; status: string; paymentStatus: string; paymentMethod: string | null;
  totalAmount: number; createdAt: string; items: OrderItem[];
}
export interface CreateOrderItem { productId: number; quantity: number; }
