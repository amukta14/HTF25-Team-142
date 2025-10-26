import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Layout/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import CreateCapsule from './components/Capsule/CreateCapsule';
import CapsuleList from './components/Capsule/CapsuleList';
import CapsuleDetail from './components/Capsule/CapsuleDetail';
import SharedCapsules from './components/Capsule/SharedCapsules';
import SharedCapsuleView from './components/Capsule/SharedCapsuleView';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/create" element={
              <PrivateRoute>
                <CreateCapsule />
              </PrivateRoute>
            } />
            
            <Route path="/capsules" element={
              <PrivateRoute>
                <CapsuleList />
              </PrivateRoute>
            } />
            
            <Route path="/capsule/:id" element={
              <PrivateRoute>
                <CapsuleDetail />
              </PrivateRoute>
            } />
            
            <Route path="/shared/:type" element={
              <PrivateRoute>
                <SharedCapsules />
              </PrivateRoute>
            } />

            <Route path="/view-shared/:accessCode" element={
              <PrivateRoute>
                <SharedCapsuleView />
              </PrivateRoute>
            } />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
