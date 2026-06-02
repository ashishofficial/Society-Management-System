import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';
import Payments from './pages/Payments';
import Members from './pages/Members';
import InvoiceView from './pages/InvoiceView';
import Ledger from './pages/Ledger';
import Notices from './pages/Notices';
import Complaints from './pages/Complaints';
import Visitors from './pages/Visitors';
import Facilities from './pages/Facilities';
import OperationsCenter from './pages/OperationsCenter';
import FinanceCompliance from './pages/FinanceCompliance';
import GovernanceHub from './pages/GovernanceHub';
import ProductSettings from './pages/ProductSettings';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="expenses" element={<RoleRoute allowedRoles={['admin', 'accountant']}><Expenses /></RoleRoute>} />
        <Route path="maintenance" element={<RoleRoute allowedRoles={['admin', 'accountant']}><Maintenance /></RoleRoute>} />
        <Route path="payments" element={<RoleRoute allowedRoles={['admin', 'accountant']}><Payments /></RoleRoute>} />
        <Route path="members" element={<RoleRoute allowedRoles={['admin', 'accountant']}><Members /></RoleRoute>} />
        <Route path="ledger" element={<RoleRoute allowedRoles={['admin', 'accountant']}><Ledger /></RoleRoute>} />
        <Route path="notices" element={<Notices />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="operations" element={<RoleRoute allowedRoles={['admin', 'accountant']}><OperationsCenter /></RoleRoute>} />
        <Route path="finance-compliance" element={<RoleRoute allowedRoles={['admin', 'accountant']}><FinanceCompliance /></RoleRoute>} />
        <Route path="governance" element={<RoleRoute allowedRoles={['admin', 'accountant']}><GovernanceHub /></RoleRoute>} />
        <Route path="product-settings" element={<RoleRoute allowedRoles={['admin']}><ProductSettings /></RoleRoute>} />
        <Route path="invoice/:flatNumber/:month" element={<InvoiceView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppRoutes />
      </DataProvider>
    </AuthProvider>
  );
}
