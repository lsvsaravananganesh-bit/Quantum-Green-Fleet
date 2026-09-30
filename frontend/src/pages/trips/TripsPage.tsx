import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Search, Filter, CheckCircle2, Clock,
  Fuel, DollarSign, Leaf, X, AlertCircle, Calendar, ArrowRight
} from 'lucide-react';
import { tripsApi, vehiclesApi, driversApi } from '../../services/api';
import type { Trip, Vehicle, Driver } from '../../types';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    origin: 'Mumbai',
    destination: 'Pune',
    distance_km: 150,
    vehicle_id: undefined,
    driver_id: undefined,
    payload_kg: 500,
    traffic_condition: 'medium',
    road_type: 'highway',
  });

  const [completeData, setCompleteData] = useState({
    actual_fuel_liters: 0,
    odometer_km: 0,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehRes, drivRes] = await Promise.all([
        tripsApi.getTrips({
          page,
          page_size: 10,
          search: search || undefined,
          status: statusFilter || undefined,
        }),
        vehiclesApi.getVehicles({ page_size: 100 }),
        driversApi.getDrivers({ page_size: 100 }),
      ]);
      setTrips(tripsRes.data.data);
      setTotal(tripsRes.data.total);
      setVehicles(vehRes.data.data);
      setDrivers(drivRes.data.data);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [page, search, statusFilter]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await tripsApi.createTrip(newTrip);
      setIsAddOpen(false);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to dispatch trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await tripsApi.updateTrip(selectedTrip.id, {
        status: 'completed',
        actual_fuel_liters: Number(completeData.actual_fuel_liters),
        actual_arrival: new Date().toISOString(),
      });
      setIsCompleteOpen(false);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to complete trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this trip?')) {
      try {
        await tripsApi.deleteTrip(id);
        fetchTrips();
      } catch (err) {
        console.error('Error deleting trip:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-900">Trip Dispatches & Telemetry</h1>
          <p className="page-subtitle">Manage routes, assign vehicles, monitor live fuel consumption and emissions</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setIsAddOpen(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm shadow-sm"
        >
          <Plus size={18} />
          <span>Dispatch New Trip</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search trip code, origin, destination..."
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
            <option value="planned">Planned</option>
            <option value="active">Active (In Transit)</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0 shadow-none">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-th">Trip Code</th>
                <th className="table-th">Origin / Destination</th>
                <th className="table-th">Distance / Cargo</th>
                <th className="table-th">Assigned Vehicle</th>
                <th className="table-th">Fuel & Cost</th>
                <th className="table-th">Carbon (kg CO₂)</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    Loading trips...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    No trips recorded
                  </td>
                </tr>
              ) : (
                trips.map((t) => {
                  const assignedVehicle = vehicles.find((v) => v.id === t.vehicle_id);
                  return (
                    <tr key={t.id} className="table-row">
                      <td className="table-td font-bold font-mono text-gray-900 text-xs">
                        {t.trip_code}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-sm">
                          <span>{t.origin}</span>
                          <ArrowRight size={13} className="text-gray-400" />
                          <span>{t.destination}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 capitalize">
                          {t.road_type} road • {t.traffic_condition} traffic
                        </p>
                      </td>
                      <td className="table-td text-xs">
                        <p className="font-semibold text-gray-800">{t.distance_km} km</p>
                        <p className="text-gray-500">{t.payload_kg ? `${t.payload_kg} kg payload` : 'No payload'}</p>
                      </td>
                      <td className="table-td text-xs">
                        {assignedVehicle ? (
                          <div>
                            <p className="font-semibold text-gray-900">{assignedVehicle.registration_number}</p>
                            <p className="text-gray-500 capitalize">{assignedVehicle.vehicle_type} ({assignedVehicle.fuel_type})</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="table-td text-xs">
                        <div className="flex items-center gap-1 text-gray-800 font-semibold">
                          <Fuel size={13} className="text-green-700" />
                          <span>{t.actual_fuel_liters ? `${t.actual_fuel_liters} L` : `Est: ${t.expected_fuel_liters || 0} L`}</span>
                        </div>
                        <p className="text-gray-500">
                          {t.fuel_cost_inr ? `₹${t.fuel_cost_inr.toLocaleString()}` : '-'}
                        </p>
                      </td>
                      <td className="table-td text-xs font-semibold text-emerald-800">
                        {t.co2_emissions_kg ? (
                          <div className="flex items-center gap-1">
                            <Leaf size={13} className="text-emerald-600" />
                            <span>{t.co2_emissions_kg} kg</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="table-td">
                        <span className={
                          t.status === 'completed'
                            ? 'badge-success'
                            : t.status === 'active'
                            ? 'badge-info'
                            : t.status === 'cancelled'
                            ? 'badge-error'
                            : 'badge-neutral'
                        }>
                          {t.status}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedTrip(t);
                                setCompleteData({
                                  actual_fuel_liters: t.expected_fuel_liters || 20,
                                  odometer_km: 0,
                                });
                                setIsCompleteOpen(true);
                              }}
                              className="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-semibold"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                            title="Cancel Trip"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {trips.length} of {total} trips</span>
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
              disabled={trips.length < 10}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch Trip Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Dispatch New Fleet Trip</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTrip} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Origin City</label>
                  <input
                    type="text"
                    required
                    value={newTrip.origin || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, origin: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Destination City</label>
                  <input
                    type="text"
                    required
                    value={newTrip.destination || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTrip.distance_km || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, distance_km: parseFloat(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Cargo Payload (kg)</label>
                  <input
                    type="number"
                    value={newTrip.payload_kg || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, payload_kg: parseFloat(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Assign Vehicle</label>
                  <select
                    value={newTrip.vehicle_id || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, vehicle_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="select-field"
                  >
                    <option value="">Select available vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} - {v.vehicle_type} ({v.fuel_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Assign Driver</label>
                  <select
                    value={newTrip.driver_id || ''}
                    onChange={(e) => setNewTrip({ ...newTrip, driver_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="select-field"
                  >
                    <option value="">Select pilot</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Traffic Condition</label>
                  <select
                    value={newTrip.traffic_condition}
                    onChange={(e) => setNewTrip({ ...newTrip, traffic_condition: e.target.value as any })}
                    className="select-field"
                  >
                    <option value="low">Low Traffic</option>
                    <option value="medium">Medium Traffic</option>
                    <option value="high">High Traffic / Congestion</option>
                  </select>
                </div>
                <div>
                  <label className="label">Road Type</label>
                  <select
                    value={newTrip.road_type}
                    onChange={(e) => setNewTrip({ ...newTrip, road_type: e.target.value as any })}
                    className="select-field"
                  >
                    <option value="highway">Expressway / Highway</option>
                    <option value="mixed">Mixed Arterial</option>
                    <option value="urban">Urban City Roads</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
                >
                  {submitting ? 'Dispatching...' : 'Dispatch Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Finalize Trip: {selectedTrip.trip_code}</h3>
              <button onClick={() => setIsCompleteOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteTrip} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="label">Actual Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={completeData.actual_fuel_liters}
                  onChange={(e) => setCompleteData({ ...completeData, actual_fuel_liters: parseFloat(e.target.value) })}
                  className="input-field"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Expected baseline was ~{selectedTrip.expected_fuel_liters} L
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-5"
                >
                  {submitting ? 'Recording...' : 'Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
