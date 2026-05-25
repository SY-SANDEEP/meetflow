import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';

// Auth
import Login    from './components/auth/Login';
import Register from './components/auth/Register';

// User
import UserDashboard from './components/dashboard/UserDashboard';
import SlotsBrowser  from './components/meetings/SlotsBrowser';
import MyMeetings    from './components/meetings/MyMeetings';
import Profile       from './components/dashboard/Profile';

// Admin
import AdminDashboard from './components/admin/AdminDashboard';
import AdminSlots     from './components/admin/AdminSlots';
import AdminMeetings  from './components/admin/AdminMeetings';
import AdminUsers     from './components/admin/AdminUsers';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16162a',
              color: '#e2e8f0',
              border: '1px solid #2a2a45',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public-only routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* User routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"          element={<UserDashboard />} />
            <Route path="/dashboard/slots"    element={<SlotsBrowser />} />
            <Route path="/dashboard/meetings" element={<MyMeetings />} />
            <Route path="/dashboard/profile"  element={<Profile />} />
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin"          element={<AdminDashboard />} />
            <Route path="/admin/slots"    element={<AdminSlots />} />
            <Route path="/admin/meetings" element={<AdminMeetings />} />
            <Route path="/admin/users"    element={<AdminUsers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
