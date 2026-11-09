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

// Dedicated Teacher Portal pages
const TeacherLayout = lazy(() => import('./components/layout/TeacherLayout').then(m => ({ default: m.TeacherLayout })));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const TeacherClasses = lazy(() => import('./pages/teacher/TeacherClasses').then(m => ({ default: m.TeacherClasses })));
const TeacherAttendanceTerminal = lazy(() => import('./pages/teacher/TeacherAttendanceTerminal').then(m => ({ default: m.TeacherAttendanceTerminal })));
const TeacherHistory = lazy(() => import('./pages/teacher/TeacherHistory').then(m => ({ default: m.TeacherHistory })));
const TeacherProfile = lazy(() => import('./pages/teacher/TeacherProfile').then(m => ({ default: m.TeacherProfile })));

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

              {/* Owner & Administrator Portal Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="students/:id" element={<StudentProfile />} />
                <Route path="batches" element={<Batches />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="fees" element={<Fees />} />
                <Route path="reports" element={<Reports />} />
                <Route path="staff" element={<Staff />} />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Dedicated Teacher Attendance & Class Portal Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute>
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="attendance/:batchId" element={<TeacherAttendanceTerminal />} />
                <Route path="history" element={<TeacherHistory />} />
                <Route path="profile" element={<TeacherProfile />} />
              </Route>

              {/* Wildcard fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
