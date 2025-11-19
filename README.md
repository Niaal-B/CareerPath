# 🎯 CareerPath - Personalized Career Recommendation System

A full-stack web application that provides personalized career guidance through custom assessments. Students request tailored tests, and administrators create unique MCQ questions based on each student's profile. The system facilitates a collaborative approach where admins review responses and provide manual career recommendations with detailed roadmaps.

## ✨ Features

### For Students
- **User Registration & Authentication** - Secure JWT-based authentication
- **Profile Management** - Update qualifications and interests
- **Test Request System** - Request personalized assessments
- **Interactive Test Taking** - User-friendly MCQ interface with progress tracking
- **Career Recommendations** - View personalized career suggestions with detailed roadmaps
- **Dashboard Overview** - Track test requests, assigned tests, and recommendations

### For Administrators
- **Admin Dashboard** - Overview of all test requests and system activity
- **Test Request Management** - View and filter student test requests by status
- **Custom MCQ Builder** - Create personalized questions with multiple options for each student
- **Test Assignment** - Assign completed tests to students
- **Answer Review** - Review student responses to understand their thinking patterns
- **Career Recommendation Creation** - Create detailed career recommendations with step-by-step roadmaps

## 🛠️ Tech Stack

### Backend
- **Django 5.2.8** - Web framework
- **Django REST Framework** - RESTful API
- **SQLite (default) / PostgreSQL** - Database options
- **JWT Authentication** - Secure token-based auth
- **django-cors-headers** - CORS handling
- **python-dotenv** - Environment variable management

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Axios** - HTTP client

## 📋 Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ (optional – only if you disable SQLite)
- npm or yarn

## 🚀 Installation

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Choose your database**
   - **SQLite (default):** no extra setup required. A `db.sqlite3` file will be created automatically in the backend directory on first run.
   - **PostgreSQL (optional):**
     ```bash
     # Create database
     createdb career_db
     ```
     Make sure PostgreSQL is running and accessible.

5. **Create `.env` file**
   ```bash
   # Create .env file in backend directory
   ```
   
   Add the following to `backend/.env`:
   ```env
   USE_SQLITE=1          # Set to 0 to switch to PostgreSQL
   SQLITE_DB_NAME=db.sqlite3

   # Only required when USE_SQLITE=0
   POSTGRES_DB=career_db
   POSTGRES_USER=career_user
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432

   DJANGO_SECRET_KEY=your-secret-key-here
   DJANGO_DEBUG=1
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

   ACCESS_TOKEN_LIFETIME_MINUTES=60
   REFRESH_TOKEN_LIFETIME_DAYS=7
   ```

6. **Run migrations**
   ```bash
   python manage.py migrate
   ```

7. **Create superuser (Admin account)**
   ```bash
   python manage.py createsuperuser
   # Use email instead of username
   ```

8. **Run development server**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```env
   VITE_API_URL=http://localhost:8000/api/
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:5173`

## 🔄 Workflow

### Student Workflow
1. **Register** - Create an account with email, password, and profile information
2. **Request Test** - Submit a test request with interests and qualification
3. **Wait for Assignment** - Admin creates and assigns personalized test
4. **Take Test** - Answer all MCQ questions (no correct/incorrect answers)
5. **View Recommendation** - Receive personalized career recommendation with roadmap

### Admin Workflow
1. **Login** - Access admin dashboard
2. **Review Requests** - View pending test requests from students
3. **Create Test** - Generate a personalized test for a student
4. **Build MCQs** - Add custom questions with multiple options
5. **Assign Test** - Make test available to student
6. **Review Answers** - Analyze student responses after test completion
7. **Create Recommendation** - Provide career guidance with detailed roadmap steps

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - Student registration
- `POST /api/auth/token/` - Login (obtain JWT tokens)
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user info

### Student Endpoints
- `GET /api/student/dashboard/` - Student dashboard overview
- `GET /api/student/test-requests/` - List student's test requests
- `POST /api/student/test-requests/` - Create test request
- `GET /api/student/tests/` - List assigned tests
- `GET /api/student/tests/<test_id>/` - Get test details
- `POST /api/student/tests/<test_id>/answer/` - Submit answer
- `POST /api/student/tests/<test_id>/submit/` - Submit completed test
- `GET /api/student/recommendations/` - Get career recommendations

### Admin Endpoints
- `GET /api/admin/test-requests/` - List all test requests (with status filter)
- `POST /api/admin/test-requests/<request_id>/create-test/` - Create personalized test
- `GET /api/admin/test-requests/<request_id>/test/` - Get test by request ID
- `GET /api/admin/tests/<test_id>/` - Get test details
- `POST /api/admin/tests/<test_id>/questions/` - Add question to test
- `POST /api/admin/tests/<test_id>/assign/` - Assign test to student
- `GET /api/admin/tests/completed/` - List completed tests
- `GET /api/admin/tests/<test_id>/answers/` - Get student answers
- `POST /api/admin/tests/<test_id>/recommendation/` - Create career recommendation

## 📁 Project Structure

```
Career_Recommendation/
├── backend/
│   ├── career_backend/      # Django project settings
│   │   ├── settings.py      # Django configuration
│   │   ├── urls.py          # Main URL routing
│   │   └── wsgi.py          # WSGI config
│   ├── core/                # Main application
│   │   ├── models.py        # Database models
│   │   ├── serializers.py   # DRF serializers
│   │   ├── views.py         # API views
│   │   ├── urls.py          # App URL routing
│   │   ├── admin.py         # Django admin configuration
│   │   └── migrations/      # Database migrations
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   │   ├── BrandLogo.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── context/         # React context
    │   │   └── AuthContext.tsx
    │   ├── layouts/         # Layout components
    │   │   ├── AdminLayout.tsx
    │   │   └── DashboardLayout.tsx
    │   ├── lib/             # Utilities
    │   │   └── api.ts       # API client configuration
    │   ├── pages/           # Page components
    │   │   ├── admin/       # Admin pages
    │   │   │   ├── AdminDashboard.tsx
    │   │   │   ├── QuestionBuilderPage.tsx
    │   │   │   ├── RequestsPage.tsx
    │   │   │   └── ReviewsPage.tsx
    │   │   ├── auth/        # Authentication pages
    │   │   │   ├── LoginPage.tsx
    │   │   │   └── RegisterPage.tsx
    │   │   ├── dashboard/   # Student dashboard pages
    │   │   │   ├── StudentDashboard.tsx
    │   │   │   ├── StudentRequestsPage.tsx
    │   │   │   ├── StudentTestsPage.tsx
    │   │   │   ├── TestTakingPage.tsx
    │   │   │   └── StudentRecommendationsPage.tsx
    │   │   └── Landing.tsx
    │   ├── services/        # API service functions
    │   │   ├── auth.ts
    │   │   └── dashboard.ts
    │   ├── App.tsx          # Main app component
    │   └── main.tsx         # Entry point
    ├── package.json
    └── vite.config.ts
```

## 🔐 User Roles

### Student
- Can register and create account
- Can request personalized tests
- Can take assigned tests
- Can view career recommendations

### Admin
- Can view all test requests
- Can create personalized tests
- Can build custom MCQs
- Can assign tests to students
- Can review student answers
- Can create career recommendations

## 🎨 Key Features

- **No Automatic Scoring** - Tests are subjective; all answers are valid
- **Personalized Questions** - Each student gets unique questions based on their profile
- **Manual Recommendations** - Admins provide thoughtful, personalized career guidance
- **Detailed Roadmaps** - Step-by-step career development plans
- **Real-time Progress** - Track test completion and recommendation status
- **Modern UI** - Beautiful, responsive design with Tailwind CSS

## 🧪 Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm run lint
```

## 📝 Environment Variables

### Backend (.env)
- `USE_SQLITE` - Set to `1` (default) to use SQLite, `0` to switch to PostgreSQL
- `SQLITE_DB_NAME` - Optional SQLite file name (defaults to `db.sqlite3`)
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_HOST` - Database host
- `POSTGRES_PORT` - Database port
- `DJANGO_SECRET_KEY` - Django secret key
- `DJANGO_DEBUG` - Debug mode (1 or 0)
- `DJANGO_ALLOWED_HOSTS` - Comma-separated allowed hosts
- `ACCESS_TOKEN_LIFETIME_MINUTES` - JWT access token lifetime
- `REFRESH_TOKEN_LIFETIME_DAYS` - JWT refresh token lifetime

### Frontend (.env)
- `VITE_API_URL` - Backend API base URL

## 🚧 Development

### Running in Development Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

The production build will be in the `frontend/dist/` directory.

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error:**
- If you're using the default SQLite setup:
  - Ensure the backend process has permission to read/write `backend/db.sqlite3`
  - Delete the file and rerun migrations if it becomes corrupted
- If you're using PostgreSQL (`USE_SQLITE=0`):
  - Ensure PostgreSQL is running
  - Check `.env` file has correct database credentials
  - Verify database exists: `psql -l | grep career_db`

**Migration Errors:**
- Run `python manage.py makemigrations`
- Then `python manage.py migrate`

**CORS Errors:**
- Verify `CORS_ALLOWED_ORIGINS` in `settings.py` includes your frontend URL
- Check `django-cors-headers` is installed and in `MIDDLEWARE`

### Frontend Issues

**API Connection Failed:**
- Verify backend is running on `http://localhost:8000`
- Check `VITE_API_URL` in `.env` file
- Ensure CORS is properly configured in backend

**Build Errors:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of a college project. All rights reserved.

## 👥 Authors

- Nihal - Initial work

## 🙏 Acknowledgments

- Django and Django REST Framework communities
- React and Vite teams
- Tailwind CSS for the amazing utility-first CSS framework

---

**Note:** This is a subjective assessment system. There are no "correct" answers - the goal is to understand student preferences, thinking patterns, and interests to provide personalized career guidance.

## 📞 Support

For issues or questions, please open an issue on the repository or contact the development team.

---

**Built with ❤️ for better career guidance**

