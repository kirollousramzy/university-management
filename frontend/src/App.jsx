import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Login from './pages/Login';
import StudentPortal from './pages/StudentPortal';
import Staff from './pages/Staff';
import Facilities from './pages/Facilities';
import Assignments from './pages/Assignments';
import StaffManagement from './pages/StaffManagement';
import Community from './pages/Community';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const App = () => {
  const { user, isStudent } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {isStudent ? (
          <>
            <Route
              path="/portal"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute roles={['student']}>
                  <Assignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute roles={['student']}>
                  <Community />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['admin', 'doctor', 'advisor']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute roles={['admin', 'doctor', 'advisor']}>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute roles={['admin', 'doctor', 'advisor']}>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Staff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities"
              element={
                <ProtectedRoute roles={['admin', 'doctor', 'advisor']}>
                  <Facilities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute roles={['admin', 'doctor', 'advisor']}>
                  <Assignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-management"
              element={
                <ProtectedRoute roles={['admin', 'doctor']}>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute roles={['admin', 'doctor', 'advisor', 'student']}>
                  <Community />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
};

export default App;
