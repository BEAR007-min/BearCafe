import type { Category, Order, Product } from './types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!response.ok) {
    let message = `Yêu cầu thất bại (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || body.title || message;
    } catch { /* response may be empty */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  products: {
    list: () => request<Product[]>('/api/products'),
    create: (data: Omit<Product, 'id'>) => request<Product>('/api/products', { method: 'POST', body: JSON.stringify({ id: 0, ...data }) }),
    update: (id: number, data: Omit<Product, 'id'>) => request<void>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
    delete: (id: number) => request<void>(`/api/products/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => request<Category[]>('/api/categories'),
    create: (data: Omit<Category, 'id'>) => request<Category>('/api/categories', { method: 'POST', body: JSON.stringify({ id: 0, ...data }) }),
    update: (id: number, data: Omit<Category, 'id'>) => request<void>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
    delete: (id: number) => request<void>(`/api/categories/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: () => request<Order[]>('/api/orders'),
    create: (data: { customerId: number | null; items: { productId: number; quantity: number }[] }) =>
      request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string, paymentStatus: string) =>
      request<void>(`/api/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, paymentStatus }) }),
  },
};
