import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  RefreshCw,
  Filter,
  Trash2,
} from 'lucide-react';
import { dosesApi, medicinesApi, schedulesApi } from '../services/api';
import type { DoseRecord, Medicine, Schedule, DoseStatus } from '../types';
import { DoseStatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Modal, ConfirmModal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const DosesPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [doses, setDoses] = useState<DoseRecord[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | DoseStatus>('all');
  const [actionDoseId, setActionDoseId] = useState<string | null>(null);

  // New dose record modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    medicineId: '',
    scheduleId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '08:00',
    status: 'pending' as DoseStatus,
    notes: '',
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DoseRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [dosesList, medsList, schedList] = await Promise.all([
        dosesApi.getToday(selectedDate),
        medicinesApi.getAll(),
        schedulesApi.getAll(),
      ]);
      setDoses(dosesList);
      setMedicines(medsList);
      setSchedules(schedList);
      if (medsList.length > 0 && !formData.medicineId) {
        setFormData((prev) => ({ ...prev, medicineId: medsList[0]._id }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dose records');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, formData.medicineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Mark Taken
  const handleMarkTaken = async (dose: DoseRecord) => {
    try {
      setActionDoseId(dose._id);
      const { updatedStock } = await dosesApi.markTaken(dose);
      success(
        updatedStock !== undefined
          ? `Dose recorded! Medication stock updated: ${updatedStock} remaining.`
          : 'Dose marked as taken!'
      );
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to mark dose as taken');
    } finally {
      setActionDoseId(null);
    }
  };

  // Handle Mark Missed
  const handleMarkMissed = async (doseId: string) => {
    try {
      setActionDoseId(doseId);
      await dosesApi.markMissed(doseId);
      success('Dose marked as missed.');
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to mark dose as missed');
    } finally {
      setActionDoseId(null);
    }
  };

  // Handle manual dose creation
  const handleCreateDose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineId) {
      toastError('Please select a medicine');
      return;
    }
    if (!formData.scheduledDate || !formData.scheduledTime) {
      toastError('Please specify date and time');
      return;
    }

    try {
      setIsSaving(true);
      await dosesApi.create({
        medicineId: formData.medicineId,
        scheduleId: formData.scheduleId || undefined,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        scheduledTime: formData.scheduledTime.trim(),
        status: formData.status,
        notes: formData.notes.trim(),
      });
      success('Dose scheduled successfully!');
      setIsModalOpen(false);
      setFormData({
        medicineId: medicines.length > 0 ? medicines[0]._id : '',
        scheduleId: '',
        scheduledDate: selectedDate,
        scheduledTime: '08:00',
        status: 'pending',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to schedule dose');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Dose
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await dosesApi.delete(deleteTarget._id);
      success('Dose entry removed.');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete dose');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter doses by status
  const filteredDoses = useMemo(() => {
    return doses.filter((d) => {
      if (statusFilter === 'all') return true;
      return d.status === statusFilter;
    });
  }, [doses, statusFilter]);

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading daily dose tracker..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Daily Dose Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and record intake for scheduled medications with automatic stock deductions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Log Dose
          </Button>
        </div>
      </div>

      {/* Date Selector & Status Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Date Input */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({doses.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('taken')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'taken'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Taken
          </button>
          <button
            onClick={() => setStatusFilter('missed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'missed'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Doses List */}
      {filteredDoses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200">
          <EmptyState
            icon={Clock}
            title={doses.length === 0 ? 'No doses found for this date' : 'No matching doses'}
            description={
              doses.length === 0
                ? 'You can schedule medication intake or click "Log Dose" to log one manually.'
                : 'Try changing the status filter above.'
            }
            actionText={doses.length === 0 ? 'Log New Dose' : undefined}
            onAction={doses.length === 0 ? () => setIsModalOpen(true) : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDoses.map((dose) => {
            const med = typeof dose.medicineId === 'object' ? dose.medicineId : null;
            const medName = med ? med.name : 'Unknown Medicine';
            const medDosage = med ? med.dosage : '';
            const currentStock = med ? med.currentStock : 0;
            const isWorking = actionDoseId === dose._id;

            return (
              <div
                key={dose._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center font-bold text-indigo-700 shrink-0">
                    <span className="text-xs uppercase text-indigo-400 font-semibold">Time</span>
                    <span className="text-sm font-extrabold">{dose.scheduledTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-base">{medName}</h3>
                      {medDosage && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium">
                          {medDosage}
                        </span>
                      )}
                      <DoseStatusBadge status={dose.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                      <span>Inventory: {currentStock} units left</span>
                      {dose.notes && <span>• Note: {dose.notes}</span>}
                      {dose.takenAt && (
                        <span className="text-emerald-700 font-medium">
                          • Taken at {new Date(dose.takenAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {dose.status !== 'taken' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleMarkTaken(dose)}
                      isLoading={isWorking}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Mark Taken
                    </Button>
                  )}

                  {dose.status !== 'missed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkMissed(dose._id)}
                      isLoading={isWorking}
                      className="hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                    >
                      <XCircle className="w-4 h-4 mr-1.5 text-rose-500" />
                      Mark Missed
                    </Button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(dose)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Dose Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule / Log Dose"
        description="Add a specific dose instance to the schedule"
      >
        <form onSubmit={handleCreateDose} className="space-y-4">
          {/* Medicine Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Medicine *
            </label>
            <select
              value={formData.medicineId}
              onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {medicines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.dosage}) - Stock: {m.currentStock}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Schedule Link */}
          {schedules.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Link to Schedule (Optional)
              </label>
              <select
                value={formData.scheduleId}
                onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">None (Custom / Ad-hoc)</option>
                {schedules.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.time} ({s.frequency})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Time (HH:mm) *
              </label>
              <input
                type="text"
                placeholder="08:00"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as DoseStatus })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="taken">Taken</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Taken with breakfast"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={medicines.length === 0}>
              Create Dose
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Dose Record"
        message="Are you sure you want to delete this dose entry from history?"
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
