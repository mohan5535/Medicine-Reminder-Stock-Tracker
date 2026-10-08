import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Pill,
} from 'lucide-react';
import { schedulesApi, medicinesApi } from '../services/api';
import type { Schedule, Medicine } from '../types';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Modal, ConfirmModal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New schedule modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    medicineId: '',
    time: '08:00',
    frequency: 'Daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    enabled: true,
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [schedList, medList] = await Promise.all([
        schedulesApi.getAll(),
        medicinesApi.getAll(),
      ]);
      setSchedules(schedList);
      setMedicines(medList);
      if (medList.length > 0 && !formData.medicineId) {
        setFormData((prev) => ({ ...prev, medicineId: medList[0]._id }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  }, [formData.medicineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle toggle enable/disable
  const handleToggleEnabled = async (schedule: Schedule) => {
    try {
      const updated = await schedulesApi.update(schedule._id, {
        enabled: !schedule.enabled,
      });
      setSchedules((prev) =>
        prev.map((s) => (s._id === schedule._id ? { ...s, enabled: updated.enabled } : s))
      );
      success(`Schedule ${updated.enabled ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      toastError(err.message || 'Failed to update schedule status');
    }
  };

  // Handle create schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineId) {
      toastError('Please select a medicine');
      return;
    }
    if (!formData.time.trim()) {
      toastError('Please specify schedule time');
      return;
    }
    if (!formData.startDate) {
      toastError('Please specify start date');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        medicineId: formData.medicineId,
        time: formData.time.trim(),
        frequency: formData.frequency.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        enabled: formData.enabled,
      };

      await schedulesApi.create(payload);
      success('Schedule created successfully!');
      setIsModalOpen(false);
      setFormData({
        medicineId: medicines.length > 0 ? medicines[0]._id : '',
        time: '08:00',
        frequency: 'Daily',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        enabled: true,
      });
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to create schedule');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await schedulesApi.delete(deleteTarget._id);
      success('Schedule removed.');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading schedule records..." />;
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
            Medication Schedules
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated reminder timings and frequency cycles for your prescriptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200">
          <EmptyState
            icon={CalendarDays}
            title="No schedules created yet"
            description="Create periodic schedules to get organized reminders and generate daily dose checklists."
            actionText="Create First Schedule"
            onAction={() => setIsModalOpen(true)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Medicine</th>
                  <th className="px-6 py-4">Timing</th>
                  <th className="px-6 py-4">Frequency</th>
                  <th className="px-6 py-4">Active Window</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((schedule) => {
                  const med =
                    typeof schedule.medicineId === 'object' ? schedule.medicineId : null;
                  const medName = med ? med.name : 'Unknown Medicine';
                  const medDosage = med ? med.dosage : '';

                  return (
                    <tr key={schedule._id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Medicine Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{medName}</div>
                            {medDosage && <div className="text-xs text-slate-400">{medDosage}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Timing */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {schedule.time}
                        </div>
                      </td>

                      {/* Frequency */}
                      <td className="px-6 py-4 font-medium text-slate-700">{schedule.frequency}</td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div>From: {new Date(schedule.startDate).toLocaleDateString()}</div>
                        {schedule.endDate && (
                          <div>To: {new Date(schedule.endDate).toLocaleDateString()}</div>
                        )}
                      </td>

                      {/* Toggle status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleEnabled(schedule)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                            schedule.enabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {schedule.enabled ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" /> Disabled
                            </>
                          )}
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(schedule)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Medication Schedule"
        description="Attach a designated dose time and repetition interval to a medicine"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          {/* Medicine Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Medicine *
            </label>
            {medicines.length === 0 ? (
              <p className="text-xs text-rose-600">
                Please add a medicine first before creating a schedule.
              </p>
            ) : (
              <select
                value={formData.medicineId}
                onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.dosage})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Time & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Time (HH:mm) *
              </label>
              <input
                type="text"
                placeholder="e.g. 08:00"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Frequency *
              </label>
              <input
                type="text"
                placeholder="e.g. Daily, Twice Daily"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Start & End Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Enabled Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="scheduleEnabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="scheduleEnabled" className="text-xs font-medium text-slate-700 cursor-pointer">
              Schedule active immediately
            </label>
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
              Save Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule"
        message="Are you sure you want to remove this reminder schedule?"
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
