import { useState, useEffect } from 'react';
import { getProfileAPI, updateProfileAPI } from '../../api/users';
import { getStreakAPI, checkInAPI, getLeaderboardAPI } from '../../api/streak';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  User, Flame, Trophy, Target, Code2,
  Building2, RefreshCw, CheckCircle2, Star,
  Calendar, Crown, Edit2, Save
} from 'lucide-react';

// ── Streak Calendar ───────────────────────────────────────────
const StreakCalendar = ({ checkInHistory }) => {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toDateString();
  });

  const checkedInDates = new Set(
    checkInHistory?.map((d) => new Date(d).toDateString()) || []
  );

  return (
    <div className="flex gap-1 flex-wrap">
      {last30Days.map((dateStr, i) => (
        <div
          key={i}
          title={dateStr}
          className={`w-7 h-7 rounded-md transition-all ${
            checkedInDates.has(dateStr)
              ? 'bg-orange-500'
              : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
};

// ── Leaderboard Card ──────────────────────────────────────────
const LeaderboardCard = ({ entry, rank }) => {
  const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-sm w-8 text-center">{rankIcon}</span>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
          {entry.user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{entry.user?.name}</p>
          <p className="text-gray-500 text-xs">Level {entry.user?.level}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-orange-400">
        <Flame size={14} />
        <span className="text-sm font-semibold">{entry.currentStreak} days</span>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Streak state
  const [streak, setStreak] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [streakLoading, setStreakLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'profile') fetchProfile();
    if (activeTab === 'streak') fetchStreak();
  }, [activeTab]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await getProfileAPI();
      setProfile(res.data.user);
      setForm({
        name: res.data.user.name,
        preferredLanguage: res.data.user.preferredLanguage,
        targetCompanies: res.data.user.targetCompanies?.join(', '),
        targetRoles: res.data.user.targetRoles?.join(', '),
        goals: res.data.user.goals?.join(', '),
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchStreak = async () => {
    setStreakLoading(true);
    try {
      const [streakRes, leaderboardRes] = await Promise.all([
        getStreakAPI(),
        getLeaderboardAPI(),
      ]);
      setStreak(streakRes.data.streak);
      setLeaderboard(leaderboardRes.data.leaderboard);
    } catch (err) {
      toast.error('Failed to load streak data');
    } finally {
      setStreakLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        name: form.name,
        preferredLanguage: form.preferredLanguage,
        targetCompanies: form.targetCompanies?.split(',').map((s) => s.trim()).filter(Boolean),
        targetRoles: form.targetRoles?.split(',').map((s) => s.trim()).filter(Boolean),
        goals: form.goals?.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await updateProfileAPI(updates);
      setProfile(res.data.user);
      setUser({ ...user, name: res.data.user.name });
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await checkInAPI();
      setStreak(res.data.streak);
      setUser({ ...user, xp: user.xp + res.data.xpEarned });
      toast.success(`🔥 Checked in! +${res.data.xpEarned} XP`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'streak', label: 'Streak', icon: Flame },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 mt-1">Manage your profile and track your consistency</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        profileLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-24 bg-gray-800 rounded-2xl" />
            <div className="h-48 bg-gray-800 rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Avatar + stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
                  <p className="text-gray-400 text-sm">{profile?.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                      Level {profile?.level}
                    </span>
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <Star size={11} fill="currentColor" />
                      {profile?.xp} XP
                    </span>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                      {profile?.skillLevel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="ml-auto text-gray-400 hover:text-white transition"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            {/* Editable fields */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Your Details</h3>
              <div className="flex flex-col gap-4">

                {/* Name */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                  {editing ? (
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  ) : (
                    <p className="text-white text-sm">{profile?.name}</p>
                  )}
                </div>

                {/* Preferred language */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                    <Code2 size={11} /> Preferred Language
                  </label>
                  {editing ? (
                    <select
                      value={form.preferredLanguage}
                      onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    >
                      {['JavaScript', 'Python', 'Java', 'C++', 'Go'].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white text-sm">{profile?.preferredLanguage}</p>
                  )}
                </div>

                {/* Target companies */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                    <Building2 size={11} /> Target Companies
                  </label>
                  {editing ? (
                    <input
                      value={form.targetCompanies}
                      onChange={(e) => setForm({ ...form, targetCompanies: e.target.value })}
                      placeholder="Google, Amazon, Microsoft"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {profile?.targetCompanies?.length > 0
                        ? profile.targetCompanies.map((c) => (
                          <span key={c} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">{c}</span>
                        ))
                        : <p className="text-gray-500 text-sm">None set</p>
                      }
                    </div>
                  )}
                </div>

                {/* Target roles */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                    <Target size={11} /> Target Roles
                  </label>
                  {editing ? (
                    <input
                      value={form.targetRoles}
                      onChange={(e) => setForm({ ...form, targetRoles: e.target.value })}
                      placeholder="SDE-2, Frontend Engineer"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {profile?.targetRoles?.length > 0
                        ? profile.targetRoles.map((r) => (
                          <span key={r} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">{r}</span>
                        ))
                        : <p className="text-gray-500 text-sm">None set</p>
                      }
                    </div>
                  )}
                </div>

                {/* Goals */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Goals</label>
                  {editing ? (
                    <input
                      value={form.goals}
                      onChange={(e) => setForm({ ...form, goals: e.target.value })}
                      placeholder="crack DSA, system design"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {profile?.goals?.length > 0
                        ? profile.goals.map((g) => (
                          <span key={g} className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">{g}</span>
                        ))
                        : <p className="text-gray-500 text-sm">None set</p>
                      }
                    </div>
                  )}
                </div>

                {/* Save button */}
                {editing && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-50 w-fit"
                  >
                    {saving
                      ? <><RefreshCw size={13} className="animate-spin" /> Saving...</>
                      : <><Save size={13} /> Save Changes</>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* ── STREAK TAB ── */}
      {activeTab === 'streak' && (
        streakLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-32 bg-gray-800 rounded-2xl" />
            <div className="h-48 bg-gray-800 rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Streak stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Flame size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{streak?.currentStreak || 0}</p>
                    <p className="text-sm text-gray-400">day streak</p>
                  </div>
                </div>
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {checkingIn
                    ? <><RefreshCw size={13} className="animate-spin" /> Checking in...</>
                    : <><CheckCircle2 size={14} /> Check In Today</>
                  }
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{streak?.longestStreak || 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Longest streak</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{streak?.totalDaysActive || 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total days active</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-400">{user?.xp || 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total XP</p>
                </div>
              </div>

              {/* Calendar */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-gray-400" />
                  <p className="text-sm text-gray-400">Last 30 days</p>
                </div>
                <StreakCalendar checkInHistory={streak?.checkInHistory} />
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-sm" />
                  <span className="text-xs text-gray-400">Active day</span>
                  <div className="w-4 h-4 bg-gray-700 rounded-sm ml-2" />
                  <span className="text-xs text-gray-400">Inactive</span>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={16} className="text-amber-400" />
                <h3 className="text-white font-semibold">Streak Leaderboard</h3>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet. Start your streak!</p>
              ) : (
                leaderboard.map((entry, i) => (
                  <LeaderboardCard key={entry._id} entry={entry} rank={i + 1} />
                ))
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ProfilePage;