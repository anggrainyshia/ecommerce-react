import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  });

  const product = data?.product;
  const variants = product?.variants || [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || null;
  const hasVariants = variants.length > 0;
  const availableStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;

  useEffect(() => {
    if (!product) return;
    if (!hasVariants) {
      setSelectedVariantId('');
      setQty(1);
      return;
    }

    const firstInStock = variants.find((variant) => variant.stock > 0) || variants[0];
    setSelectedVariantId(firstInStock?.id || '');
    setQty(1);
  }, [product?.id]);

  useEffect(() => {
    if (availableStock > 0) {
      setQty((currentQty) => Math.min(currentQty, availableStock));
      return;
    }
    setQty(1);
  }, [availableStock]);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    if (hasVariants && !selectedVariant) {
      toast.error('Please choose a variant first');
      return;
    }
    await addToCart(product.id, qty, selectedVariant?.id || null);
  };

  if (isLoading) return <Loading />;
  if (isError || !product) return (
    <div className="text-center py-24 text-gray-500">
      <p className="text-5xl mb-4">😕</p>
      <p className="font-medium">Product not found</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6">
        ← Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="bg-gray-100 aspect-square md:aspect-auto flex items-center justify-center min-h-64">
            {product.image ? (
              <img src={`${API_BASE}${product.image}`} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {product.category && (
                <span className="badge bg-blue-100 text-blue-700 mb-3">{product.category.name}</span>
              )}
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-3xl font-bold text-blue-600 mt-3">{formatPrice(product.price)}</p>

              <div className={`mt-2 text-sm font-medium ${availableStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {hasVariants
                  ? availableStock > 0
                    ? `✓ ${selectedVariant?.type}: ${selectedVariant?.value} (${availableStock} available)`
                    : '✗ Selected variant is out of stock'
                  : product.stock > 0
                  ? `✓ In stock (${product.stock} available)`
                  : '✗ Out of stock'}
              </div>

              {product.description && (
                <p className="text-gray-600 text-sm mt-4 leading-relaxed">{product.description}</p>
              )}

              {hasVariants && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">Choose a variant</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => {
                      const isSelected = selectedVariantId === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                          } ${variant.stock === 0 ? 'opacity-50' : ''}`}
                        >
                          {variant.type}: {variant.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >−</button>
                  <span className="px-4 py-2 text-sm font-medium min-w-[2.5rem] text-center">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(availableStock, q + 1))}
                    disabled={qty >= availableStock || availableStock === 0}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >+</button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0 || (hasVariants && !selectedVariant)}
                className="btn-primary w-full py-3 text-base"
              >
                {availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
