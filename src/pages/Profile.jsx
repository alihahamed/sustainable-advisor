import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { User, Mail, LogOut, Settings, Heart, Star, Trophy, BookOpenCheck, Zap } from 'lucide-react';
import { fetchUserChallenges, getUserStats } from '../services/challengesService.js';
import BottomNav from '../components/bottomNav.jsx';
import {Flower, Earth,Bug,Tractor, Sprout} from 'lucide-react'

function Profile() {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  // Settings modal and profile customization
  const [showSettings, setShowSettings] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('flower');

  // Avatar options using DaisyUI container
  const avatarOptions = [
    { id: 'tractor', component: <Tractor color='yellow' />, name: 'Eco Farmer' },
    { id: 'sprout', component: <Sprout color='green' />, name: 'Green Thumb' },
    { id: 'earth', component: <Earth color='blue'/>, name: 'Earth Guardian' },
    { id: 'bug', component: <Bug color='red' />, name: 'Buzzing Beecare' },
    { id: 'flower', component: <Flower color='pink' />, name: 'Blooming Eco' }
  ];

  // Get the selected avatar component
  const getSelectedAvatarComponent = () => {
    const avatar = avatarOptions.find(avatar => avatar.id === selectedAvatar);
    return avatar ? avatar.component : <Flower color='pink' />;
  };

  // Eco Rank levels with scoring thresholds
  const rankLevels = [
    { name: 'Beginner', min: 0, icon: '🌱', color: 'text-gray-600', level: 1 },
    { name: 'Eco Explorer', min: 50, icon: '🧭', color: 'text-blue-600', level: 2 },
    { name: 'Green Warrior', min: 150, icon: '⚔️', color: 'text-green-600', level: 3 },
    { name: 'Sustain Champ', min: 300, icon: '🏆', color: 'text-yellow-600', level: 4 },
    { name: 'Eco Master', min: 500, icon: '🌟', color: 'text-purple-600', level: 5 }
  ];

  /**
   * Calculate eco rank based on user stats
   */
  const calculateEcoRank = (stats) => {
    if (!stats) return rankLevels[0];

    // Comprehensive scoring algorithm
    const score =
      (stats.total_scans || 0) * 1 +          // 1 point per scan
      (stats.total_favourites || 0) * 1.5 +   // 1.5 points per favourite
      (stats.average_eco_score || 0) * 0.5 + // 0.5 points per eco-score point
      (stats.total_contributions || 0) * 3 +  // 3 points per contribution
      (stats.total_challenge_points || 0);    // All challenge points

    // Find appropriate rank level
    for (let i = rankLevels.length - 1; i >= 0; i--) {
      if (score >= rankLevels[i].min) {
        return rankLevels[i];
      }
    }

    return rankLevels[0];
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSaveSettings = () => {
    const settings = {
      name: customName.trim() || '',
      avatar: selectedAvatar
    };
    localStorage.setItem('userProfileSettings', JSON.stringify(settings));
    setShowSettings(false);
  };

  // Load profile settings from localStorage
  useEffect(() => {
    const loadedSettings = localStorage.getItem('userProfileSettings');
    if (loadedSettings) {
      try {
        const parsed = JSON.parse(loadedSettings);
        setCustomName(parsed.name || '');
        setSelectedAvatar(parsed.avatar || 'flower');
      } catch (error) {
        console.error('Error loading profile settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Load challenges
        const challengeResult = await fetchUserChallenges(user.id);
        if (challengeResult.success) {
          setChallenges(challengeResult.data.slice(0, 3)); // Show only 3 challenges
        } else {
          console.error('Failed to load challenges:', challengeResult.error);
        }

        // Load user stats for dynamic rank calculation
        const statsResult = await getUserStats(user.id);
        if (statsResult.success) {
          setUserStats(statsResult.data);
        } else {
          console.error('Failed to load user stats:', statsResult.error);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoadingChallenges(false);
      }
    };

    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  // Calculate current rank based on stats
  const currentRank = calculateEcoRank(userStats);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-purple-500 p-2 sm:p-4 flex flex-col pb-32"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="bg-blue-500 border-2 sm:border-4 border-black p-2 sm:p-4 mb-4 sm:mb-6 -rotate-1"
        style={{ boxShadow: '4px 4px 0px #000' }}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-2xl sm:text-3xl"><User size={32} className='sm:w-10 sm:h-10' /></span>
          Profile
        </h1>
        <p className="text-center text-xs sm:text-sm font-black uppercase tracking-wide">Your Eco Account</p>
      </motion.div>

      <motion.div
        className=" bg-white border-2 sm:border-4 border-black flex-1 flex flex-col"
        style={{ boxShadow: '8px 6px 0px #000' }}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.2 }}
      >

        {/* Profile Info */}
        <motion.div
          className="p-3 sm:p-6 bg-green-400 border-b-2 sm:border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-4">
            {/* Custom Avatar using DaisyUI */}
            <div className="avatar">
              <div className="ring-primary ring-offset-base-100 w-16 sm:w-24 rounded-full ring-2 sm:ring-3 ring-offset-2">
                <div
                  className="text-2xl sm:text-4xl bg-black w-full h-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  // style={{ background: 'linear-gradient(135deg, #10b981, #22c55e)', borderRadius: '9999px' }}
                  onClick={() => setShowSettings(true)}
                >

                  {getSelectedAvatarComponent()}
                </div>
              </div>
            </div>

            <motion.h2
              className="text-xl sm:text-2xl font-black uppercase bg-white border-2 border-black inline-block px-3 sm:px-4 py-1 sm:py-2 -rotate-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              {customName || user?.email?.split('@')[0] || 'Eco Warrior'}
            </motion.h2>
          </div>
        </motion.div>

        {/* User Details */}
        <motion.div
          className="p-3 sm:p-6 bg-yellow-300 border-b-2 sm:border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.div
            className="space-y-3 sm:space-y-4"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="bg-white border-2 sm:border-4 border-black p-3 sm:p-4"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail size={20} className="sm:w-6 sm:h-6" />
                <div>
                  <p className="text-xs font-black uppercase">Email</p>
                  <p className="font-bold text-sm sm:text-base">{user?.email}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white border-2 sm:border-4 border-black p-3 sm:p-4"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">{currentRank.icon}</span>
                <div>
                  <p className="text-xs font-black uppercase">Eco Rank</p>
                  <p className={`font-bold text-sm sm:text-base ${currentRank.color}`}>{currentRank.icon} {currentRank.name} (Level {currentRank.level})</p>
                </div>
              </div>
            </motion.div>

            {/* <motion.div
              className="bg-white border-4 border-black p-4"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <Heart size={24} />
                <div>
                  <p className="text-xs font-black uppercase">Products Favourited</p>
                  <p className="font-bold">{userStats?.total_favourites || 0} Product{userStats?.total_favourites === 1 ? '' : 's'}</p>
                </div>
              </div>
            </motion.div> */}
          </motion.div>
        </motion.div>

        {/* Challenges */}
        <motion.div
          className="p-3 sm:p-6 bg-cyan-400 border-b-2 sm:border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <motion.div
            className="mb-3 sm:mb-4"
            variants={itemVariants}
          >
            <h3 className="text-xl sm:text-2xl font-black uppercase bg-white w-full border-2 sm:border-4 border-black inline-block px-2 sm:px-3 py-1 sm:py-2 -rotate-1">
              <Trophy size={28} className="sm:w-8 sm:h-8 mr-2 inline-block" />
              Challenges
              {/* Points Indicator */}
              <motion.span
                className="ml-2 sm:ml-3 bg-red-600 rotate-2 px-1 sm:px-2 py-0.5 sm:py-1 border border-black text-xs text-white rotate-1  font-black uppercase leading-tight inline-block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              >
                ★ {challenges.reduce((sum, c) => sum + (c.completed ? c.reward_points : 0), 0)} Points
              </motion.span>
            </h3>
          </motion.div>

          {loadingChallenges ? (
            <motion.div
              className="text-center py-6 sm:py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-3xl sm:text-4xl animate-bounce mb-4"><Zap color='yellow' size={40} className='inline-block' /></div>
              <p className="font-black uppercase text-xs sm:text-sm">Loading Challenges...</p>
            </motion.div>
          ) : challenges.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {challenges.slice(0, 3).map((challenge, index) => (
                <motion.div
                  key={challenge.challenge_id || index}
                  className={`border-2 sm:border-4 border-black p-3 sm:p-4 ${
                    challenge.completed
                      ? 'bg-gradient-to-br from-green-200 to-green-300 relative shadow-[4px_4px_0px_#000]'
                      : 'bg-white shadow-[4px_4px_0px_#000]'
                  }`}
                  whileHover={{ scale: 1.02, x: 2 }}
                >
                  {challenge.completed && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 to-green-500/30 rounded-lg pointer-events-none flex items-center justify-center">
                      <motion.div
                        className="text-xl sm:text-2xl font-black uppercase bg-green-500 text-white border-2 border-black px-2 sm:px-3 py-1 rotate-6 shadow-lg"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 2 }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.1 + 0.3,
                          type: "spring",
                          stiffness: 200
                        }}
                      >
                        🎉 COMPLETED 🎉
                      </motion.div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
                    <span className="text-xl sm:text-2xl">{challenge.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-black text-xs sm:text-sm uppercase">{challenge.title}</h4>
                      <p className="text-xs text-gray-600 leading-tight font-bold">{challenge.description}</p>
                    </div>
                    {challenge.completed && (
                      <motion.div
                        className="text-2xl sm:text-3xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.1 + 0.1,
                          type: "spring",
                          stiffness: 150
                        }}
                      >
                        🌟
                      </motion.div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 border-2 border-black h-3 sm:h-4 relative overflow-hidden">
                    <motion.div
                      className={`h-full ${challenge.completed ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-blue-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${challenge.progress_percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.2 }}
                    />
                    {challenge.progress_percentage >= 100 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="text-xs font-black text-white text-shadow-black"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          ✓ DONE
                        </motion.div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-black text-xs">
                      {challenge.completed
                        ? `Completed!`
                        : `${challenge.progress}/${challenge.requirement_value}`
                      }
                    </span>
                    {challenge.completed && (
                      <motion.span
                        className="font-black text-xs sm:text-sm bg-yellow-300 border-2 border-black px-2 py-1"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 2 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.1 + 0.2,
                          type: "spring"
                        }}
                      >
                        +{challenge.reward_points} Points
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-6 sm:py-8 bg-white border-2 sm:border-4 border-black"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
            >
              <Trophy size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-black uppercase text-xs sm:text-sm">Challenges Coming Soon</p>
              <p className="text-xs text-gray-500 mt-1">Complete actions to unlock rewards!</p>
            </motion.div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          className="p-3 sm:p-6 bg-orange-400 border-b-2 sm:border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.div
            className="space-y-3 sm:space-y-4"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="visible"
          >
            <motion.button
              className="w-full bg-black text-white border-2 sm:border-4 border-black py-2 sm:py-3 px-4 sm:px-6 font-black uppercase text-sm sm:text-lg transition-transform hover:-translate-y-1"
              style={{ boxShadow: '4px 4px 0px #000' }}
              onClick={() => navigate('/favourites')}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className="inline-block mr-2 mb-1 sm:w-5 sm:h-5" size={18} />
              View Favourites
            </motion.button>

            <motion.button
              className="w-full bg-gray-600 text-white border-2 sm:border-4 border-black py-2 sm:py-3 px-4 sm:px-6 font-black uppercase text-sm sm:text-lg transition-transform hover:-translate-y-1"
              style={{ boxShadow: '4px 4px 0px #000' }}
              onClick={() => setShowSettings(true)}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings className="inline-block mr-2 mb-1 sm:w-5 sm:h-5" size={18} />
              Settings
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          className="p-3 sm:p-6 bg-red-500"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <motion.button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full bg-black text-white border-2 sm:border-4 border-black py-3 sm:py-4 px-4 sm:px-6 font-black uppercase text-sm sm:text-lg transition-transform hover:-translate-y-1 disabled:bg-gray-600 disabled:cursor-not-allowed"
            style={{ boxShadow: '4px 4px 0px #000' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <LogOut className="inline-block mr-2 mb-1 sm:w-5 sm:h-5" size={18} />
            {isSigningOut ? 'SIGNING OUT...' : 'SIGN OUT'}
          </motion.button>
        </motion.div>

      </motion.div>

      <BottomNav />

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            className="bg-white border-2 sm:border-4 border-black p-4 sm:p-6 w-full max-w-sm mx-4"
            style={{ boxShadow: '8px 8px 0px #000' }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl sm:text-2xl font-black uppercase mb-4 sm:mb-6 text-center bg-green-400 border-2 border-black inline-block px-2 sm:px-3 py-1 -rotate-1">
              Profile Settings
            </h3>

            {/* Name Input */}
            <div className="mb-4 sm:mb-6">
              <label className=" font-black uppercase mb-2 bg-black text-white inline-block px-2 sm:px-3 py-1 -rotate-1 text-sm sm:text-base">
                Display Name
              </label>
              <input
                type="text"
                className="w-full p-3 sm:p-4 border-2 sm:border-4 border-black bg-white font-bold text-base sm:text-lg"
                style={{ boxShadow: '4px 4px 0px #000' }}
                placeholder={user?.email?.split('@')[0] || 'Eco Warrior'}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* Avatar Selection */}
            <div className="mb-4 sm:mb-6">
              <label className="block font-black uppercase mb-3 bg-black text-white inline-block px-2 sm:px-3 py-1 rotate-1 text-sm sm:text-base">
                Choose Avatar
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {avatarOptions.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`avatar cursor-pointer transition-transform hover:scale-110`}
                    onClick={() => setSelectedAvatar(avatar.id)}
                  >
                    <div className="ring-primary ring-offset-base-100 w-12 sm:w-16 rounded-full ring-2 sm:ring-3 ring-offset-2">
                      <div
                        className="text-xl sm:text-2xl w-full h-full flex items-center justify-center"
                        style={{
                          background: selectedAvatar === avatar.id
                            ? 'black'
                            : 'white',
                          borderRadius: '9999px'
                        }}
                      >
                        {avatar.component}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-gray-500 text-white py-2 sm:py-3 px-3 sm:px-4 border-2 sm:border-4 border-black font-black uppercase text-xs sm:text-sm transition-transform hover:-translate-y-1"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 bg-green-500 text-white py-2 sm:py-3 px-3 sm:px-4 border-2 sm:border-4 border-black font-black uppercase text-xs sm:text-sm transition-transform hover:-translate-y-1"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Profile;
