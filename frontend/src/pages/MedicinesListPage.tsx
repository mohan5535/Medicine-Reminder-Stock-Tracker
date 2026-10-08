import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { medicinesApi } from '../services/api';
import { type Medicine, getStockStatus, type StockStatus } from '../types';
import { StockBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmModal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const MedicinesListPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | StockStatus>('all');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const loadMedicines = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await medicinesApi.getAll();
      setMedicines(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch medicines');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await medicinesApi.delete(deleteTarget._id);
      success(`Medicine "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      await loadMedicines();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete medicine');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search logic
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      // Search matching name, dosage, or frequency
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        med.name.toLowerCase().includes(q) ||
        med.dosage.toLowerCase().includes(q) ||
        med.frequency.toLowerCase().includes(q);

      // Stock status filter
      const status = getStockStatus(med.currentStock, med.lowStockThreshold);
      const matchesStock = stockFilter === 'all' || status === stockFilter;

      return matchesSearch && matchesStock;
    });
  }, [medicines, searchQuery, stockFilter]);

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading medicines repository..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadMedicines} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Medicines</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your medication catalog, dosages, timings, and inventory counts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadMedicines}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Link to="/medicines/new">
            <Button size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Add Medicine
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, dosage, frequency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({medicines.length})
          </button>
          <button
            onClick={() => setStockFilter('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              stockFilter === 'normal'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              stockFilter === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setStockFilter('out_of_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              stockFilter === 'out_of_stock'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Medicines Table / Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200">
          <EmptyState
            icon={Pill}
            title={medicines.length === 0 ? 'No medicines registered yet' : 'No matching medicines'}
            description={
              medicines.length === 0
                ? 'Get started by adding your first medication with dosage and stock parameters.'
                : 'Try adjusting your search criteria or filter to locate the medicine.'
            }
            actionText={medicines.length === 0 ? 'Add First Medicine' : undefined}
            onAction={medicines.length === 0 ? () => navigate('/medicines/new') : undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Medicine</th>
                  <th className="px-6 py-4">Dosage</th>
                  <th className="px-6 py-4">Frequency & Time</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((med) => {
                  const status = getStockStatus(med.currentStock, med.lowStockThreshold);
                  const isLow = status === 'low';
                  const isOut = status === 'out_of_stock';

                  return (
                    <tr
                      key={med._id}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      {/* Name & Notes */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/medicines/${med._id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-2"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isOut
                                ? 'bg-red-50 text-red-600'
                                : isLow
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <div>{med.name}</div>
                            {med.notes && (
                              <div className="text-xs text-slate-400 font-normal line-clamp-1">
                                {med.notes}
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Dosage */}
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs">
                          {med.dosage}
                        </span>
                      </td>

                      {/* Frequency & Time */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{med.frequency}</div>
                        <div className="text-xs text-slate-400">{med.scheduleTime}</div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <StockBadge status={status} currentStock={med.currentStock} />
                          <div className="text-xs text-slate-400">
                            Threshold: {med.lowStockThreshold} / Init: {med.initialStock}
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div>From: {new Date(med.startDate).toLocaleDateString()}</div>
                        {med.endDate && (
                          <div>To: {new Date(med.endDate).toLocaleDateString()}</div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/medicines/${med._id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/medicines/${med._id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(med)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
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
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
