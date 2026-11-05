import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Route-based code-splitting for optimal performance and minimal initial bundle size
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Students = lazy(() => import('./pages/Students').then(m => ({ default: m.Students })));
const StudentProfile = lazy(() => import('./pages/StudentProfile').then(m => ({ default: m.StudentProfile })));
const Batches = lazy(() => import('./pages/Batches').then(m => ({ default: m.Batches })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Fees = lazy(() => import('./pages/Fees').then(m => ({ default: m.Fees })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Staff = lazy(() => import('./pages/Staff').then(m => ({ default: m.Staff })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const PageLoader: React.FC = () => (
  <div className="page-loading-container" role="status" aria-label="Loading page">
    <div className="loading-spinner" />
    <span className="loading-text">Loading FIXIA CoachingOS...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="students/:id" element={<StudentProfile />} />
                <Route path="batches" element={<Batches />} />
                <Route path="attendance" element={<Attendance />} />
                <Route
                  path="fees"
                  element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <Fees />
                    </ProtectedRoute>
                  }
                />
                <Route path="reports" element={<Reports />} />
                <Route
                  path="staff"
                  element={
                    <ProtectedRoute allowedRoles={['owner', 'admin']}>
                      <Staff />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
