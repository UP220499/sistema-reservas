import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme/theme';
import { AuthProvider } from './hooks/AuthProvider';
import ToastProvider from './components/common/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ReservationsListPage from './pages/Reservations/ReservationsListPage';
import ReservationDetailPage from './pages/Reservations/ReservationDetailPage';
import ReservationFormPage from './pages/Reservations/ReservationFormPage';
import ClientsListPage from './pages/Clients/ClientsListPage';
import ClientDetailPage from './pages/Clients/ClientDetailPage';
import ClientFormPage from './pages/Clients/ClientFormPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import BlocksListPage from './pages/Blocks/BlocksListPage';
import PaymentsListPage from './pages/Payments/PaymentsListPage';
import UbicacionesListPage from './pages/Ubicaciones/UbicacionesListPage';
import AdminRoute from './components/AdminRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 10 * 1000, // 10 seconds for near-instant updates
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />

                {/* Reservaciones */}
                <Route path="/reservaciones" element={<ReservationsListPage />} />
                <Route path="/reservaciones/nueva" element={<ReservationFormPage />} />
                <Route path="/reservaciones/:id" element={<ReservationDetailPage />} />
                <Route path="/reservaciones/:id/editar" element={<ReservationFormPage />} />

                {/* Clientes */}
                <Route path="/clientes" element={<ClientsListPage />} />
                <Route path="/clientes/nuevo" element={<ClientFormPage />} />
                <Route path="/clientes/:id" element={<ClientDetailPage />} />
                <Route path="/clientes/:id/editar" element={<ClientFormPage />} />

                {/* Calendario & Bloqueos */}
                <Route path="/calendario" element={<CalendarPage />} />
                <Route path="/bloqueos" element={<AdminRoute><BlocksListPage /></AdminRoute>} />
                
                {/* Pagos */}
                <Route path="/pagos" element={<AdminRoute><PaymentsListPage /></AdminRoute>} />

                {/* Ubicaciones */}
                <Route path="/ubicaciones" element={<AdminRoute><UbicacionesListPage /></AdminRoute>} />
              </Route>
            </Routes>
          </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
