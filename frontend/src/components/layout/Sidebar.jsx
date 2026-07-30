import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Code2,
  ClipboardList,
  Mic2,
  Flame,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logoutAPI } from '../../api/auth';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'For You', icon: Sparkles, path: '/dashboard/for-you', isAI: true },
  { label: 'Courses', icon: BookOpen, path: '/dashboard/courses' },
  { label: 'Practice', icon: Code2, path: '/dashboard/practice' },
  { label: 'Assignments', icon: ClipboardList, path: '/dashboard/assignments' },
  { label: 'Mock Interview', icon: Mic2, path: '/dashboard/mock' },
  { label: 'Get My Plan', icon: Sparkles, path: '/dashboard/my-plan', isAI: true },
];

const bottomItems = [
  //{ label: 'Streak', icon: Flame, path: '/dashboard/profile' },
  { label: 'Profile', icon: User, path: '/dashboard/profile' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (e) {}
    logout();
    toast.success('Logged out!');
    navigate('/login');
  };

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-4 shrink-0">
      {/* Logo */}
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-white">PrepAI</h1>
        <p className="text-xs text-gray-500 mt-1">Interview Prep Platform</p>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 mb-6 px-2 py-3 bg-gray-800 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-400">Level {user?.level} · {user?.xp} XP</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, icon: Icon, path, isAI }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {isAI && (
              <span className="ml-auto text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-semibold">
                AI
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 mt-4 border-t border-gray-800 pt-4">
        {bottomItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all mt-1"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;