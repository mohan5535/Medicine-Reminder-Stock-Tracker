import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowRight,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { medicinesApi, dosesApi } from '../services/api';
import { type Medicine, type DoseRecord, getStockStatus } from '../types';
import { DoseStatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayDoses, setTodayDoses] = useState<DoseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDoseId, setActionDoseId] = useState<string | null>(null);

  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [medsData, dosesData] = await Promise.all([
        medicinesApi.getAll(),
        dosesApi.getToday(),
      ]);
      setMedicines(medsData);
      setTodayDoses(dosesData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
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
          ? `Dose recorded as Taken! Stock updated: ${updatedStock} remaining.`
          : 'Dose marked as Taken!'
      );
      // Reload both doses and medicines to refresh stock counts
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
      success('Dose marked as Missed.');
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to mark dose as missed');
    } finally {
      setActionDoseId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading dashboard metrics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  // Calculate metrics
  const totalMedicines = medicines.length;
  const totalTodayDoses = todayDoses.length;
  const takenToday = todayDoses.filter((d) => d.status === 'taken').length;
  const missedToday = todayDoses.filter((d) => d.status === 'missed').length;

  const lowStockMeds = medicines.filter(
    (m) => getStockStatus(m.currentStock, m.lowStockThreshold) === 'low'
  );
  const outOfStockMeds = medicines.filter(
    (m) => getStockStatus(m.currentStock, m.lowStockThreshold) === 'out_of_stock'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily medications, dose schedules, and real-time inventory levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
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

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Medicines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Pill className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">Total Medicines</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalMedicines}</h3>
        </div>

        {/* Today's Doses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">Today's Doses</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTodayDoses}</h3>
        </div>

        {/* Taken Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">Taken Today</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{takenToday}</h3>
        </div>

        {/* Missed Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">Missed Today</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{missedToday}</h3>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">Low Stock</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{lowStockMeds.length}</h3>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">Out of Stock</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">{outOfStockMeds.length}</h3>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Today's Medicine Schedule</h2>
            </div>
            <Link
              to="/doses"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all doses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayDoses.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <EmptyState
                icon={CalendarCheck}
                title="No doses scheduled for today"
                description="Keep your medications on track. Add schedules or record ad-hoc doses."
                actionText="Go to Schedules"
                onAction={() => (window.location.href = '/schedules')}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {todayDoses.map((dose) => {
                const med = typeof dose.medicineId === 'object' ? dose.medicineId : null;
                const medName = med ? med.name : 'Unknown Medicine';
                const medDosage = med ? med.dosage : '';
                const currentStock = med ? med.currentStock : 0;
                const isWorking = actionDoseId === dose._id;

                return (
                  <div
                    key={dose._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/75 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0 mt-0.5">
                        {dose.scheduledTime}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-base">{medName}</h4>
                          {medDosage && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                              {medDosage}
                            </span>
                          )}
                          <DoseStatusBadge status={dose.status} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>Stock: {currentStock} remaining</span>
                          {dose.notes && <span>• Note: {dose.notes}</span>}
                          {dose.takenAt && (
                            <span>• Taken at {new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                          <CheckCircle2 className="w-4 h-4 mr-1" />
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
                          <XCircle className="w-4 h-4 mr-1 text-rose-500" />
                          Mark Missed
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock Alerts & Quick Insights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Stock Alerts
            </h2>
            <Link
              to="/medicines"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              All Medicines <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            {outOfStockMeds.length === 0 && lowStockMeds.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">All stocks healthy</p>
                <p className="text-xs text-slate-400 mt-1">No low stock or out of stock items.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outOfStockMeds.map((med) => (
                  <div
                    key={med._id}
                    className="p-3.5 rounded-xl bg-red-50/75 border border-red-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-semibold text-red-900 text-sm">{med.name}</h4>
                      <p className="text-xs text-red-600 font-medium">Out of stock (0 remaining)</p>
                    </div>
                    <Link to={`/medicines/${med._id}/edit`}>
                      <Button variant="danger" size="sm">
                        Restock
                      </Button>
                    </Link>
                  </div>
                ))}

                {lowStockMeds.map((med) => (
                  <div
                    key={med._id}
                    className="p-3.5 rounded-xl bg-amber-50/75 border border-amber-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-semibold text-amber-900 text-sm">{med.name}</h4>
                      <p className="text-xs text-amber-700">
                        Only {med.currentStock} left (Threshold: {med.lowStockThreshold})
                      </p>
                    </div>
                    <Link to={`/medicines/${med._id}/edit`}>
                      <Button variant="outline" size="sm" className="bg-white border-amber-300 text-amber-800">
                        Refill
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Automatic stock deduction on dose intake</span>
              <span className="font-semibold text-slate-700">Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
