import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const emptyForm = { name: '', description: '', price: '', stock: '', categoryId: '', isActive: true };
const emptyVariantForm = { type: '', value: '', stock: '' };

export default function AdminProducts() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState(emptyVariantForm);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [savingVariant, setSavingVariant] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => api.get('/admin/products', { params: { page, limit: 10 } }).then((r) => r.data),
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditProduct(null);
    setImageFile(null);
    setVariants([]);
    setVariantForm(emptyVariantForm);
    setEditingVariantId(null);
    setShowForm(true);
  };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, categoryId: p.categoryId || '', isActive: p.isActive });
    setEditProduct(p);
    setImageFile(null);
    setVariants((p.variants || []).slice().sort((a, b) => `${a.type}:${a.value}`.localeCompare(`${b.type}:${b.value}`)));
    setVariantForm(emptyVariantForm);
    setEditingVariantId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (editProduct) {
        await api.put(`/admin/products/${editProduct.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated');
      } else {
        const { data: created } = await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setEditProduct(created.product);
        toast.success('Product created');
      }

      qc.invalidateQueries({ queryKey: ['admin-products'] });
      if (editProduct) {
        setShowForm(false);
      } else {
        setVariants([]);
        setVariantForm(emptyVariantForm);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const startVariantEdit = (variant) => {
    setEditingVariantId(variant.id);
    setVariantForm({
      type: variant.type,
      value: variant.value,
      stock: String(variant.stock),
    });
  };

  const resetVariantForm = () => {
    setEditingVariantId(null);
    setVariantForm(emptyVariantForm);
  };

  const handleVariantSubmit = async () => {
    if (!editProduct?.id) return;
    if (!variantForm.type.trim() || !variantForm.value.trim()) {
      toast.error('Variant type and value are required');
      return;
    }

    try {
      setSavingVariant(true);
      const payload = {
        type: variantForm.type.trim(),
        value: variantForm.value.trim(),
        stock: Number(variantForm.stock || 0),
      };

      if (editingVariantId) {
        const { data: updated } = await api.put(`/admin/products/${editProduct.id}/variants/${editingVariantId}`, payload);
        setVariants((current) =>
          current
            .map((variant) => (variant.id === editingVariantId ? updated.variant : variant))
            .sort((a, b) => `${a.type}:${a.value}`.localeCompare(`${b.type}:${b.value}`))
        );
        toast.success('Variant updated');
      } else {
        const { data: created } = await api.post(`/admin/products/${editProduct.id}/variants`, payload);
        setVariants((current) =>
          [...current, created.variant].sort((a, b) => `${a.type}:${a.value}`.localeCompare(`${b.type}:${b.value}`))
        );
        toast.success('Variant added');
      }

      qc.invalidateQueries({ queryKey: ['admin-products'] });
      resetVariantForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save variant');
    } finally {
      setSavingVariant(false);
    }
  };

  const handleVariantDelete = async (variantId) => {
    if (!editProduct?.id || !confirm('Delete this variant?')) return;
    try {
      await api.delete(`/admin/products/${editProduct.id}/variants/${variantId}`);
      setVariants((current) => current.filter((variant) => variant.id !== variantId));
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      if (editingVariantId === variantId) resetVariantForm();
      toast.success('Variant deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete variant');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openCreate} className="btn-primary">+ New Product</button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-gray-900 text-lg">{editProduct ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field resize-none" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (IDR) *</label>
                    <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-field">
                    <option value="">No category</option>
                    {catData?.categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])}
                    className="input-field py-1.5 text-sm" />
                  {editProduct?.image && !imageFile && (
                    <img src={`${API_BASE}${editProduct.image}`} alt="" className="mt-2 w-24 h-24 object-cover rounded-lg" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible to customers)</label>
                </div>
                {editProduct?.id && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Variants</h3>
                        <p className="text-xs text-gray-500">Manage the selectable product options customers see on the product page.</p>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{variants.length} saved</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {variants.length === 0 ? (
                        <p className="text-sm text-gray-500">No variants yet.</p>
                      ) : (
                        variants.map((variant) => (
                          <div key={variant.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{variant.type}: {variant.value}</p>
                              <p className="text-xs text-gray-500">Stock {variant.stock}</p>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => startVariantEdit(variant)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">Edit</button>
                              <button type="button" onClick={() => handleVariantDelete(variant.id)} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded">Delete</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-3 rounded-xl bg-gray-50 p-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          value={variantForm.type}
                          onChange={(e) => setVariantForm({ ...variantForm, type: e.target.value })}
                          className="input-field text-sm"
                          placeholder="Type"
                        />
                        <input
                          value={variantForm.value}
                          onChange={(e) => setVariantForm({ ...variantForm, value: e.target.value })}
                          className="input-field text-sm"
                          placeholder="Value"
                        />
                        <input
                          type="number"
                          min="0"
                          value={variantForm.stock}
                          onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                          className="input-field text-sm"
                          placeholder="Stock"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleVariantSubmit} disabled={savingVariant} className="btn-primary text-sm">
                          {savingVariant ? 'Saving...' : editingVariantId ? 'Update Variant' : 'Add Variant'}
                        </button>
                        {editingVariantId && (
                          <button type="button" onClick={resetVariantForm} className="btn-secondary text-sm">
                            Cancel Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Saving...' : editProduct ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Table */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.products?.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={`${API_BASE}${p.image}`} alt="" className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">📦</div>
                        )}
                        <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={p.stock <= 5 ? 'text-red-600 font-semibold' : 'text-gray-700'}>{p.stock}</span>
                        {!!p.variants?.length && (
                          <p className="text-xs text-gray-500">
                            {p.variants.length} variants · {p.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)} total variant stock
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded">Delete</button>
                      </div>
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
