import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  value: '',
  minOrderAmount: '0',
  maxUses: '',
  expiresAt: '',
  isActive: true,
};

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/admin/coupons').then((r) => r.data),
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      };
      if (editId) {
        await api.put(`/admin/coupons/${editId}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created');
      }
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setForm(EMPTY_FORM);
      setEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c) => {
    setForm({
      code: c.code,
      discountType: c.discountType,
      value: String(c.value),
      minOrderAmount: String(c.minOrderAmount || '0'),
      maxUses: c.maxUses != null ? String(c.maxUses) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setEditId(c.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (c) => {
    try {
      await api.put(`/admin/coupons/${c.id}`, { ...c, isActive: !c.isActive });
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch {
      toast.error('Failed to toggle coupon');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Coupon Management</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Code</label>
              <input
                className="input-field uppercase"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="SAVE20"
                required
              />
            </div>
            <div>
              <label className="label">Discount Type</label>
              <select
                className="input-field"
                value={form.discountType}
                onChange={(e) => set('discountType', e.target.value)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (IDR)</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input
                type="number"
                min="0"
                step={form.discountType === 'percentage' ? '1' : '1000'}
                className="input-field"
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50000'}
                required
              />
            </div>
            <div>
              <label className="label">Min Order Amount (IDR)</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={form.minOrderAmount}
                onChange={(e) => set('minOrderAmount', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={form.maxUses}
                onChange={(e) => set('maxUses', e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="label">Expires At (blank = never)</label>
              <input
                type="date"
                className="input-field"
                value={form.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="rounded text-blue-600"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-2 text-sm">
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => { setForm(EMPTY_FORM); setEditId(null); }}
                  className="btn-secondary flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Loading />
          ) : data?.coupons?.length === 0 ? (
            <div className="card text-center py-12 text-gray-500 dark:text-gray-400">No coupons yet</div>
          ) : (
            <div className="space-y-3">
              {data?.coupons?.map((c) => {
                const expired = c.expiresAt && new Date() > new Date(c.expiresAt);
                const exhausted = c.maxUses != null && c.usedCount >= c.maxUses;
                return (
                  <div key={c.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-gray-800 dark:text-gray-100">{c.code}</span>
                          <span className={`badge text-xs ${c.isActive && !expired && !exhausted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {!c.isActive ? 'Inactive' : expired ? 'Expired' : exhausted ? 'Exhausted' : 'Active'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {c.discountType === 'percentage' ? `${c.value}% off` : `${formatPrice(c.value)} off`}
                          {parseFloat(c.minOrderAmount) > 0 && ` · min ${formatPrice(c.minOrderAmount)}`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Used: {c.usedCount}{c.maxUses != null ? `/${c.maxUses}` : ''}
                          {c.expiresAt && ` · Expires ${new Date(c.expiresAt).toLocaleDateString('id-ID')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(c)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
