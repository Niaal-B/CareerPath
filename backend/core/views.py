from django.db import models
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    CareerRecommendation,
    CareerResource,
    Option,
    PersonalizedTest,
    QuestionCategory,
    QuestionTemplate,
    Question,
    ResourceCategory,
    RoadmapStep,
    StudentAnswer,
    StudentResourceProgress,
    TestRequest,
    User,
)
from .pdf_generator import generate_recommendation_pdf
from .serializers import (
    CareerRecommendationCreateSerializer,
    CareerRecommendationSerializer,
    CareerResourceCreateSerializer,
    CareerResourceSerializer,
    CustomTokenObtainPairSerializer,
    QuestionCategorySerializer,
    QuestionTemplateCreateSerializer,
    QuestionTemplateSerializer,
    PersonalizedTestSerializer,
    QuestionCreateSerializer,
    QuestionSerializer,
    ResourceCategorySerializer,
    StudentAnswerSerializer,
    StudentRegistrationSerializer,
    StudentResourceProgressSerializer,
    TestRequestCreateSerializer,
    TestRequestSerializer,
    UserSerializer,
)


class StudentRegistrationView(generics.CreateAPIView):
    serializer_class = StudentRegistrationSerializer
    permission_classes = (permissions.AllowAny,)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)


class CurrentUserView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class StudentTestRequestView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TestRequestCreateSerializer
        return TestRequestSerializer

    def get_queryset(self):
        return TestRequest.objects.filter(student=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can request tests.")
        serializer.save(student=self.request.user)


class StudentDashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view this dashboard.")
        latest_request = request.user.test_requests.order_by('-created_at').first()
        request_data = TestRequestSerializer(latest_request).data if latest_request else None
        recommendation_data = None
        test_data = None
        if latest_request and hasattr(latest_request, 'personalized_test'):
            personalized_test = latest_request.personalized_test
            test_data = PersonalizedTestSerializer(personalized_test).data
            recommendation = getattr(personalized_test, 'recommendation', None)
            if recommendation:
                recommendation_data = CareerRecommendationSerializer(recommendation).data
        return Response(
            {
                'user': UserSerializer(request.user).data,
                'latest_request': request_data,
                'personalized_test': test_data,
                'recommendation': recommendation_data,
            }
        )


class AdminDashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view this dashboard.")
        
        from datetime import timedelta
        
        # Calculate statistics
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Pending requests
        pending_requests = TestRequest.objects.filter(status=TestRequest.Status.PENDING).count()
        pending_this_week = TestRequest.objects.filter(
            status=TestRequest.Status.PENDING,
            created_at__gte=week_ago
        ).count()
        
        # Total MCQs (questions) crafted
        total_questions = Question.objects.count()
        questions_this_month = Question.objects.filter(
            personalized_test__request__created_at__gte=month_ago
        ).count()
        
        # Recommendations sent
        total_recommendations = CareerRecommendation.objects.count()
        recommendations_this_week = CareerRecommendation.objects.filter(
            created_at__gte=week_ago
        ).count()
        
        # Recent pending requests (for focus queue)
        recent_requests = TestRequest.objects.filter(
            status__in=[TestRequest.Status.PENDING, TestRequest.Status.IN_PROGRESS]
        ).select_related('student').order_by('-created_at')[:5]
        
        recent_requests_data = []
        for req in recent_requests:
            # Get test if exists
            test = None
            if hasattr(req, 'personalized_test'):
                test = req.personalized_test
                questions_count = test.questions.count()
                status_text = 'Questions drafted' if questions_count > 0 else 'Need review'
            else:
                status_text = 'Need review'
            
            # Calculate due date (2 days from creation)
            due_date = req.created_at + timedelta(days=2)
            is_today = due_date.date() == now.date()
            is_tomorrow = due_date.date() == (now + timedelta(days=1)).date()
            
            if is_today:
                due_text = f"Today · {due_date.strftime('%I %p')}"
            elif is_tomorrow:
                due_text = f"Tomorrow · {due_date.strftime('%I %p')}"
            else:
                due_text = due_date.strftime('%b %d · %I %p')
            
            recent_requests_data.append({
                'id': req.id,
                'title': f"Test Request #{req.id}",
                'student': req.student.get_full_name() or req.student.email.split('@')[0],
                'student_email': req.student.email,
                'due': due_text,
                'status': status_text,
                'request_status': req.status,
                'created_at': req.created_at,
                'interests': req.interests_snapshot or req.student.interests or 'No interests provided',
            })
        
        return Response({
            'stats': {
                'pending_requests': pending_requests,
                'pending_requests_trend': f"+{pending_this_week} this week",
                'mcqs_crafted': total_questions,
                'mcqs_crafted_trend': f"+{questions_this_month} this month",
                'recommendations_sent': total_recommendations,
                'recommendations_sent_trend': f"+{recommendations_this_week} this week",
            },
            'recent_requests': recent_requests_data,
        })


class AdminTestRequestListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = TestRequestSerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view this data.")
        status = self.request.query_params.get('status')
        queryset = TestRequest.objects.select_related('student').order_by('-created_at')
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class AdminPersonalizedTestCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, request_id):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can create tests.")
        try:
            test_request = TestRequest.objects.get(id=request_id)
        except TestRequest.DoesNotExist:
            raise PermissionDenied("Test request not found.")
        if hasattr(test_request, 'personalized_test'):
            return Response({'message': 'Test already exists.', 'test': PersonalizedTestSerializer(test_request.personalized_test).data})
        personalized_test = PersonalizedTest.objects.create(
            request=test_request,
            status=PersonalizedTest.Status.DRAFT,
            admin=request.user
        )
        test_request.status = TestRequest.Status.IN_PROGRESS
        test_request.save()
        return Response({'message': 'Test created successfully.', 'test': PersonalizedTestSerializer(personalized_test).data}, status=201)


class AdminPersonalizedTestDetailView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = PersonalizedTestSerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view this data.")
        return PersonalizedTest.objects.select_related('request', 'request__student').prefetch_related('questions', 'questions__options')


class AdminTestByRequestView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, request_id):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view this data.")
        try:
            test_request = TestRequest.objects.get(id=request_id)
        except TestRequest.DoesNotExist:
            raise PermissionDenied("Test request not found.")
        if not hasattr(test_request, 'personalized_test'):
            return Response({'error': 'No test created for this request yet.'}, status=404)
        test = PersonalizedTest.objects.select_related('request', 'request__student').prefetch_related('questions', 'questions__options').get(id=test_request.personalized_test.id)
        return Response(PersonalizedTestSerializer(test).data)


class AdminQuestionCreateView(generics.CreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = QuestionCreateSerializer

    def perform_create(self, serializer):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can create questions.")
        test_id = self.kwargs['test_id']
        try:
            test = PersonalizedTest.objects.get(id=test_id)
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found.")
        question = serializer.save(personalized_test=test)
        return question


class AdminTestAssignView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, test_id):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can assign tests.")
        try:
            test = PersonalizedTest.objects.get(id=test_id)
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found.")
        if test.questions.count() == 0:
            return Response({'error': 'Cannot assign test without questions.'}, status=400)
        test.status = PersonalizedTest.Status.ASSIGNED
        test.request.status = TestRequest.Status.ASSIGNED
        test.save()
        test.request.save()
        return Response({'message': 'Test assigned successfully.', 'test': PersonalizedTestSerializer(test).data})


class StudentTestListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view their tests.")
        tests = PersonalizedTest.objects.filter(
            request__student=request.user,
            status=PersonalizedTest.Status.ASSIGNED
        ).select_related('request').order_by('-request__created_at')
        return Response({
            'tests': [
                {
                    'id': test.id,
                    'request_id': test.request.id,
                    'created_at': test.request.created_at,
                    'questions_count': test.questions.count(),
                    'answered_count': StudentAnswer.objects.filter(
                        student=request.user,
                        question__personalized_test=test
                    ).count(),
                }
                for test in tests
            ]
        })


class StudentTestDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, test_id):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view tests.")
        try:
            test = PersonalizedTest.objects.prefetch_related('questions', 'questions__options').get(
                id=test_id,
                request__student=request.user
            )
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found.")
        if test.status != PersonalizedTest.Status.ASSIGNED:
            return Response({'error': 'Test is not available for taking.'}, status=400)
        questions_data = []
        for question in test.questions.all():
            answer = StudentAnswer.objects.filter(student=request.user, question=question).first()
            questions_data.append({
                'id': question.id,
                'prompt': question.prompt,
                'order': question.order,
                'options': [
                    {
                        'id': option.id,
                        'label': option.label,
                        'description': option.description,
                        'order': option.order,
                    }
                    for option in question.options.all()
                ],
                'selected_option_id': answer.option.id if answer and answer.option else None,
            })
        return Response({
            'test': {
                'id': test.id,
                'request_id': test.request.id,
                'questions': sorted(questions_data, key=lambda x: x['order']),
                'total_questions': len(questions_data),
                'answered_count': StudentAnswer.objects.filter(
                    student=request.user,
                    question__personalized_test=test
                ).count(),
            }
        })


class StudentAnswerSubmitView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, test_id):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can submit answers.")
        try:
            test = PersonalizedTest.objects.get(id=test_id, request__student=request.user)
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found.")
        if test.status != PersonalizedTest.Status.ASSIGNED:
            return Response({'error': 'Test is not available for taking.'}, status=400)
        question_id = request.data.get('question_id')
        option_id = request.data.get('option_id')
        if not question_id or not option_id:
            return Response({'error': 'question_id and option_id are required.'}, status=400)
        try:
            question = Question.objects.get(id=question_id, personalized_test=test)
            option = question.options.get(id=option_id)
        except (Question.DoesNotExist, Option.DoesNotExist):
            return Response({'error': 'Invalid question or option.'}, status=400)
        answer, created = StudentAnswer.objects.update_or_create(
            student=request.user,
            question=question,
            defaults={'option': option}
        )
        return Response({
            'message': 'Answer submitted successfully.',
            'answer': {
                'question_id': answer.question.id,
                'option_id': answer.option.id,
            }
        })


class StudentTestSubmitView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, test_id):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can submit tests.")
        try:
            test = PersonalizedTest.objects.get(id=test_id, request__student=request.user)
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found.")
        if test.status != PersonalizedTest.Status.ASSIGNED:
            return Response({'error': 'Test is not available for submission.'}, status=400)
        total_questions = test.questions.count()
        answered_count = StudentAnswer.objects.filter(
            student=request.user,
            question__personalized_test=test
        ).count()
        if answered_count < total_questions:
            return Response({
                'error': f'Please answer all questions. {answered_count}/{total_questions} answered.'
            }, status=400)
        test.status = PersonalizedTest.Status.COMPLETED
        test.completed_at = timezone.now()
        test.request.status = TestRequest.Status.COMPLETED
        test.save()
        test.request.save()
        return Response({
            'message': 'Test submitted successfully.',
            'test': PersonalizedTestSerializer(test).data
        })


class StudentRecommendationsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view their recommendations.")
        recommendations = CareerRecommendation.objects.filter(
            personalized_test__request__student=request.user
        ).select_related('personalized_test', 'personalized_test__request').prefetch_related(
            'steps', 'resources', 'resources__category', 'resources__student_progress'
        ).order_by('-created_at')
        
        # Use serializer to get resources included
        serializer = CareerRecommendationSerializer(recommendations, many=True, context={'request': request})
        recommendations_data = serializer.data
        
        # Add test_id and request_id to each recommendation
        for rec, rec_data in zip(recommendations, recommendations_data):
            rec_data['test_id'] = rec.personalized_test.id
            rec_data['request_id'] = rec.personalized_test.request.id
        
        return Response({'recommendations': recommendations_data})


class AdminRecommendationsListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view recommendations.")
        recommendations = CareerRecommendation.objects.select_related(
            'personalized_test', 'personalized_test__request', 'personalized_test__request__student'
        ).order_by('-created_at')
        return Response({
            'recommendations': [
                {
                    'id': rec.id,
                    'career_name': rec.career_name,
                    'student_email': rec.personalized_test.request.student.email,
                    'created_at': rec.created_at,
                }
                for rec in recommendations
            ]
        })


class AdminCompletedTestsListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view completed tests.")
        tests = PersonalizedTest.objects.filter(
            status=PersonalizedTest.Status.COMPLETED
        ).select_related('request', 'request__student').prefetch_related('questions').order_by('-completed_at')
        return Response({
            'tests': [
                {
                    'id': test.id,
                    'request_id': test.request.id,
                    'student': {
                        'email': test.request.student.email,
                        'qualification': test.request.qualification_snapshot,
                        'interests': test.request.interests_snapshot,
                    },
                    'completed_at': test.completed_at,
                    'questions_count': test.questions.count(),
                    'has_recommendation': hasattr(test, 'recommendation'),
                }
                for test in tests
            ]
        })


class AdminTestAnswersView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, test_id):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view test answers.")
        try:
            test = PersonalizedTest.objects.prefetch_related(
                'questions', 'questions__options', 'questions__answers', 'questions__answers__option'
            ).get(id=test_id, status=PersonalizedTest.Status.COMPLETED)
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found or not completed.")
        student = test.request.student
        answers_data = []
        for question in test.questions.all().order_by('order'):
            answer = StudentAnswer.objects.filter(student=student, question=question).first()
            answers_data.append({
                'question': {
                    'id': question.id,
                    'prompt': question.prompt,
                    'order': question.order,
                },
                'options': [
                    {
                        'id': option.id,
                        'label': option.label,
                        'description': option.description,
                        'order': option.order,
                    }
                    for option in question.options.all().order_by('order')
                ],
                'selected_answer': {
                    'option_id': answer.option.id if answer and answer.option else None,
                    'option_label': answer.option.label if answer and answer.option else None,
                } if (answer and answer.option) else None,
            })
        return Response({
            'test': {
                'id': test.id,
                'request_id': test.request.id,
                'student': {
                    'email': student.email,
                    'qualification': test.request.qualification_snapshot,
                    'interests': test.request.interests_snapshot,
                },
                'completed_at': test.completed_at,
                'answers': answers_data,
            }
        })


class AdminCreateRecommendationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, test_id):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can create recommendations.")
        try:
            test = PersonalizedTest.objects.get(id=test_id, status=PersonalizedTest.Status.COMPLETED)
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found or not completed.")
        if hasattr(test, 'recommendation'):
            return Response({'error': 'Recommendation already exists for this test.'}, status=400)
        serializer = CareerRecommendationCreateSerializer(data=request.data)
        if serializer.is_valid():
            recommendation = serializer.save(
                personalized_test=test,
                admin=request.user
            )
            return Response({
                'message': 'Recommendation created successfully.',
                'recommendation': CareerRecommendationSerializer(recommendation).data
            }, status=201)
        return Response(serializer.errors, status=400)


class StudentRecommendationExportView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, recommendation_id):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can export their recommendations.")
        try:
            recommendation = CareerRecommendation.objects.select_related(
                'personalized_test', 'personalized_test__request', 'personalized_test__request__student'
            ).prefetch_related('steps').get(
                id=recommendation_id,
                personalized_test__request__student=request.user
            )
        except CareerRecommendation.DoesNotExist:
            raise PermissionDenied("Recommendation not found.")
        
        student = recommendation.personalized_test.request.student
        
        # Generate PDF
        pdf_buffer = generate_recommendation_pdf(recommendation, student)
        
        # Create HTTP response with PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        filename = f"CareerPath_Recommendation_{recommendation.career_name.replace(' ', '_')}_{recommendation.created_at.strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response


# ========== RESOURCE MANAGEMENT VIEWS ==========

class AdminResourceCategoryListView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ResourceCategorySerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view resource categories.")
        return ResourceCategory.objects.all().order_by('name')


class AdminResourceCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ResourceCategorySerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can manage resource categories.")
        return ResourceCategory.objects.all()


class AdminResourceListView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CareerResourceCreateSerializer
        return CareerResourceSerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view resources.")
        queryset = CareerResource.objects.select_related('category', 'admin', 'career_recommendation').filter(is_active=True)
        
        # Filter by career recommendation if provided
        recommendation_id = self.request.query_params.get('recommendation_id')
        if recommendation_id:
            queryset = queryset.filter(career_recommendation_id=recommendation_id)
        
        # Filter by category if provided
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        return queryset.order_by('order', 'created_at')

    def perform_create(self, serializer):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can create resources.")
        serializer.save(admin=self.request.user)


class AdminResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = CareerResourceSerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can manage resources.")
        return CareerResource.objects.select_related('category', 'admin', 'career_recommendation')

    def perform_update(self, serializer):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can update resources.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can delete resources.")
        # Soft delete by setting is_active to False
        instance.is_active = False
        instance.save()


# ========== QUESTION BANK VIEWS ==========


class AdminQuestionCategoryListView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = QuestionCategorySerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view question categories.")
        include_inactive = self.request.query_params.get('include_inactive') == 'true'
        queryset = QuestionCategory.objects.all().order_by('name')
        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        return queryset


class AdminQuestionCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = QuestionCategorySerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can manage question categories.")
        return QuestionCategory.objects.all()

    def perform_destroy(self, instance):
        # Soft delete to keep history
        instance.is_active = False
        instance.save()


class AdminQuestionTemplateListView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuestionTemplateCreateSerializer
        return QuestionTemplateSerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can view question templates.")
        include_inactive = self.request.query_params.get('include_inactive') == 'true'
        category_id = self.request.query_params.get('category_id')
        queryset = QuestionTemplate.objects.select_related('category').prefetch_related('options').order_by('order', 'id')
        if not include_inactive:
            queryset = queryset.filter(is_active=True, category__is_active=True)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        qualification_tag = self.request.query_params.get('qualification_tag')
        if qualification_tag:
            queryset = queryset.filter(category__qualification_tag=qualification_tag)
        return queryset


class AdminQuestionTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return QuestionTemplateCreateSerializer
        return QuestionTemplateSerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can manage question templates.")
        return QuestionTemplate.objects.select_related('category').prefetch_related('options')

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class AdminTestAddTemplatesView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, test_id):
        if request.user.role != User.Roles.ADMIN:
            raise PermissionDenied("Only admins can add templates to tests.")
        try:
            test = PersonalizedTest.objects.select_related('request', 'request__student').prefetch_related('questions').get(id=test_id)
        except PersonalizedTest.DoesNotExist:
            raise PermissionDenied("Test not found.")

        category_ids = request.data.get('category_ids', [])
        template_ids = request.data.get('template_ids', [])
        if not category_ids and not template_ids:
            return Response({'error': 'Provide category_ids or template_ids.'}, status=400)

        templates_qs = QuestionTemplate.objects.filter(is_active=True, category__is_active=True)
        filters = models.Q()
        if category_ids:
            filters |= models.Q(category_id__in=category_ids)
        if template_ids:
            filters |= models.Q(id__in=template_ids)
        templates_qs = templates_qs.filter(filters).prefetch_related('options')

        existing_template_ids = set(
            test.questions.exclude(template__isnull=True).values_list('template_id', flat=True)
        )
        next_order = test.questions.aggregate(max_order=models.Max('order')).get('max_order') or 0

        created_questions = 0
        for template in templates_qs.order_by('order', 'id'):
            if template.id in existing_template_ids:
                continue
            next_order += 1
            question = Question.objects.create(
                personalized_test=test,
                template=template,
                prompt=template.prompt,
                order=next_order,
            )
            for option in template.options.all():
                Option.objects.create(
                    question=question,
                    label=option.label,
                    description=option.description,
                    order=option.order,
                )
            created_questions += 1

        if created_questions == 0:
            return Response({'message': 'No new questions were added (possibly already copied).'})

        return Response({
            'message': 'Questions copied successfully.',
            'added_questions': created_questions,
            'test': PersonalizedTestSerializer(test).data,
        }, status=201)


class StudentResourceListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view resources.")
        
        # Get resources for student's career recommendations
        student_recommendations = CareerRecommendation.objects.filter(
            personalized_test__request__student=request.user
        ).values_list('id', flat=True)
        
        # Get resources linked to student's recommendations or general resources (no career_recommendation)
        resources = CareerResource.objects.filter(
            is_active=True
        ).filter(
            models.Q(career_recommendation__in=student_recommendations) | models.Q(career_recommendation__isnull=True)
        ).select_related('category', 'admin').prefetch_related('student_progress').distinct()
        
        # Filter by category if provided
        category_id = request.query_params.get('category_id')
        if category_id:
            resources = resources.filter(category_id=category_id)
        
        # Filter by resource type if provided
        resource_type = request.query_params.get('resource_type')
        if resource_type:
            resources = resources.filter(resource_type=resource_type)
        
        serializer = CareerResourceSerializer(resources, many=True, context={'request': request})
        return Response({'resources': serializer.data})


class StudentResourceDetailView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = CareerResourceSerializer

    def get_queryset(self):
        if self.request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view resources.")
        
        # Get resources for student's career recommendations
        student_recommendations = CareerRecommendation.objects.filter(
            personalized_test__request__student=self.request.user
        ).values_list('id', flat=True)
        
        return CareerResource.objects.filter(
            is_active=True
        ).filter(
            models.Q(career_recommendation__in=student_recommendations) | models.Q(career_recommendation__isnull=True)
        ).select_related('category', 'admin').prefetch_related('student_progress')


class StudentResourceProgressView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, resource_id):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can update resource progress.")
        
        try:
            resource = CareerResource.objects.get(id=resource_id, is_active=True)
        except CareerResource.DoesNotExist:
            raise PermissionDenied("Resource not found.")
        
        # Verify student has access to this resource
        student_recommendations = CareerRecommendation.objects.filter(
            personalized_test__request__student=request.user
        ).values_list('id', flat=True)
        
        if resource.career_recommendation and resource.career_recommendation.id not in student_recommendations:
            raise PermissionDenied("You don't have access to this resource.")
        
        serializer = StudentResourceProgressSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            progress = serializer.save()
            return Response({
                'message': 'Progress updated successfully.',
                'progress': StudentResourceProgressSerializer(progress).data
            }, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request, resource_id):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view resource progress.")
        
        try:
            progress = StudentResourceProgress.objects.get(
                student=request.user,
                resource_id=resource_id
            )
            serializer = StudentResourceProgressSerializer(progress)
            return Response(serializer.data)
        except StudentResourceProgress.DoesNotExist:
            return Response({'progress': None})


class StudentMyResourcesView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != User.Roles.STUDENT:
            raise PermissionDenied("Only students can view their resources.")
        
        # Get all resources with progress for this student
        progress_list = StudentResourceProgress.objects.filter(
            student=request.user
        ).select_related('resource', 'resource__category').order_by('-updated_at')
        
        resources_data = []
        for progress in progress_list:
            resource_data = CareerResourceSerializer(progress.resource, context={'request': request}).data
            resource_data['progress'] = {
                'status': progress.status,
                'is_favorite': progress.is_favorite,
                'notes': progress.notes,
                'started_at': progress.started_at,
                'completed_at': progress.completed_at,
            }
            resources_data.append(resource_data)
        
        return Response({'resources': resources_data})
