import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MedicinesListPage } from './pages/MedicinesListPage';
import { MedicineFormPage } from './pages/MedicineFormPage';
import { MedicineDetailPage } from './pages/MedicineDetailPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { DosesPage } from './pages/DosesPage';
import { HistoryPage } from './pages/HistoryPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="medicines" element={<MedicinesListPage />} />
            <Route path="medicines/new" element={<MedicineFormPage />} />
            <Route path="medicines/:id" element={<MedicineDetailPage />} />
            <Route path="medicines/:id/edit" element={<MedicineFormPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="doses" element={<DosesPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
