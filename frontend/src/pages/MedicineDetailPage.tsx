import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Pill,
  Clock,
  Package,
  CalendarCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { medicinesApi, schedulesApi, dosesApi } from '../services/api';
import { type Medicine, type Schedule, type DoseRecord, getStockStatus } from '../types';
import { StockBadge, DoseStatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { ConfirmModal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const MedicineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doses, setDoses] = useState<DoseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stock adjustment modal / state
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockAmount, setRestockAmount] = useState('10');
  const [isRestocking, setIsRestocking] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [medData, schedData, dosesData] = await Promise.all([
        medicinesApi.getById(id),
        schedulesApi.getAll(id),
        dosesApi.getAll({ medicineId: id }),
      ]);
      setMedicine(medData);
      setSchedules(schedData);
      setDoses(dosesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch medicine details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Handle restock
  const handleRestock = async () => {
    if (!medicine || !id) return;
    const addQty = parseInt(restockAmount, 10);
    if (isNaN(addQty) || addQty <= 0) {
      toastError('Please enter a valid restock quantity');
      return;
    }

    try {
      setIsRestocking(true);
      const updatedStock = medicine.currentStock + addQty;
      const updatedMed = await medicinesApi.update(id, { currentStock: updatedStock });
      setMedicine(updatedMed);
      success(`Added ${addQty} units. New stock: ${updatedStock}`);
      setIsRestockOpen(false);
      setRestockAmount('10');
    } catch (err: any) {
      toastError(err.message || 'Failed to update stock');
    } finally {
      setIsRestocking(false);
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!id || !medicine) return;
    try {
      setIsDeleting(true);
      await medicinesApi.delete(id);
      success(`Medicine "${medicine.name}" deleted.`);
      navigate('/medicines');
    } catch (err: any) {
      toastError(err.message || 'Failed to delete medicine');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading medicine details..." />;
  }

  if (error || !medicine) {
    return <ErrorState message={error || 'Medicine not found'} onRetry={loadDetails} />;
  }

  const stockStatus = getStockStatus(medicine.currentStock, medicine.lowStockThreshold);
  const stockPercentage = Math.min(
    100,
    Math.round((medicine.currentStock / Math.max(1, medicine.initialStock)) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/medicines"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {medicine.name}
              </h1>
              <StockBadge status={stockStatus} currentStock={medicine.currentStock} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {medicine.dosage} • {medicine.frequency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setIsRestockOpen(true)}>
            <Package className="w-4 h-4 mr-1.5" />
            Restock
          </Button>
          <Link to={`/medicines/${medicine._id}/edit`}>
            <Button variant="secondary" size="sm">
              <Edit2 className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Instructions */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Prescription & Schedule Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-600" />
              Prescription & Schedule Information
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Dosage</span>
                <span className="font-semibold text-slate-800 text-base">{medicine.dosage}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Frequency</span>
                <span className="font-semibold text-slate-800 text-base">{medicine.frequency}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Schedule Time</span>
                <span className="font-semibold text-slate-800 text-base">{medicine.scheduleTime}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Start Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(medicine.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">End Date</span>
                <span className="font-semibold text-slate-800">
                  {medicine.endDate ? new Date(medicine.endDate).toLocaleDateString() : 'Ongoing'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block">Logged Doses</span>
                <span className="font-semibold text-slate-800">{doses.length} logs</span>
              </div>
            </div>

            {/* Notes */}
            {medicine.notes && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Instructions & Notes
                </div>
                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  {medicine.notes}
                </p>
              </div>
            )}
          </div>

          {/* Card: Associated Schedules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Active Schedules ({schedules.length})
              </h3>
              <Link to="/schedules">
                <Button variant="ghost" size="sm">
                  Manage Schedules
                </Button>
              </Link>
            </div>

            {schedules.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">
                No custom schedule objects linked yet. Timings are guided by regular frequency (
                {medicine.scheduleTime}).
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {schedules.map((s) => (
                  <div key={s._id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-xs">
                        {s.time}
                      </span>
                      <span className="text-slate-700 font-medium">{s.frequency}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Recent Dose Records */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                Recent Dose Log
              </h3>
              <Link to="/history">
                <Button variant="ghost" size="sm">
                  View Full History
                </Button>
              </Link>
            </div>

            {doses.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No dose records logged yet for this medicine.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {doses.slice(0, 5).map((d) => (
                  <div key={d._id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-800">
                        {new Date(d.scheduledDate).toLocaleDateString()} at {d.scheduledTime}
                      </span>
                      {d.takenAt && (
                        <p className="text-xs text-slate-400">
                          Taken at {new Date(d.takenAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <DoseStatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Inventory Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Stock & Inventory
            </h3>

            {/* Current count display */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Current Available Units
              </span>
              <span className="text-4xl font-extrabold text-slate-900 block mt-1">
                {medicine.currentStock}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                out of {medicine.initialStock} initial units
              </span>
            </div>

            {/* Visual Stock Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Stock Level</span>
                <span className="font-semibold">{stockPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    stockStatus === 'out_of_stock'
                      ? 'bg-rose-500'
                      : stockStatus === 'low'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${stockPercentage}%` }}
                />
              </div>
            </div>

            {/* Stock Parameters */}
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Low Stock Threshold</span>
                <span className="font-semibold text-slate-900">{medicine.lowStockThreshold} units</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Initial Supply</span>
                <span className="font-semibold text-slate-900">{medicine.initialStock} units</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Inventory Status</span>
                <span className="font-semibold capitalize text-slate-900">
                  {stockStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Warning if low/out */}
            {stockStatus !== 'normal' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Medication stock is {stockStatus === 'out_of_stock' ? 'depleted' : 'low'}. Refill
                  promptly to avoid missing doses.
                </span>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRestockOpen(true)}
              className="w-full"
            >
              <Package className="w-4 h-4 mr-1.5" />
              Adjust / Refill Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      {isRestockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Refill Stock</h3>
            <p className="text-xs text-slate-500">
              Enter the number of units to add to current stock ({medicine.currentStock}).
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Units to Add
              </label>
              <input
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRestockOpen(false)}
                disabled={isRestocking}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleRestock} isLoading={isRestocking}>
                Confirm Refill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Medicine"
        message={`Are you sure you want to delete ${medicine.name}? All associated records may be impacted.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
