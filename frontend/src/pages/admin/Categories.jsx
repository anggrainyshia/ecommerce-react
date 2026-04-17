import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      if (editId) {
        await api.put(`/admin/categories/${editId}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', form);
        toast.success('Category created');
      }
      qc.invalidateQueries(['categories']);
      setForm({ name: '', description: '' });
      setEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '' });
    setEditId(cat.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      qc.invalidateQueries(['categories']);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Categories</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">{editId ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="Electronics"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field resize-none"
                rows={3}
                placeholder="Optional description"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => { setEditId(null); setForm({ name: '', description: '' }); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">All Categories</h2>
          {isLoading ? (
            <Loading />
          ) : (
            <div className="space-y-2">
              {data?.categories?.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >Delete</button>
                  </div>
                </div>
              ))}
              {data?.categories?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No categories yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
