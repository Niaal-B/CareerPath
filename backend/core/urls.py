from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminPersonalizedTestCreateView,
    AdminPersonalizedTestDetailView,
    AdminQuestionCreateView,
    AdminTestAssignView,
    AdminTestByRequestView,
    AdminTestRequestListView,
    CurrentUserView,
    CustomTokenObtainPairView,
    StudentAnswerSubmitView,
    StudentDashboardView,
    StudentRegistrationView,
    StudentTestDetailView,
    StudentTestListView,
    StudentTestRequestView,
    StudentTestSubmitView,
)


urlpatterns = [
    path('auth/register/', StudentRegistrationView.as_view(), name='student-register'),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token-obtain'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('student/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('student/test-requests/', StudentTestRequestView.as_view(), name='student-test-requests'),
    path('student/tests/', StudentTestListView.as_view(), name='student-test-list'),
    path('student/tests/<int:test_id>/', StudentTestDetailView.as_view(), name='student-test-detail'),
    path('student/tests/<int:test_id>/answer/', StudentAnswerSubmitView.as_view(), name='student-submit-answer'),
    path('student/tests/<int:test_id>/submit/', StudentTestSubmitView.as_view(), name='student-submit-test'),
    path('admin/test-requests/', AdminTestRequestListView.as_view(), name='admin-test-requests'),
    path('admin/test-requests/<int:request_id>/create-test/', AdminPersonalizedTestCreateView.as_view(), name='admin-create-test'),
    path('admin/test-requests/<int:request_id>/test/', AdminTestByRequestView.as_view(), name='admin-test-by-request'),
    path('admin/tests/<int:pk>/', AdminPersonalizedTestDetailView.as_view(), name='admin-test-detail'),
    path('admin/tests/<int:test_id>/questions/', AdminQuestionCreateView.as_view(), name='admin-create-question'),
    path('admin/tests/<int:test_id>/assign/', AdminTestAssignView.as_view(), name='admin-assign-test'),
]

