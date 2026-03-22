import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { AdminLayout } from './components/layout/AdminLayout'
import { PublicLayout } from './components/public/PublicLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const PatientsPage = lazy(() => import('./pages/admin/PatientsPage'))
const PatientFormPage = lazy(() => import('./pages/admin/PatientFormPage'))
const PatientDetailPage = lazy(() => import('./pages/admin/PatientDetailPage'))
const AgendaPage = lazy(() => import('./pages/admin/AgendaPage'))
const PrescriptionsPage = lazy(() => import('./pages/admin/PrescriptionsPage'))
const PrescriptionFormPage = lazy(() => import('./pages/admin/PrescriptionFormPage'))
const PrescriptionDetailPage = lazy(() => import('./pages/admin/PrescriptionDetailPage'))
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'))
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'))
const ProductDetailPage = lazy(() => import('./pages/admin/ProductDetailPage'))
const ConfigPage = lazy(() => import('./pages/admin/ConfigPage'))
const WaitlistPage = lazy(() => import('./pages/admin/WaitlistPage'))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'))
const SurveysPage = lazy(() => import('./pages/admin/SurveysPage'))
const PricingPage = lazy(() => import('./pages/admin/PricingPage'))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const NewOrderPage = lazy(() => import('./pages/admin/NewOrderPage'))
const OrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'))
const SalesPage = lazy(() => import('./pages/admin/SalesPage'))
const NewSalePage = lazy(() => import('./pages/admin/NewSalePage'))
const SaleDetailPage = lazy(() => import('./pages/admin/SaleDetailPage'))

// Public pages
const HomePage = lazy(() => import('./pages/public/HomePage'))
const BookingPage = lazy(() => import('./pages/public/BookingPage'))
const AppointmentPage = lazy(() => import('./pages/public/AppointmentPage'))
const SurveyPage = lazy(() => import('./pages/public/SurveyPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{
          borderColor: 'var(--border)',
          borderTopColor: 'var(--btn-primary-bg)',
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public portal */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/reservar" element={<BookingPage />} />
                  <Route path="/cita/:token" element={<AppointmentPage />} />
                  <Route path="/encuesta/:token" element={<SurveyPage />} />
                </Route>

                {/* Admin login */}
                <Route path="/admin/login" element={<LoginPage />} />

                {/* Admin (protected) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="agenda" element={<AgendaPage />} />
                  <Route path="pacientes" element={<PatientsPage />} />
                  <Route path="pacientes/nuevo" element={<PatientFormPage />} />
                  <Route path="pacientes/:id" element={<PatientDetailPage />} />
                  <Route path="pacientes/:id/editar" element={<PatientFormPage />} />
                  <Route path="recetas" element={<PrescriptionsPage />} />
                  <Route path="recetas/nueva" element={<PrescriptionFormPage />} />
                  <Route path="recetas/:id" element={<PrescriptionDetailPage />} />
                  <Route path="inventario" element={<InventoryPage />} />
                  <Route path="inventario/nuevo" element={<ProductFormPage />} />
                  <Route path="inventario/:id" element={<ProductDetailPage />} />
                  <Route path="inventario/:id/editar" element={<ProductFormPage />} />
                  <Route path="lista-espera" element={<WaitlistPage />} />
                  <Route path="reportes" element={<ReportsPage />} />
                  <Route path="encuestas" element={<SurveysPage />} />
                  <Route path="pedidos" element={<OrdersPage />} />
                  <Route path="pedidos/nuevo" element={<NewOrderPage />} />
                  <Route path="pedidos/:id" element={<OrderDetailPage />} />
                  <Route path="precios" element={<PricingPage />} />
                  <Route path="ventas" element={<SalesPage />} />
                  <Route path="ventas/nueva" element={<NewSalePage />} />
                  <Route path="ventas/:id" element={<SaleDetailPage />} />
                  <Route path="configuracion" element={<ConfigPage />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '6px',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
