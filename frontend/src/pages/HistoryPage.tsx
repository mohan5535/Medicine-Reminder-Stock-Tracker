import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  History,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Pill,
  Trash2,
  Calendar,
} from 'lucide-react';
import { dosesApi, medicinesApi } from '../services/api';
import type { DoseRecord, Medicine, DoseStatus } from '../types';
import { DoseStatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmModal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const HistoryPage: React.FC = () => {
  const [doses, setDoses] = useState<DoseRecord[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DoseStatus>('all');

  // Actions
  const [actionDoseId, setActionDoseId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoseRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [dosesList, medsList] = await Promise.all([
        dosesApi.getAll(),
        medicinesApi.getAll(),
      ]);
      setDoses(dosesList);
      setMedicines(medsList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dose history');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
          ? `Status updated to Taken! Stock updated: ${updatedStock} units left.`
          : 'Status updated to Taken!'
      );
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to update dose');
    } finally {
      setActionDoseId(null);
    }
  };

  // Handle Mark Missed
  const handleMarkMissed = async (doseId: string) => {
    try {
      setActionDoseId(doseId);
      await dosesApi.markMissed(doseId);
      success('Status updated to Missed.');
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to update dose');
    } finally {
      setActionDoseId(null);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await dosesApi.delete(deleteTarget._id);
      success('History entry deleted.');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete history item');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered doses
  const filteredDoses = useMemo(() => {
    return doses.filter((d) => {
      const medId = typeof d.medicineId === 'object' ? d.medicineId._id : d.medicineId;
      const matchesMed = selectedMedicineId === 'all' || medId === selectedMedicineId;
      const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
      return matchesMed && matchesStatus;
    });
  }, [doses, selectedMedicineId, selectedStatus]);

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading historical records..." />;
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
            Dose History & Compliance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete audit trail of medication reminders, intake timestamps, and missed doses.
          </p>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Medicine Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Pill className="w-3.5 h-3.5" /> Medicine:
          </label>
          <select
            value={selectedMedicineId}
            onChange={(e) => setSelectedMedicineId(e.target.value)}
            className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          >
            <option value="all">All Medicines ({medicines.length})</option>
            {medicines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({doses.length})
          </button>
          <button
            onClick={() => setSelectedStatus('taken')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedStatus === 'taken'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Taken
          </button>
          <button
            onClick={() => setSelectedStatus('missed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedStatus === 'missed'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Missed
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedStatus === 'pending'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* History Table */}
      {filteredDoses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200">
          <EmptyState
            icon={History}
            title={doses.length === 0 ? 'No history records found' : 'No records match filters'}
            description={
              doses.length === 0
                ? 'As medications are scheduled and tracked, their historical compliance logs will appear here.'
                : 'Try adjusting the medicine or status filter.'
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Scheduled Date & Time</th>
                  <th className="px-6 py-4">Medicine</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Recorded Intake</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoses.map((dose) => {
                  const med = typeof dose.medicineId === 'object' ? dose.medicineId : null;
                  const medName = med ? med.name : 'Unknown Medicine';
                  const medDosage = med ? med.dosage : '';
                  const isWorking = actionDoseId === dose._id;

                  return (
                    <tr key={dose._id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(dose.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-indigo-600 font-bold mt-0.5">
                          {dose.scheduledTime}
                        </div>
                      </td>

                      {/* Medicine */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{medName}</div>
                        {medDosage && <div className="text-xs text-slate-400">{medDosage}</div>}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <DoseStatusBadge status={dose.status} />
                      </td>

                      {/* Actual Taken Time */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {dose.takenAt ? (
                          <span className="text-emerald-700 font-medium">
                            {new Date(dose.takenAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {dose.notes ? dose.notes : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {dose.status !== 'taken' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkTaken(dose)}
                              isLoading={isWorking}
                              className="text-emerald-700 hover:bg-emerald-50"
                              title="Mark as Taken"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </Button>
                          )}
                          {dose.status !== 'missed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkMissed(dose._id)}
                              isLoading={isWorking}
                              className="text-rose-700 hover:bg-rose-50"
                              title="Mark as Missed"
                            >
                              <XCircle className="w-4 h-4 text-rose-500" />
                            </Button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(dose)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete History Entry"
        message="Are you sure you want to remove this dose record from the historical audit log?"
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
