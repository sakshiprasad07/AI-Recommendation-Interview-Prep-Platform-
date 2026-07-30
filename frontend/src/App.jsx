import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ForYouPage from './pages/dashboard/ForYouPage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import TopicPage from './pages/courses/TopicPage';
import PracticePage from './pages/dashboard/PracticePage';
import AssignmentsPage from './pages/dashboard/AssignmentsPage';
import MockInterviewPage from './pages/dashboard/MockInterviewPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import GetMyPlanPage from './pages/dashboard/GetMyPlanPage';



// Layout
import AppLayout from './components/layout/AppLayout';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
      Loading...
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected app routes — inside sidebar layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="for-you" element={<ForYouPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:slug" element={<CourseDetailPage />} />
        <Route path="courses/:slug/topics/:topicSlug" element={<TopicPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="mock" element={<MockInterviewPage />} />
        <Route path="profile" element={<ProfilePage />} />
        {/* <Route path="streak" element={<ProfilePage />} /> */}
        <Route path="my-plan" element={<GetMyPlanPage />} />
      </Route>
    </Routes>
  );
};

export default App;