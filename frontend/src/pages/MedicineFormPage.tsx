import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { medicinesApi } from '../services/api';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { useToast } from '../context/ToastContext';

export const MedicineFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    scheduleTime: '08:00',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    initialStock: '30',
    currentStock: '30',
    lowStockThreshold: '5',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing medicine for edit mode
  useEffect(() => {
    if (!id) return;
    const fetchMedicine = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const med = await medicinesApi.getById(id);
        setFormData({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          scheduleTime: med.scheduleTime,
          startDate: med.startDate ? new Date(med.startDate).toISOString().split('T')[0] : '',
          endDate: med.endDate ? new Date(med.endDate).toISOString().split('T')[0] : '',
          initialStock: med.initialStock.toString(),
          currentStock: med.currentStock.toString(),
          lowStockThreshold: med.lowStockThreshold.toString(),
          notes: med.notes || '',
        });
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load medicine details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Medicine name is required';
    if (!formData.dosage.trim()) errors.dosage = 'Dosage is required';
    if (!formData.frequency.trim()) errors.frequency = 'Frequency is required';
    if (!formData.scheduleTime.trim()) errors.scheduleTime = 'Schedule time is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';

    if (formData.endDate && formData.startDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = 'End date cannot be earlier than start date';
      }
    }

    const initStockNum = Number(formData.initialStock);
    if (isNaN(initStockNum) || initStockNum < 0) {
      errors.initialStock = 'Initial stock must be a non-negative number';
    }

    const currentStockNum = Number(formData.currentStock);
    if (isNaN(currentStockNum) || currentStockNum < 0) {
      errors.currentStock = 'Current stock must be a non-negative number';
    }

    const thresholdNum = Number(formData.lowStockThreshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      errors.lowStockThreshold = 'Low stock threshold must be a non-negative number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        scheduleTime: formData.scheduleTime.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        initialStock: Number(formData.initialStock),
        currentStock: Number(formData.currentStock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        notes: formData.notes.trim(),
      };

      if (isEditMode && id) {
        await medicinesApi.update(id, payload);
        success(`Medicine "${payload.name}" updated successfully!`);
      } else {
        await medicinesApi.create(payload);
        success(`Medicine "${payload.name}" created successfully!`);
      }

      navigate('/medicines');
    } catch (err: any) {
      toastError(err.message || 'Failed to save medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading medication details..." />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/medicines"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Medicine' : 'Add New Medicine'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEditMode
              ? 'Update dosage, schedule timing, or stock quantities'
              : 'Add medication to your tracking list with reminder times and stock control'}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Medicine Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Medicine Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin, Paracetamol, Metformin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.name
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Dosage *
            </label>
            <input
              type="text"
              placeholder="e.g. 500mg, 1 tablet, 10ml"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.dosage
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.dosage && <p className="text-xs text-rose-600 mt-1">{formErrors.dosage}</p>}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Frequency *
            </label>
            <input
              type="text"
              placeholder="e.g. Once daily, Twice daily, Every 8 hours"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.frequency
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.frequency && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.frequency}</p>
            )}
          </div>

          {/* Schedule Time */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Schedule Time(s) *
            </label>
            <input
              type="text"
              placeholder="e.g. 08:00 or 08:00, 20:00"
              value={formData.scheduleTime}
              onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.scheduleTime
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.scheduleTime && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.scheduleTime}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.startDate
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.startDate && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.endDate
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.endDate && <p className="text-xs text-rose-600 mt-1">{formErrors.endDate}</p>}
          </div>

          {/* Stock Section Divider */}
          <div className="sm:col-span-2 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Inventory & Stock Tracking</h3>
            <p className="text-xs text-slate-500">
              Set stock counts and threshold for automatic replenishment alerts.
            </p>
          </div>

          {/* Initial Stock */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Stock *
            </label>
            <input
              type="number"
              min="0"
              value={formData.initialStock}
              onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.initialStock
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.initialStock && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.initialStock}</p>
            )}
          </div>

          {/* Current Stock */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Stock *
            </label>
            <input
              type="number"
              min="0"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.currentStock
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.currentStock && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.currentStock}</p>
            )}
          </div>

          {/* Low Stock Threshold */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Low Stock Threshold *
            </label>
            <input
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.lowStockThreshold
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white'
              }`}
            />
            <p className="text-xs text-slate-400 mt-1">
              An alert triggers when current stock reaches or falls below this number.
            </p>
            {formErrors.lowStockThreshold && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.lowStockThreshold}</p>
            )}
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Instructions & Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Take with water after breakfast; Avoid dairy."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <Link to="/medicines">
            <Button variant="secondary" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            <Save className="w-4 h-4 mr-1.5" />
            {isEditMode ? 'Update Medicine' : 'Save Medicine'}
          </Button>
        </div>
      </form>
    </div>
  );
};
