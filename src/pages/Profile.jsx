import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { User, Mail, LogOut, Settings, Heart, Star } from 'lucide-react';
import BottomNav from '../components/bottomNav.jsx';

function Profile() {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

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
      className="min-h-screen bg-purple-500 p-4 flex flex-col pb-32"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="bg-blue-500 border-4 border-black p-4 mb-6 -rotate-1"
        style={{ boxShadow: '8px 8px 0px #000' }}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-4xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-4xl"><User size={48} /></span>
          Profile
        </h1>
        <p className="text-center text-sm font-black uppercase tracking-wide">Your Eco Account</p>
      </motion.div>

      <motion.div
        className="max-w-md mx-auto bg-white border-4 border-black rotate-1 flex-1 flex flex-col"
        style={{ boxShadow: '16px 12px 0px #000' }}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.2 }}
      >

        {/* Profile Info */}
        <motion.div
          className="p-6 bg-green-400 border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="text-center">
            <motion.div
              className="w-24 h-24 bg-black rounded-full mx-auto mb-4 border-4 border-black flex items-center justify-center"
              style={{ boxShadow: '4px 4px 0px #000' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
            >
              <User size={40} className="text-white" />
            </motion.div>

            <motion.h2
              className="text-2xl font-black uppercase bg-white border-2 border-black inline-block px-4 py-2 -rotate-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              {user?.email?.split('@')[0] || 'Eco Warrior'}
            </motion.h2>
          </div>
        </motion.div>

        {/* User Details */}
        <motion.div
          className="p-6 bg-yellow-300 border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.div
            className="space-y-4"
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
              className="bg-white border-4 border-black p-4"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <Mail size={24} />
                <div>
                  <p className="text-xs font-black uppercase">Email</p>
                  <p className="font-bold">{user?.email}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white border-4 border-black p-4"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <Star size={24} />
                <div>
                  <p className="text-xs font-black uppercase">Eco Rank</p>
                  <p className="font-bold">🌱 Eco Champion (Level 1)</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white border-4 border-black p-4"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <Heart size={24} />
                <div>
                  <p className="text-xs font-black uppercase">Products Favourited</p>
                  <p className="font-bold">Check Your Favourites Page</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="p-6 bg-orange-400 border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.div
            className="space-y-4"
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
              className="w-full bg-black text-white border-4 border-black py-3 px-6 font-black uppercase text-lg transition-transform hover:-translate-y-1"
              style={{ boxShadow: '4px 4px 0px #000' }}
              onClick={() => navigate('/favourites')}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className="inline-block mr-2 mb-1" size={20} />
              View Favourites
            </motion.button>

            <motion.button
              className="w-full bg-gray-600 text-white border-4 border-black py-3 px-6 font-black uppercase text-lg transition-transform hover:-translate-y-1"
              style={{ boxShadow: '4px 4px 0px #000' }}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings className="inline-block mr-2 mb-1" size={20} />
              Settings (Coming Soon)
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          className="p-6 bg-red-500"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <motion.button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full bg-black text-white border-4 border-black py-4 px-6 font-black uppercase text-lg transition-transform hover:-translate-y-1 disabled:bg-gray-600 disabled:cursor-not-allowed"
            style={{ boxShadow: '4px 4px 0px #000' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <LogOut className="inline-block mr-2 mb-1" size={20} />
            {isSigningOut ? 'SIGNING OUT...' : 'SIGN OUT'}
          </motion.button>
        </motion.div>

      </motion.div>

      <BottomNav />
    </motion.div>
  );
}

export default Profile;
