import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';

const PAGE_SIZE = 12;

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function Wishlist() {
  const { toggle } = useWishlist();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist').then((r) => r.data),
  });

  const handleRemove = async (productId) => {
    await toggle(productId);
    qc.invalidateQueries({ queryKey: ['wishlist'] });
    toast.success('Removed from wishlist');
  };

  if (isLoading) return <Loading />;

  const items = data?.items || [];
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="text-5xl mb-4">🤍</p>
          <p className="text-lg font-medium">Your wishlist is empty</p>
          <Link to="/" className="mt-4 inline-block btn-primary">Browse Products</Link>
        </div>
      ) : (
        <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pageItems.map(({ id, product }) => (
            <div key={id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
              <Link to={`/product/${product.id}`} className="block aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {product.image ? (
                  <img src={`${API_BASE}${product.image}`} alt={product.name} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </Link>
              <div className="p-4 flex flex-col flex-1">
                {product.category && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">{product.category.name}</span>
                )}
                <Link to={`/product/${product.id}`} className="font-semibold text-gray-900 dark:text-white mt-1 text-sm line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {product.name}
                </Link>
                <p className="text-blue-600 dark:text-blue-400 font-bold mt-2">{formatPrice(product.price)}</p>
                <div className="flex gap-2 mt-auto pt-3">
                  <Link to={`/product/${product.id}`} className="btn-primary flex-1 text-center text-sm py-2">View Product</Link>
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
