from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CareerRecommendation, Option, PersonalizedTest, Question, RoadmapStep, StudentAnswer, TestRequest, User
from .serializers import (
    CareerRecommendationCreateSerializer,
    CareerRecommendationSerializer,
    CustomTokenObtainPairSerializer,
    PersonalizedTestSerializer,
    QuestionCreateSerializer,
    QuestionSerializer,
    StudentAnswerSerializer,
    StudentRegistrationSerializer,
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
        ).select_related('personalized_test', 'personalized_test__request').prefetch_related('steps').order_by('-created_at')
        return Response({
            'recommendations': [
                {
                    'id': rec.id,
                    'career_name': rec.career_name,
                    'summary': rec.summary,
                    'created_at': rec.created_at,
                    'test_id': rec.personalized_test.id,
                    'request_id': rec.personalized_test.request.id,
                    'steps': [
                        {
                            'id': step.id,
                            'order': step.order,
                            'title': step.title,
                            'description': step.description,
                        }
                        for step in rec.steps.all().order_by('order')
                    ],
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
