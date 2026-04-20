import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const fetchIds = useCallback(async () => {
    if (!user) { setWishlistIds(new Set()); return; }
    try {
      const { data } = await api.get('/wishlist/ids');
      setWishlistIds(new Set(data.ids));
    } catch {
      setWishlistIds(new Set());
    }
  }, [user]);

  useEffect(() => { fetchIds(); }, [fetchIds]);

  const toggle = useCallback(async (productId) => {
    if (!user) return false;
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        data.wishlisted ? next.add(productId) : next.delete(productId);
        return next;
      });
      return data.wishlisted;
    } catch {
      return null;
    }
  }, [user]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggle, count: wishlistIds.size }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
