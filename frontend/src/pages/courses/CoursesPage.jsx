import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoursesAPI } from '../../api/courses';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Clock, ChevronRight, Code2, Brain, Shield, Server, Smartphone, BarChart3 } from 'lucide-react';

// One config per domain — used for both the domain tabs and the course card
// icon/badge. Every course's `targetDomains` array is matched against these.
const domainConfig = {
  'software-dev': { label: 'Software Dev', icon: Code2, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
  'ai-ml': { label: 'AI/ML', icon: Brain, color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  'data-science': { label: 'Data Science', icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  cybersecurity: { label: 'Cybersecurity', icon: Shield, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  devops: { label: 'DevOps', icon: Server, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  mobile: { label: 'Mobile', icon: Smartphone, color: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400/20' },
};

const DOMAIN_ORDER = ['software-dev', 'ai-ml', 'data-science', 'cybersecurity', 'devops', 'mobile'];

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const myDomain = user?.techDomain || 'software-dev';
  const [selectedDomain, setSelectedDomain] = useState(myDomain);
  const navigate = useNavigate();

  // Own domain first, then the rest in a fixed order
  const orderedDomains = [myDomain, ...DOMAIN_ORDER.filter((d) => d !== myDomain)];

  useEffect(() => {
    fetchCourses();
  }, [selectedDomain]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getCoursesAPI('', selectedDomain);
      setCourses(res.data.courses);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (diff) => {
    if (diff === 'beginner') return 'text-green-400 bg-green-400/10';
    if (diff === 'intermediate') return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <p className="text-gray-400 mt-1">Pick a course and start learning</p>
      </div>

      {/* Domain tabs — own domain first, others browsable */}
      <div className="flex gap-2 flex-wrap mb-8">
        {orderedDomains.map((domain) => {
          const config = domainConfig[domain];
          if (!config) return null;
          const isMine = domain === myDomain;
          const isActive = selectedDomain === domain;
          return (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {config.label}
              {isMine && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-700'}`}>
                  yours
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="w-10 h-10 bg-gray-700 rounded-xl mb-4" />
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-full mb-1" />
              <div className="h-3 bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-gray-500 text-sm">No courses found for this domain yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const config = domainConfig[selectedDomain] || domainConfig['software-dev'];
            const Icon = config.icon;
            const otherDomains = (course.targetDomains || []).filter((d) => d !== selectedDomain && d !== 'all');

            return (
              <div
                key={course._id}
                onClick={() => navigate(`/dashboard/courses/${course.slug}`)}
                className={`bg-gray-900 border ${config.border} rounded-2xl p-6 cursor-pointer hover:border-opacity-60 hover:scale-[1.02] transition-all group`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={20} className={config.color} />
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold text-base mb-1 group-hover:text-indigo-300 transition">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>

                {/* Also relevant to other domains */}
                {otherDomains.length > 0 && (
                  <p className="text-xs text-gray-500 mb-3">
                    Also fits: {otherDomains.map((d) => domainConfig[d]?.label || d).join(', ')}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />
                      {course.estimatedHours}h
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <BookOpen size={11} />
                      {course.totalTopics} topics
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-indigo-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;