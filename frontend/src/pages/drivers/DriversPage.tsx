import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, X, AlertCircle,
  Award, ShieldCheck, Mail, Phone, Calendar
} from 'lucide-react';
import { driversApi } from '../../services/api';
import type { Driver } from '../../types';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<Partial<Driver>>({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    experience_years: 5,
    status: 'active',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await driversApi.getDrivers({
        page,
        page_size: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setDrivers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [page, search, statusFilter]);

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData(driver);
    } else {
      setEditingDriver(null);
      setFormData({
        employee_id: `EMP${Math.floor(100 + Math.random() * 900)}`,
        full_name: '',
        email: '',
        phone: '',
        license_number: '',
        experience_years: 5,
        status: 'active',
      });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingDriver) {
        await driversApi.updateDriver(editingDriver.id, formData);
      } else {
        await driversApi.createDriver(formData);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to save driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this driver?')) {
      try {
        await driversApi.deleteDriver(id);
        fetchDrivers();
      } catch (err) {
        console.error('Error deleting driver:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Driver Roster & Eco-Scores</h1>
          <p className="page-subtitle">Track pilot certifications, assigned trips, and driving fuel efficiency</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 text-sm shadow-sm"
        >
          <Plus size={18} />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search driver name, employee ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0 shadow-none">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Driver Details</th>
                <th className="table-th">Contact Info</th>
                <th className="table-th">License & Experience</th>
                <th className="table-th">Completed Trips</th>
                <th className="table-th">Total Distance</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    Loading drivers...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    No drivers found
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {d.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{d.full_name}</p>
                          <p className="text-xs font-mono text-gray-500">{d.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" />
                        <span>{d.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                        <Phone size={12} />
                        <span>{d.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="table-td text-xs">
                      <p className="font-medium text-gray-800 font-mono">{d.license_number || 'N/A'}</p>
                      <p className="text-gray-500">{d.experience_years || 0} years exp.</p>
                    </td>
                    <td className="table-td text-sm font-semibold text-gray-800">
                      {d.total_trips || 0}
                    </td>
                    <td className="table-td text-sm text-gray-600 font-mono">
                      {d.total_distance_km ? `${d.total_distance_km.toLocaleString()} km` : '0 km'}
                    </td>
                    <td className="table-td">
                      <span className={
                        d.status === 'active'
                          ? 'badge-success'
                          : d.status === 'on_leave'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }>
                        {d.status === 'on_leave' ? 'on leave' : d.status}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(d)}
                          className="p-1.5 text-gray-400 hover:text-green-700 rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {drivers.length} of {total} drivers</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={drivers.length < 10}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingDriver ? 'Edit Driver' : 'Add New Fleet Driver'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id || ''}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="select-field"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Rajesh Kumar"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rajesh@fleet.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-9876543210"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">License Number</label>
                  <input
                    type="text"
                    value={formData.license_number || ''}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="DL2015001234"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experience_years || 5}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
