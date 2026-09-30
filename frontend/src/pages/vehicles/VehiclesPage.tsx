import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Filter, Edit2, Trash2, X, Check,
  AlertCircle, Fuel, BatteryCharging, Gauge
} from 'lucide-react';
import { vehiclesApi } from '../../services/api';
import type { Vehicle } from '../../types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    registration_number: '',
    vehicle_type: 'truck',
    manufacturer: '',
    model: '',
    year: 2022,
    fuel_type: 'diesel',
    engine_cc: 3500,
    weight_kg: 8000,
    tank_capacity_liters: 150,
    baseline_mileage_kmpl: 8.5,
    odometer_km: 12000,
    status: 'available',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehiclesApi.getVehicles({
        page,
        page_size: 10,
        search: search || undefined,
        vehicle_type: typeFilter || undefined,
        fuel_type: fuelFilter || undefined,
        status: statusFilter || undefined,
      });
      setVehicles(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, search, typeFilter, fuelFilter, statusFilter]);

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData(vehicle);
    } else {
      setEditingVehicle(null);
      setFormData({
        registration_number: '',
        vehicle_type: 'truck',
        manufacturer: '',
        model: '',
        year: 2022,
        fuel_type: 'diesel',
        engine_cc: 3500,
        weight_kg: 8000,
        tank_capacity_liters: 150,
        baseline_mileage_kmpl: 8.5,
        odometer_km: 12000,
        status: 'available',
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
      if (editingVehicle) {
        await vehiclesApi.updateVehicle(editingVehicle.id, formData);
      } else {
        await vehiclesApi.createVehicle(formData);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to save vehicle details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this vehicle?')) {
      try {
        await vehiclesApi.deleteVehicle(id);
        fetchVehicles();
      } catch (err) {
        console.error('Error deleting vehicle:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Vehicle Fleet Roster</h1>
          <p className="page-subtitle">Manage specifications, fuel ratings, and maintenance lifecycle</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 text-sm shadow-sm"
        >
          <Plus size={18} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search registration, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select-field"
          >
            <option value="">All Vehicle Types</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="car">Car</option>
            <option value="bus">Bus</option>
          </select>

          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="select-field"
          >
            <option value="">All Fuel Types</option>
            <option value="diesel">Diesel</option>
            <option value="petrol">Petrol</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In Transit</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0 shadow-none">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Vehicle</th>
                <th className="table-th">Type / Fuel</th>
                <th className="table-th">Specs (Engine / Weight)</th>
                <th className="table-th">Baseline Mileage</th>
                <th className="table-th">Odometer</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    Loading vehicle fleet...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    No vehicles found matching current criteria
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="table-row">
                    <td className="table-td">
                      <div>
                        <p className="font-bold text-gray-900">{v.registration_number}</p>
                        <p className="text-xs text-gray-500">
                          {v.manufacturer} {v.model} ({v.year || 'N/A'})
                        </p>
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-gray-700">{v.vehicle_type}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          v.fuel_type === 'electric'
                            ? 'text-emerald-700'
                            : v.fuel_type === 'diesel'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                        }`}>
                          {v.fuel_type === 'electric' ? <BatteryCharging size={12} /> : <Fuel size={12} />}
                          <span className="capitalize">{v.fuel_type}</span>
                        </span>
                      </div>
                    </td>
                    <td className="table-td text-xs text-gray-600">
                      <p>{v.engine_cc ? `${v.engine_cc} cc` : '-'}</p>
                      <p className="text-gray-400">{v.weight_kg ? `${v.weight_kg} kg` : '-'}</p>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-sm">
                        <Gauge size={14} className="text-green-600" />
                        <span>{v.baseline_mileage_kmpl} km/L</span>
                      </div>
                    </td>
                    <td className="table-td text-sm text-gray-600 font-mono">
                      {v.odometer_km ? `${v.odometer_km.toLocaleString()} km` : '-'}
                    </td>
                    <td className="table-td">
                      <span className={
                        v.status === 'available'
                          ? 'badge-success'
                          : v.status === 'in_use'
                          ? 'badge-info'
                          : v.status === 'maintenance'
                          ? 'badge-warning'
                          : 'badge-error'
                      }>
                        {v.status === 'in_use' ? 'in transit' : v.status}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(v)}
                          className="p-1.5 text-gray-400 hover:text-green-700 rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
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
          <span>Showing {vehicles.length} of {total} vehicles</span>
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
              disabled={vehicles.length < 10}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Fleet Vehicle'}
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
                  <label className="label">Registration No.</label>
                  <input
                    type="text"
                    required
                    value={formData.registration_number || ''}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                    placeholder="MH01AB1234"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                    className="select-field"
                  >
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="car">Car</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Tata, Ashok Leyland..."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Model</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Prima, Boss, Ace..."
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Fuel Type</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value as any })}
                    className="select-field"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input
                    type="number"
                    value={formData.year || 2022}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
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
                    <option value="available">Available</option>
                    <option value="in_use">In Transit</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Engine (CC)</label>
                  <input
                    type="number"
                    value={formData.engine_cc || ''}
                    onChange={(e) => setFormData({ ...formData, engine_cc: parseFloat(e.target.value) })}
                    placeholder="3500"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight_kg || ''}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                    placeholder="8000"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Baseline km/L</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.baseline_mileage_kmpl || ''}
                    onChange={(e) => setFormData({ ...formData, baseline_mileage_kmpl: parseFloat(e.target.value) })}
                    placeholder="8.5"
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
                  {submitting ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
