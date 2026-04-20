import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/common/Loading';
import PhoneInput from '../components/common/PhoneInput';
import OrderTimeline from '../components/common/OrderTimeline';
import toast from 'react-hot-toast';

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const statusColors = {
  pending:          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid:             'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  packed:           'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  shipped:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  out_for_delivery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  delivered:        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  failed:           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [saving, setSaving] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellingId, setCancellingId] = useState(null);

  const toggleOrder = (id) => setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
    staleTime: 0,
  });

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      setCancellingId(orderId);
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(form);
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">My Account</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{user?.name}</p>
              <span className={`badge ${user?.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                {user?.role}
              </span>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field text-sm"
                placeholder="Full name"
              />
              <PhoneInput
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="812 3456 7890"
              />
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field text-sm resize-none"
                rows={3}
                placeholder="Address"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex-1 py-2">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-sm flex-1 py-2">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p><span className="font-medium text-gray-700 dark:text-gray-200">Email:</span> {user?.email}</p>
              {user?.phone && <p><span className="font-medium text-gray-700 dark:text-gray-200">Phone:</span> {user.phone}</p>}
              {user?.address && <p><span className="font-medium text-gray-700 dark:text-gray-200">Address:</span> {user.address}</p>}
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm w-full mt-3 py-2">
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="md:col-span-2">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Order History</h2>

          {isLoading ? (
            <Loading />
          ) : data?.orders?.length === 0 ? (
            <div className="card text-center py-10 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.orders?.map((order) => (
                <div key={order.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`badge ${statusColors[order.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
                    {order.items?.map((item) => (
                      <p key={item.id}>
                        {item.productName}
                        {item.variantLabel && (
                          <span className="text-gray-400 dark:text-gray-500"> — {item.variantLabel}</span>
                        )}
                        {' '}× {item.quantity}
                      </p>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {order.couponCode && order.discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-green-600 dark:text-green-400 mb-1">
                        <span>Discount ({order.couponCode})</span>
                        <span>− {formatPrice(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{order.shippingName} · {order.shippingPhone}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => toggleOrder(order.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {expandedOrders[order.id] ? '▲ Hide tracking' : '▼ Show tracking'}
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>

                  {expandedOrders[order.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <OrderTimeline tracking={order.tracking || []} currentStatus={order.status} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
