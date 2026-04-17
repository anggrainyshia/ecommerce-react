import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../../components/common/Loading';

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/admin/orders', { params: { limit: 5 } }).then((r) => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => api.get('/admin/products', { params: { limit: 1 } }).then((r) => r.data),
  });

  const orders = ordersData?.orders || [];
  const revenue = orders
    .filter((o) => o.status === 'paid' || o.status === 'shipped')
    .reduce((s, o) => s + parseFloat(o.totalAmount), 0);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    shipped: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your store</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={ordersData?.total ?? '–'} icon="📦" color="bg-blue-100" />
        <StatCard label="Products" value={productsData?.total ?? '–'} icon="🏷️" color="bg-purple-100" />
        <StatCard label="Paid Orders" value={orders.filter((o) => o.status === 'paid').length} icon="✅" color="bg-green-100" />
        <StatCard label="Revenue (page)" value={formatPrice(revenue)} icon="💰" color="bg-yellow-100" />
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/admin/products', label: 'Manage Products', icon: '🏷️', desc: 'Add, edit, delete products' },
          { to: '/admin/categories', label: 'Manage Categories', icon: '📂', desc: 'Organize product categories' },
          { to: '/admin/orders', label: 'Manage Orders', icon: '📦', desc: 'View & update order status' },
        ].map((link) => (
          <Link key={link.to} to={link.to} className="card hover:shadow-md transition-shadow flex items-center gap-4">
            <span className="text-3xl">{link.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>

        {loadingOrders ? (
          <Loading />
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 font-mono text-xs font-bold">{order.orderNumber}</td>
                    <td className="py-3 text-gray-700">{order.shippingName}</td>
                    <td className="py-3 font-semibold text-blue-600">{formatPrice(order.totalAmount)}</td>
                    <td className="py-3">
                      <span className={`badge ${statusColors[order.status]}`}>{order.status}</span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
