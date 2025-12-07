from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .forms import CustomUserChangeForm, CustomUserCreationForm
from .models import (
    CareerRecommendation,
    CareerResource,
    Company,
    CompanyCategory,
    JobRecommendation,
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
    User,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    list_display = ('email', 'phone', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active')
    ordering = ('email',)
    search_fields = ('email', 'first_name', 'last_name')

    fieldsets = (
        (None, {'fields': ('email', 'phone', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'qualification', 'interests')}),
        (
            'Permissions',
            {
                'fields': (
                    'role',
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                )
            },
        ),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )


@admin.register(TestRequest)
class TestRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('student__email',)


class OptionInline(admin.TabularInline):
    model = Option
    extra = 0


class OptionTemplateInline(admin.TabularInline):
    model = OptionTemplate
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('prompt', 'personalized_test', 'order')
    list_filter = ('personalized_test',)
    inlines = [OptionInline]


@admin.register(QuestionCategory)
class QuestionCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'qualification_tag', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'qualification_tag')
    ordering = ('name',)


@admin.register(QuestionTemplate)
class QuestionTemplateAdmin(admin.ModelAdmin):
    list_display = ('prompt', 'category', 'order', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('prompt', 'category__name')
    ordering = ('category', 'order', 'id')
    inlines = [OptionTemplateInline]


@admin.register(PersonalizedTest)
class PersonalizedTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'admin', 'status', 'assigned_at')
    list_filter = ('status',)
    search_fields = ('request__student__email',)


@admin.register(CareerRecommendation)
class CareerRecommendationAdmin(admin.ModelAdmin):
    list_display = ('id', 'personalized_test', 'career_name', 'created_at')
    search_fields = ('career_name', 'summary', 'companies')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Basic Information', {
            'fields': ('personalized_test', 'admin', 'career_name', 'summary')
        }),
        ('Companies', {
            'fields': ('companies',),
            'description': 'Enter one company name per line. These will be displayed as tags to the student.'
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(RoadmapStep)
class RoadmapStepAdmin(admin.ModelAdmin):
    list_display = ('title', 'recommendation', 'order')
    ordering = ('recommendation', 'order')


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('student', 'question', 'option', 'submitted_at')
    search_fields = ('student__email',)


@admin.register(ResourceCategory)
class ResourceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(CareerResource)
class CareerResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'category', 'career_recommendation', 'difficulty_level', 'is_free', 'is_active', 'created_at')
    list_filter = ('resource_type', 'difficulty_level', 'is_free', 'is_active', 'category')
    search_fields = ('title', 'description', 'career_recommendation__career_name')
    list_editable = ('is_active',)
    ordering = ('order', 'created_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'career_recommendation')
        }),
        ('Resource Details', {
            'fields': ('resource_type', 'url', 'file', 'difficulty_level')
        }),
        ('Pricing', {
            'fields': ('is_free', 'cost')
        }),
        ('Display', {
            'fields': ('order', 'is_active')
        }),
        ('Metadata', {
            'fields': ('admin', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('admin', 'created_at', 'updated_at')


@admin.register(StudentResourceProgress)
class StudentResourceProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'resource', 'status', 'is_favorite', 'updated_at')
    list_filter = ('status', 'is_favorite')
    search_fields = ('student__email', 'resource__title')
    readonly_fields = ('started_at', 'completed_at', 'updated_at')


@admin.register(CompanyCategory)
class CompanyCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    list_editable = ('is_active', 'order')
    ordering = ('order', 'name')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'icon')
        }),
        ('Display', {
            'fields': ('order', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at',)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'category', 'industry', 'location', 'is_active', 'created_at')
    list_filter = ('is_active', 'industry', 'category')
    search_fields = ('name', 'email', 'description')
    list_editable = ('is_active',)
    ordering = ('category', 'name')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'website', 'description')
        }),
        ('Categorization', {
            'fields': ('category',)
        }),
        ('Location & Industry', {
            'fields': ('location', 'industry')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(JobRecommendation)
class JobRecommendationAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'company', 'career_recommendation', 'job_type', 'is_active', 'order')
    list_filter = ('job_type', 'is_active', 'company')
    search_fields = ('job_title', 'company__name', 'job_description')
    list_editable = ('is_active', 'order')
    ordering = ('order', 'created_at')
    fieldsets = (
        ('Job Information', {
            'fields': ('career_recommendation', 'company', 'job_title', 'job_description')
        }),
        ('Job Details', {
            'fields': ('requirements', 'salary_range', 'job_type', 'application_url')
        }),
        ('Display', {
            'fields': ('order', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at',)
