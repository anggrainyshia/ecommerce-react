import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Loading from '../components/common/Loading';
import OrderTimeline from '../components/common/OrderTimeline';

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`).then((r) => r.data),
    enabled: !!orderId,
  });

  const order = data?.order;

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-7xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Placed!</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">Thank you for your purchase.</p>

      {order && (
        <div className="card mt-8 text-left">
          <div className="flex justify-between items-center mb-4">
            <p className="font-mono font-bold text-gray-800 dark:text-gray-100">{order.orderNumber}</p>
            <span className={`badge ${order.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
              {order.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.productName} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <hr className="my-3 border-gray-100 dark:border-gray-700" />
          {order.couponCode && order.discountAmount > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Subtotal</span>
                <span>{formatPrice(order.totalAmount + parseFloat(order.discountAmount))}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 mb-1 font-medium">
                <span>Discount ({order.couponCode})</span>
                <span>− {formatPrice(order.discountAmount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span className="text-blue-600 dark:text-blue-400">{formatPrice(order.totalAmount)}</span>
          </div>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-300">
            <p><strong>Shipping to:</strong> {order.shippingName}</p>
            <p>{order.shippingAddress}</p>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Tracking</p>
            <OrderTimeline tracking={order.tracking || []} currentStatus={order.status} />
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center mt-8">
        <Link to="/profile" className="btn-secondary px-6">View Orders</Link>
        <Link to="/" className="btn-primary px-6">Continue Shopping</Link>
      </div>
    </div>
  );
}
