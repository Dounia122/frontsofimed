// App.js
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import ClientDashboard from './components/Client/ClientDashboard';
import Register from './components/Login/Register';
import CommercialDashboard from './components/Commercial/CommercialDashboard';
import CommercialDevis from './components/Commercial/CommercialDevis';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route 
          path="/client/dashboard/*" 
          element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/commercial/dashboard/*" element={<CommercialDashboard />} />
        <Route path="/commercial/dashboard/devis" element={<CommercialDevis />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
