import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseAPI } from '../../api/courses';
import { getCourseProgressAPI } from '../../api/progress';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, BookOpen, CheckCircle2,
  Circle, Lock, ChevronRight, Star
} from 'lucide-react';

const difficultyStars = (level) => {
  return [...Array(5)].map((_, i) => (
    <Star
      key={i}
      size={12}
      className={i < level ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
    />
  ));
};

const CourseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [slug]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await getCourseAPI(slug);
      setCourse(res.data.course);
      setTopics(res.data.topics);

      // Fetch progress for this course
      const progressRes = await getCourseProgressAPI(res.data.course._id);
      setProgress(progressRes.data.progress);
    } catch (err) {
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const getTopicStatus = (topicId) => {
    const p = progress.find((p) => p.topic === topicId || p.topic?._id === topicId);
    return p?.status || 'not_started';
  };

  const getTopicScore = (topicId) => {
    const p = progress.find((p) => p.topic === topicId || p.topic?._id === topicId);
    return p?.bestScore || 0;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/2 mb-4" />
        <div className="h-4 bg-gray-800 rounded w-full mb-2" />
        <div className="h-4 bg-gray-800 rounded w-3/4" />
      </div>
    );
  }
  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const progressPercent = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  

  if (!course) return <div className="text-white">Course not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/courses')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Back to Courses
      </button>

      {/* Course header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
        <p className="text-gray-400 text-sm mb-4">{course.description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-5">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <BookOpen size={12} />
            {topics.length} topics
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            {course.estimatedHours}h estimated
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${course.difficulty === 'beginner' ? 'bg-green-400/10 text-green-400' :
              course.difficulty === 'intermediate' ? 'bg-yellow-400/10 text-yellow-400' :
              'bg-red-400/10 text-red-400'}`}>
            {course.difficulty}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{completedCount} / {topics.length} completed</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topics list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Topics</h2>
        </div>

        <div className="divide-y divide-gray-800">
          {topics.map((topic, index) => {
            const status = getTopicStatus(topic._id);
            const score = getTopicScore(topic._id);
            const isCompleted = status === 'completed';
            const isInProgress = status === 'in_progress';

            return (
              <div
                key={topic._id}
                onClick={() => navigate(`/dashboard/courses/${slug}/topics/${topic.slug}`)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 cursor-pointer transition group"
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-green-400" />
                  ) : isInProgress ? (
                    <Circle size={20} className="text-indigo-400" />
                  ) : (
                    <Circle size={20} className="text-gray-600" />
                  )}
                </div>

                {/* Topic info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">{index + 1}.</span>
                    <p className={`text-sm font-medium ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                      {topic.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {difficultyStars(topic.difficulty)}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      {topic.estimatedMinutes} min
                    </span>
                    <span className="text-xs text-amber-400">+{topic.xpReward} XP</span>
                    {isCompleted && score > 0 && (
                      <span className="text-xs text-green-400">Score: {score}%</span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="hidden md:flex gap-1">
                  {topic.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <ChevronRight size={16} className="text-gray-600 group-hover:text-indigo-400 transition shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;