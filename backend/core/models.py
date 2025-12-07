from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Roles.ADMIN)
        if extra_fields.get('is_staff') is not True or extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_staff=True and is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Roles(models.TextChoices):
        STUDENT = 'student', 'Student'
        ADMIN = 'admin', 'Admin'

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.STUDENT,
    )
    phone = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text="E.164 format recommended, e.g. +911234567890",
    )
    qualification = models.CharField(max_length=255, blank=True)
    interests = models.TextField(blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.role})"

    objects = UserManager()


class TestRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In progress'
        ASSIGNED = 'assigned', 'Assigned'
        COMPLETED = 'completed', 'Completed'

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_requests')
    interests_snapshot = models.TextField(blank=True)
    qualification_snapshot = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request {self.id} by {self.student.email}"


class PersonalizedTest(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ASSIGNED = 'assigned', 'Assigned'
        COMPLETED = 'completed', 'Completed'

    request = models.OneToOneField(TestRequest, on_delete=models.CASCADE, related_name='personalized_test')
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tests')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    assigned_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Personalized test for {self.request.student.email}"


class Question(models.Model):
    personalized_test = models.ForeignKey(PersonalizedTest, on_delete=models.CASCADE, related_name='questions')
    template = models.ForeignKey(
        'QuestionTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='question_instances',
        help_text="Source template if this question was copied from the bank.",
    )
    prompt = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Question {self.order} for test {self.personalized_test_id}"


class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    label = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Option {self.order} for question {self.question_id}"


class StudentAnswer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    option = models.ForeignKey(Option, on_delete=models.CASCADE, related_name='answers')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='answers')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('question', 'student')

    def __str__(self):
        return f"Answer by {self.student.email} to question {self.question_id}"


class CareerRecommendation(models.Model):
    personalized_test = models.OneToOneField(PersonalizedTest, on_delete=models.CASCADE, related_name='recommendation')
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='recommendations')
    career_name = models.CharField(max_length=255)
    summary = models.TextField()
    companies = models.TextField(blank=True, help_text="List of companies (one per line) that offer this career")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recommendation for {self.personalized_test.request.student.email}"


class RoadmapStep(models.Model):
    recommendation = models.ForeignKey(CareerRecommendation, on_delete=models.CASCADE, related_name='steps')
    order = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Step {self.order} for recommendation {self.recommendation_id}"


class ResourceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name or emoji")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Resource Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class CareerResource(models.Model):
    class ResourceType(models.TextChoices):
        ARTICLE = 'article', 'Article'
        VIDEO = 'video', 'Video'
        COURSE = 'course', 'Course'
        BOOK = 'book', 'Book'
        CERTIFICATION = 'certification', 'Certification'
        TOOL = 'tool', 'Tool'
        COMMUNITY = 'community', 'Community'
        REPORT = 'report', 'Report'
        OTHER = 'other', 'Other'

    class DifficultyLevel(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    # Link to career recommendation (optional - can be general or specific)
    career_recommendation = models.ForeignKey(
        CareerRecommendation,
        on_delete=models.CASCADE,
        related_name='resources',
        null=True,
        blank=True,
        help_text="Leave blank for general resources available to all careers"
    )
    category = models.ForeignKey(ResourceCategory, on_delete=models.SET_NULL, null=True, related_name='resources')
    title = models.CharField(max_length=255)
    description = models.TextField()
    resource_type = models.CharField(max_length=20, choices=ResourceType.choices, default=ResourceType.ARTICLE)
    url = models.URLField(blank=True, help_text="External link to the resource")
    file = models.FileField(upload_to='resources/', blank=True, null=True, help_text="Upload file if resource is downloadable")
    difficulty_level = models.CharField(max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.BEGINNER)
    is_free = models.BooleanField(default=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Cost if not free")
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_resources')
    order = models.PositiveIntegerField(default=0, help_text="Order for display")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['career_recommendation', 'is_active']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_resource_type_display()})"


class StudentResourceProgress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'Not Started'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        SKIPPED = 'skipped', 'Skipped'

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resource_progress')
    resource = models.ForeignKey(CareerResource, on_delete=models.CASCADE, related_name='student_progress')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    notes = models.TextField(blank=True, help_text="Student's personal notes about this resource")
    is_favorite = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'resource')
        verbose_name_plural = "Student Resource Progress"
        indexes = [
            models.Index(fields=['student', 'status']),
        ]

    def __str__(self):
        return f"{self.student.email} - {self.resource.title} ({self.get_status_display()})"


class QuestionCategory(models.Model):
    """
    Admin-defined buckets to group reusable question templates (e.g. Plus Two, Engineering).
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    qualification_tag = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional tag to match student qualification (e.g. plus_two, engineering).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Question Categories"

    def __str__(self):
        return self.name


class QuestionTemplate(models.Model):
    """
    Reusable question that can be copied into a personalized test.
    """
    category = models.ForeignKey(
        QuestionCategory,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    prompt = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.category.name} · {self.prompt[:40]}..."


class OptionTemplate(models.Model):
    """
    Reusable options for a question template.
    """
    question = models.ForeignKey(
        QuestionTemplate,
        on_delete=models.CASCADE,
        related_name="options",
    )
    label = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Option {self.order} for template {self.question_id}"


class Company(models.Model):
    """Company information that can be recommended to students"""
    name = models.CharField(max_length=255)
    email = models.EmailField(help_text="Company contact email")
    website = models.URLField(blank=True, help_text="Company website URL")
    description = models.TextField(blank=True, help_text="Company description/details")
    location = models.CharField(max_length=255, blank=True, help_text="Company location")
    industry = models.CharField(max_length=100, blank=True, help_text="Industry sector")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['name']

    def __str__(self):
        return self.name


class JobRecommendation(models.Model):
    """Job positions recommended for students based on their career recommendation"""
    career_recommendation = models.ForeignKey(
        CareerRecommendation,
        on_delete=models.CASCADE,
        related_name='job_recommendations',
        help_text="Career recommendation this job is linked to"
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='job_recommendations',
        help_text="Company offering this position"
    )
    job_title = models.CharField(max_length=255, help_text="Job position title")
    job_description = models.TextField(help_text="Detailed job description")
    requirements = models.TextField(blank=True, help_text="Job requirements/qualifications")
    salary_range = models.CharField(max_length=100, blank=True, help_text="Salary range if available")
    job_type = models.CharField(
        max_length=50,
        choices=[
            ('full_time', 'Full Time'),
            ('part_time', 'Part Time'),
            ('contract', 'Contract'),
            ('internship', 'Internship'),
            ('remote', 'Remote'),
        ],
        default='full_time'
    )
    application_url = models.URLField(blank=True, help_text="Link to apply for this position")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0, help_text="Order for display")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['career_recommendation', 'is_active']),
        ]

    def __str__(self):
        return f"{self.job_title} at {self.company.name}"
