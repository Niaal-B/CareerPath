import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AdminLayout } from './layouts/AdminLayout'
import LandingPage from './pages/Landing'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import QuestionBuilderPage from './pages/admin/QuestionBuilderPage'
import QuestionBankPage from './pages/admin/QuestionBankPage.tsx'
import RequestsPage from './pages/admin/RequestsPage'
import ResourcesPage from './pages/admin/ResourcesPage'
import ReviewsPage from './pages/admin/ReviewsPage'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import StudentRecommendationsPage from './pages/dashboard/StudentRecommendationsPage'
import StudentRequestsPage from './pages/dashboard/StudentRequestsPage'
import StudentTestsPage from './pages/dashboard/StudentTestsPage'
import TestTakingPage from './pages/dashboard/TestTakingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/requests"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout>
                <StudentRequestsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tests"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout>
                <StudentTestsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tests/:testId"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout>
                <TestTakingPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/recommendations"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout>
                <StudentRecommendationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <RequestsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <QuestionBuilderPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/question-bank"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <QuestionBankPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <ReviewsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/resources"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout>
                <ResourcesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
