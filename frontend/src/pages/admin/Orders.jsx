import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const statusColors = {
  pending:          'bg-yellow-100 text-yellow-700',
  paid:             'bg-green-100 text-green-700',
  packed:           'bg-amber-100 text-amber-700',
  shipped:          'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-purple-100 text-purple-700',
  failed:           'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  paid:             'Mark as Paid',
  packed:           'Mark as Packed',
  shipped:          'Mark as Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Mark as Delivered',
  failed:           'Mark as Failed',
};

const statusFlow = {
  pending:          ['paid', 'failed'],
  paid:             ['packed', 'failed'],
  packed:           ['shipped'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  failed:           [],
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [selected, setSelected] = useState(null);
  const [statusNote, setStatusNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter, search],
    queryFn: () =>
      api.get('/admin/orders', { params: { page, limit: 15, status: statusFilter || undefined, search: search || undefined } }).then((r) => r.data),
  });

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus, note: statusNote.trim() || null });
      toast.success(`Order marked as ${newStatus}`);
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelected(null);
      setStatusNote('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Orders</h1>

      {/* Filter & Search */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          placeholder="Search by order #, customer name, or email..."
          className="input-field max-w-md text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-900">Order {selected.orderNumber}</h2>
                <button onClick={() => { setSelected(null); setStatusNote(''); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p><strong>Customer:</strong> {selected.shippingName}</p>
                <p><strong>Email:</strong> {selected.customerEmail || '—'}</p>
                <p><strong>Phone:</strong> {selected.shippingPhone}</p>
                <p><strong>Address:</strong> {selected.shippingAddress}</p>
                {selected.notes && <p><strong>Checkout Notes:</strong> {selected.notes}</p>}
              </div>

              <div className="space-y-1 text-sm mb-4">
                {selected.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span>{item.productName}{item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-gray-900 border-t pt-3 mb-5">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(selected.totalAmount)}</span>
              </div>

              {/* Status actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Update Status:</p>
                <p className="text-xs text-gray-500">Current status: <span className="font-semibold">{selected.status}</span></p>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="input-field resize-none text-sm"
                  placeholder="Optional timeline note"
                />
                <div className="flex gap-2 flex-wrap">
                  {statusFlow[selected.status]?.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(selected.id, s)}
                      className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                        s === 'delivered'        ? 'bg-purple-600 text-white hover:bg-purple-700' :
                        s === 'out_for_delivery' ? 'bg-orange-500 text-white hover:bg-orange-600' :
                        s === 'shipped'          ? 'bg-blue-600 text-white hover:bg-blue-700' :
                        s === 'packed'           ? 'bg-amber-600 text-white hover:bg-amber-700' :
                        s === 'paid'             ? 'bg-green-600 text-white hover:bg-green-700' :
                                                   'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {STATUS_LABELS[s] || `Mark as ${s}`}
                    </button>
                  ))}
                  {statusFlow[selected.status]?.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No further status updates available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Order #</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{order.shippingName}</td>
                    <td className="px-4 py-3 text-gray-500">{order.items?.length} items</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${order.payment?.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {order.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColors[order.status]}`}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelected(order);
                          setStatusNote('');
                        }}
                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1 disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500 py-1">Page {page} of {data.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === data.totalPages} className="btn-secondary text-xs px-3 py-1 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
