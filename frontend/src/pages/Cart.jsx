import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Loading from '../components/common/Loading';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function Cart() {
  const { cart, loadingCart, fetchCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const itemKey = (item) => `${item.productId}:${item.variantId || 'base'}`;

  useEffect(() => { fetchCart(); }, [fetchCart]);

  if (loadingCart) return <Loading />;

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Add some products to get started</p>
        <Link to="/" className="btn-primary inline-block mt-6 px-8">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Shopping Cart ({cart.count} items)</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={itemKey(item)} className="card flex items-center gap-4 p-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.image ? (
                  <img src={`${API_BASE}${item.image}`} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name}</p>
                {item.variantLabel && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.variantLabel}</p>
                )}
                <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">{formatPrice(item.price)}</p>
              </div>

              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                  disabled={item.quantity <= 1}
                  className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 text-sm"
                >−</button>
                <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                  className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >+</button>
              </div>

              <p className="font-bold text-gray-900 dark:text-white text-sm w-24 text-right hidden sm:block">
                {formatPrice(item.price * item.quantity)}
              </p>

              <button
                onClick={() => removeFromCart(item.productId, item.variantId)}
                className="text-red-400 hover:text-red-600 p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card h-fit sticky top-20">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <div key={itemKey(item)} className="flex justify-between text-gray-600 dark:text-gray-300">
                <span className="truncate mr-2">{item.name}{item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}</span>
                <span className="flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <hr className="my-4 border-gray-100 dark:border-gray-700" />
          <div className="flex justify-between font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span className="text-blue-600 dark:text-blue-400">{formatPrice(cart.total)}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary w-full py-3 mt-5 text-base"
          >
            Proceed to Checkout
          </button>
          <Link to="/" className="btn-secondary w-full py-2.5 mt-2 text-sm text-center block">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
