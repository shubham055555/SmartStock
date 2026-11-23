import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Supplier } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  supplier?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  supplier,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
    } else {
      setFormData({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Validation Error', 'Supplier company name is required.');
      return;
    }

    setLoading(true);
    try {
      if (supplier) {
        await api.put(`/suppliers/${supplier.id}`, formData);
        showToast('success', 'Supplier Updated', `Updated '${formData.name}'`);
      } else {
        await api.post('/suppliers', formData);
        showToast('success', 'Supplier Registered', `Added '${formData.name}'`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast('error', 'Operation Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Register Supplier Partner'}
      subtitle="Manage vendor contact info, procurement details and phone"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Vendor Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            placeholder="e.g. Apex Global Technologies LLC"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. David Vance"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="orders@vendor.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="+1-555-0192"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Office / Warehouse Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="San Jose, CA"
            />
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : supplier ? 'Save Changes' : 'Register Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
