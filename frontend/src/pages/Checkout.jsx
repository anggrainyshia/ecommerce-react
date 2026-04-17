import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PhoneInput from '../components/common/PhoneInput';
import toast from 'react-hot-toast';

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function Checkout() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [placing, setPlacing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('midtrans'); // 'midtrans' | 'mock'

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      shippingName: user?.name || '',
      shippingPhone: user?.phone || '',
      shippingAddress: user?.address || '',
      customerEmail: user?.email || '',
    },
  });

  const itemKey = (item) => `${item.productId}:${item.variantId || 'base'}`;

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const onSubmit = async (formData) => {
    if (cart.items.length === 0) { toast.error('Your cart is empty'); return; }

    try {
      setPlacing(true);

      // 1. Create order
      const { data: orderData } = await api.post('/orders', formData);
      const order = orderData.order;

      // Refresh cart UI and order history
      fetchCart();
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });

      if (paymentMode === 'mock') {
        // 2a. Mock payment (for demo without Midtrans)
        await api.post(`/payments/${order.id}/mock`, { action: 'pay' });
        toast.success('Payment successful! (Mock)');
        navigate(`/order-success?orderId=${order.id}`);
        return;
      }

      // 2b. Real Midtrans payment
      const { data: snapData } = await api.post(`/payments/${order.id}/snap-token`);

      if (window.snap) {
        window.snap.pay(snapData.snapToken, {
          onSuccess: () => navigate(`/order-success?orderId=${order.id}`),
          onPending: () => { toast('Payment pending...'); navigate('/profile'); },
          onError: () => toast.error('Payment failed'),
          onClose: () => toast('Payment window closed'),
        });
      } else {
        // Fallback: redirect to Midtrans hosted page
        window.location.href = snapData.redirectUrl;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.items.length === 0 && !placing) {
    return (
      <div className="text-center py-24">
        <p className="text-5xl mb-4">🛒</p>
        <p className="font-medium text-gray-700 dark:text-gray-300">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Midtrans Snap.js */}
      {paymentMode === 'midtrans' && import.meta.env.VITE_MIDTRANS_CLIENT_KEY && (
        <script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={import.meta.env.VITE_MIDTRANS_CLIENT_KEY}
        />
      )}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    {...register('shippingName', { required: 'Name is required' })}
                    className="input-field"
                    placeholder="John Doe"
                  />
                  {errors.shippingName && <p className="text-red-500 text-xs mt-1">{errors.shippingName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    {...register('customerEmail', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Enter a valid email',
                      },
                    })}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                  {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <Controller
                    name="shippingPhone"
                    control={control}
                    rules={{ required: 'Phone is required' }}
                    render={({ field }) => (
                      <PhoneInput value={field.value} onChange={field.onChange} placeholder="812 3456 7890" />
                    )}
                  />
                  {errors.shippingPhone && <p className="text-red-500 text-xs mt-1">{errors.shippingPhone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shipping Address</label>
                  <textarea
                    {...register('shippingAddress', { required: 'Address is required', minLength: { value: 5, message: 'Address too short' } })}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Street, City, Province, ZIP"
                  />
                  {errors.shippingAddress && <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                  <input {...register('notes')} className="input-field" placeholder="Any special instructions?" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${paymentMode === 'midtrans' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                  <input type="radio" value="midtrans" checked={paymentMode === 'midtrans'} onChange={() => setPaymentMode('midtrans')} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Midtrans Sandbox</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Credit card, Bank transfer, e-Wallet (Sandbox)</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${paymentMode === 'mock' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                  <input type="radio" value="mock" checked={paymentMode === 'mock'} onChange={() => setPaymentMode('mock')} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Mock Payment (Demo)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Instantly mark order as paid — for portfolio demo</p>
                  </div>
                </label>
              </div>
            </div>
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
              type="submit"
              disabled={placing}
              className="btn-primary w-full py-3 mt-5 text-base"
            >
              {placing ? 'Processing...' : 'Place Order & Pay'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
