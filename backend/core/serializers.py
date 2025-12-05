from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    CareerRecommendation,
    CareerResource,
    Option,
    OptionTemplate,
    PersonalizedTest,
    QuestionCategory,
    QuestionTemplate,
    Question,
    ResourceCategory,
    RoadmapStep,
    StudentAnswer,
    StudentResourceProgress,
    TestRequest,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'qualification',
            'interests',
        )


class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'password',
            'first_name',
            'last_name',
            'qualification',
            'interests',
        )

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data, role=User.Roles.STUDENT)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class TestRequestSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = TestRequest
        fields = (
            'id',
            'student',
            'interests_snapshot',
            'qualification_snapshot',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('status', 'created_at', 'updated_at')


class TestRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestRequest
        fields = ('interests_snapshot', 'qualification_snapshot')


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ('id', 'label', 'description', 'order')


class OptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ('label', 'description', 'order')


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True)

    class Meta:
        model = Question
        fields = ('id', 'prompt', 'order', 'options')


class QuestionCreateSerializer(serializers.ModelSerializer):
    options = OptionCreateSerializer(many=True)

    class Meta:
        model = Question
        fields = ('prompt', 'order', 'options')

    def create(self, validated_data):
        options_data = validated_data.pop('options')
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            Option.objects.create(question=question, **option_data)
        return question


class PersonalizedTestSerializer(serializers.ModelSerializer):
    request = TestRequestSerializer()
    questions = QuestionSerializer(many=True)

    class Meta:
        model = PersonalizedTest
        fields = ('id', 'request', 'status', 'assigned_at', 'completed_at', 'questions')


class StudentAnswerSerializer(serializers.ModelSerializer):
    question = serializers.PrimaryKeyRelatedField(queryset=Question.objects.all())
    option = serializers.PrimaryKeyRelatedField(queryset=Option.objects.all())

    class Meta:
        model = StudentAnswer
        fields = ('question', 'option')

    def validate(self, attrs):
        if attrs['option'].question_id != attrs['question'].id:
            raise serializers.ValidationError("Option does not belong to question")
        return attrs

    def create(self, validated_data):
        student = self.context['request'].user
        answer, _ = StudentAnswer.objects.update_or_create(
            question=validated_data['question'],
            student=student,
            defaults={'option': validated_data['option']},
        )
        return answer


class RoadmapStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapStep
        fields = ('id', 'order', 'title', 'description')


class RoadmapStepCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapStep
        fields = ('order', 'title', 'description')


class CareerRecommendationSerializer(serializers.ModelSerializer):
    steps = RoadmapStepSerializer(many=True)
    resources = serializers.SerializerMethodField()

    class Meta:
        model = CareerRecommendation
        fields = ('id', 'career_name', 'summary', 'created_at', 'steps', 'resources')

    def get_resources(self, obj):
        resources = obj.resources.filter(is_active=True).order_by('order', 'created_at')
        return CareerResourceSerializer(resources, many=True, context=self.context).data


class CareerRecommendationCreateSerializer(serializers.ModelSerializer):
    steps = RoadmapStepCreateSerializer(many=True)

    class Meta:
        model = CareerRecommendation
        fields = ('career_name', 'summary', 'steps')

    def create(self, validated_data):
        steps_data = validated_data.pop('steps')
        recommendation = CareerRecommendation.objects.create(**validated_data)
        for step_data in steps_data:
            RoadmapStep.objects.create(recommendation=recommendation, **step_data)
        return recommendation


class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceCategory
        fields = ('id', 'name', 'description', 'icon', 'created_at')
        read_only_fields = ('created_at',)


class CareerResourceSerializer(serializers.ModelSerializer):
    category = ResourceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ResourceCategory.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    admin = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    student_progress = serializers.SerializerMethodField()

    class Meta:
        model = CareerResource
        fields = (
            'id',
            'career_recommendation',
            'category',
            'category_id',
            'title',
            'description',
            'resource_type',
            'url',
            'file',
            'file_url',
            'difficulty_level',
            'is_free',
            'cost',
            'admin',
            'order',
            'is_active',
            'created_at',
            'updated_at',
            'student_progress',
        )
        read_only_fields = ('admin', 'created_at', 'updated_at')

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_student_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == User.Roles.STUDENT:
            try:
                progress = obj.student_progress.get(student=request.user)
                return {
                    'status': progress.status,
                    'is_favorite': progress.is_favorite,
                    'notes': progress.notes,
                    'started_at': progress.started_at,
                    'completed_at': progress.completed_at,
                }
            except StudentResourceProgress.DoesNotExist:
                return None
        return None


class CareerResourceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerResource
        fields = (
            'career_recommendation',
            'category',
            'title',
            'description',
            'resource_type',
            'url',
            'file',
            'difficulty_level',
            'is_free',
            'cost',
            'order',
            'is_active',
        )

    def create(self, validated_data):
        validated_data['admin'] = self.context['request'].user
        return super().create(validated_data)


# ===== Question bank serializers =====


class QuestionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionCategory
        fields = ('id', 'name', 'description', 'qualification_tag', 'is_active', 'created_at')
        read_only_fields = ('created_at',)


class OptionTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionTemplate
        fields = ('id', 'label', 'description', 'order')


class OptionTemplateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionTemplate
        fields = ('label', 'description', 'order')


class QuestionTemplateSerializer(serializers.ModelSerializer):
    category = QuestionCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=QuestionCategory.objects.filter(is_active=True),
        source='category',
        write_only=True
    )
    options = OptionTemplateSerializer(many=True)

    class Meta:
        model = QuestionTemplate
        fields = ('id', 'category', 'category_id', 'prompt', 'order', 'is_active', 'options', 'created_at')
        read_only_fields = ('created_at',)


class QuestionTemplateCreateSerializer(serializers.ModelSerializer):
    options = OptionTemplateCreateSerializer(many=True)

    class Meta:
        model = QuestionTemplate
        fields = ('category', 'prompt', 'order', 'is_active', 'options')

    def create(self, validated_data):
        options_data = validated_data.pop('options')
        template = QuestionTemplate.objects.create(**validated_data)
        for option_data in options_data:
            OptionTemplate.objects.create(question=template, **option_data)
        return template

    def update(self, instance, validated_data):
        # Simple update: replace options if provided
        options_data = validated_data.pop('options', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            instance.options.all().delete()
            for option_data in options_data:
                OptionTemplate.objects.create(question=instance, **option_data)
        return instance


class StudentResourceProgressSerializer(serializers.ModelSerializer):
    resource = CareerResourceSerializer(read_only=True)
    resource_id = serializers.PrimaryKeyRelatedField(
        queryset=CareerResource.objects.all(),
        source='resource',
        write_only=True
    )

    class Meta:
        model = StudentResourceProgress
        fields = (
            'id',
            'resource',
            'resource_id',
            'status',
            'notes',
            'is_favorite',
            'started_at',
            'completed_at',
            'updated_at',
        )
        read_only_fields = ('started_at', 'completed_at', 'updated_at')

    def create(self, validated_data):
        student = self.context['request'].user
        resource = validated_data['resource']
        status = validated_data.get('status', StudentResourceProgress.Status.NOT_STARTED)
        
        progress, created = StudentResourceProgress.objects.update_or_create(
            student=student,
            resource=resource,
            defaults={
                'status': status,
                'notes': validated_data.get('notes', ''),
                'is_favorite': validated_data.get('is_favorite', False),
            }
        )
        
        # Update timestamps based on status
        from django.utils import timezone
        if status == StudentResourceProgress.Status.IN_PROGRESS and not progress.started_at:
            progress.started_at = timezone.now()
        elif status == StudentResourceProgress.Status.COMPLETED and not progress.completed_at:
            progress.completed_at = timezone.now()
        progress.save()
        
        return progress

