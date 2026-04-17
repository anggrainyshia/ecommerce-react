import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, count: 0 });
  const [loadingCart, setLoadingCart] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [], total: 0, count: 0 }); return; }
    try {
      setLoadingCart(true);
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      // ignore
    } finally {
      setLoadingCart(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    try {
      const { data } = await api.post('/cart/items', { productId, quantity, variantId });
      setCart(data);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const updateQuantity = async (productId, quantity, variantId = null) => {
    try {
      const { data } = await api.put(`/cart/items/${productId}`, { quantity, variantId });
      setCart(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
    }
  };

  const removeFromCart = async (productId, variantId = null) => {
    try {
      const { data } = await api.delete(`/cart/items/${productId}`, { params: { variantId } });
      setCart(data);
      toast.success('Removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ items: [], total: 0, count: 0 });
    } catch {
      // ignore
    }
  };

  return (
    <CartContext.Provider value={{ cart, loadingCart, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
