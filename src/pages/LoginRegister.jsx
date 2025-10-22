import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabaseClient.js';
import { UserPlus, LogIn, Mail, Lock, Eye, EyeOff, PartyPopper,KeyRound, Sprout, Leaf, User } from 'lucide-react';
import Toast from '../components/Toast.jsx';
import BottomNav from '../components/bottomNav.jsx';

function LoginRegister() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'EMAIL IS REQUIRED';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'INVALID EMAIL FORMAT';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'PASSWORD IS REQUIRED';
    } else if (formData.password.length < 6) {
      newErrors.password = 'PASSWORD MUST BE AT LEAST 6 CHARACTERS';
    }

    // Confirm password validation for register
    if (activeTab === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'CONFIRM PASSWORD IS REQUIRED';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'PASSWORDS DO NOT MATCH';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ submit: 'INVALID EMAIL OR PASSWORD' });
        } else {
          setErrors({ submit: error.message.toUpperCase() });
        }
        return;
      }

      setToast({
        show: true,
        message: 'WELCOME BACK! 🌿',
        type: 'success'
      });

      // Redirect to the intended page or home after a brief delay
      setTimeout(() => {
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin'); // Clean up
        navigate(redirectTo);
      }, 1000);

    } catch {
      setErrors({ submit: 'LOGIN FAILED. PLEASE TRY AGAIN.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ submit: 'ACCOUNT ALREADY EXISTS' });
        } else {
          setErrors({ submit: error.message.toUpperCase() });
        }
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        setToast({
          show: true,
          message: 'CHECK YOUR EMAIL FOR CONFIRMATION! 📧',
          type: 'success'
        });
      } else {
        setToast({
          show: true,
          message: 'ACCOUNT CREATED SUCCESSFULLY! 🌱',
          type: 'success'
        });

        // Switch to login tab
        setActiveTab('login');
        setFormData({...formData, confirmPassword: ''}); // Clear confirm password
      }

    } catch (error) {
      setErrors({ submit: 'REGISTRATION FAILED. PLEASE TRY AGAIN.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, show: false });
  };

  // Animation variants for smooth entrances
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

  return (
    <motion.div
      className="min-h-screen bg-red-700 p-4 flex flex-col pb-4 md:pb-32"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="bg-green-500 border-4 border-black p-4 mb-6 -rotate-1" style={{ boxShadow: '8px 8px 0px #000' }}>
        <h1 className="text-3xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-3xl"><Leaf className='inline-block' size={38}/></span>
          Eco-Dex
        </h1>
        <p className="text-center text-sm font-black uppercase tracking-wide">Sustainable Authentication</p>
      </motion.div>

      <motion.div className="max-w-md mx-auto bg-white border-4 border-black rotate-1 flex-1 flex flex-col" style={{
        boxShadow: window.innerWidth < 768 ? '8px 8px 0px #000' : '16px 16px 0px #000'
      }}>

        {/* Navigation - Back Button */}
        {/* <div className="p-6 bg-yellow-300 border-b-4 border-black">
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 md:px-8 py-4 border-4 border-black font-black uppercase text-base md:text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
            style={{ boxShadow: '6px 6px 0px #000' }}
          >
            ← Back to Scanner
          </button>
        </div> */}

        {/* Main Auth Container */}
        <div className="flex-1 overflow-y-auto p-6 pb-6 md:pb-32">

          {/* Guest Access */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          >
            <button
              onClick={() => navigate('/')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-black border-4 border-black py-3 px-6 font-black uppercase text-lg transition-transform hover:translate-y-1 shadow-none"
              style={{ boxShadow: '0px 0px 0px #000', transform: 'rotate(-1deg)' }}
            >
              <User className='inline-block' size={28} /> Continue as Guest →
            </button>
          </motion.div>

          {/* Tab Toggle */}
          <motion.div className="flex mb-8 bg-gray-100 border-4 border-black" style={{ boxShadow: '4px 4px 0px #000' }}>
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 p-4 font-black uppercase text-sm transition-all ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
              style={activeTab === 'login' ? { boxShadow: 'inset 4px 4px 0px #000' } : {}}
            >
              <LogIn size={20} className="inline-block mr-2 mb-1" />
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 p-4 font-black uppercase text-sm transition-all ${
                activeTab === 'register'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
              style={activeTab === 'register' ? { boxShadow: 'inset 4px 4px 0px #000' } : {}}
            >
            <UserPlus size={20} className="inline-block mr-2 mb-1" />
              Register
            </button>
          </motion.div>

          {/* Auth Forms */}
          <div className="space-y-6">
            {/* Login Form */}
            <motion.div
              className={`transition-all duration-300 ${activeTab === 'login' ? 'opacity-100 block' : 'opacity-0 hidden'}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: activeTab === 'login' ? 1 : 0, y: activeTab === 'login' ? 0 : 15 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
            >
              <div className="bg-blue-400 border-4 border-black p-6 -rotate-1 mb-6" style={{ boxShadow: '8px 8px 0px #000' }}>
                <h2 className="text-2xl font-black uppercase mb-6 bg-white border-2 border-black inline-block px-4 py-2 rotate-1">
                  Welcome Back! <PartyPopper className='inline-block' size={28} color='blue' />
                </h2>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block font-black text-sm uppercase mb-2 bg-black text-white p-2 -rotate-1 border-2 border-black flex items-center justify-center gap-2">
                      <Mail size={16} />
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-4 border-4 border-black bg-white font-black text-sm"
                      style={{ boxShadow: '4px 4px 0px #000' }}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-2 bg-red-500 text-white px-3 py-2 font-black text-xs uppercase border-2 border-black">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-black text-sm uppercase mb-2 bg-black text-white p-2 rotate-1 border-2 border-black flex items-center justify-center gap-2">
                      <Lock size={16} />
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full p-4 border-4 border-black bg-white font-black text-sm pr-12"
                        style={{ boxShadow: '4px 4px 0px #000' }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 bg-red-500 text-white px-3 py-2 font-black text-xs uppercase border-2 border-black">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="bg-red-500 border-4 border-black p-4 -rotate-1" style={{ boxShadow: '4px 4px 0px #000' }}>
                      <p className="text-white font-black text-sm uppercase">
                        ❌ {errors.submit}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 border-4 border-black font-black uppercase text-lg transition-transform hover:-translate-y-1"
                    style={{ boxShadow: '6px 6px 0px #000' }}
                  >
                    {loading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Register Form */}
            <motion.div
              className={`transition-all duration-300 ${activeTab === 'register' ? 'opacity-100 block' : 'opacity-0 hidden'}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: activeTab === 'register' ? 1 : 0, y: activeTab === 'register' ? 0 : 15 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
            >
              <div className="bg-green-400 border-4 border-black p-6 -rotate-1 mb-6" style={{ boxShadow: '8px 8px 0px #000' }}>
                <h2 className="text-2xl font-black uppercase mb-6 bg-white border-2 border-black inline-block px-4 py-2 rotate-1">
                  Join EcoDex! <Sprout className='inline-block' size='29'/>
                </h2>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block font-black text-sm uppercase mb-2 bg-black text-white p-2 -rotate-1 border-2 border-black flex items-center justify-center gap-2">
                      <Mail size={16} />
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-4 border-4 border-black bg-white font-black text-sm uppercase"
                      style={{ boxShadow: '4px 4px 0px #000' }}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-2 bg-red-500 text-white px-3 py-2 font-black text-xs uppercase border-2 border-black">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-black text-sm uppercase mb-2 bg-black text-white p-2 rotate-1 border-2 border-black flex items-center justify-center gap-2">
                      <Lock size={16} />
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full p-4 border-4 border-black bg-white font-black text-sm uppercase pr-12"
                        style={{ boxShadow: '4px 4px 0px #000' }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 bg-red-500 text-white px-3 py-2 font-black text-xs uppercase border-2 border-black">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-black text-sm uppercase mb-2 bg-black text-white p-2 -rotate-2 border-2 border-black flex items-center justify-center gap-2">
                      <Lock size={16} />
                      CONFIRM PASSWORD
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full p-4 border-4 border-black bg-white font-black text-sm uppercase"
                      style={{ boxShadow: '4px 4px 0px #000' }}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 bg-red-500 text-white px-3 py-2 font-black text-xs uppercase border-2 border-black">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="bg-red-500 border-4 border-black p-4 -rotate-1" style={{ boxShadow: '4px 4px 0px #000' }}>
                      <p className="text-white font-black text-sm uppercase">
                        ❌ {errors.submit}
                      </p>
                    </div>
                  )}

                  <div className="bg-yellow-300 border-2 border-black p-3 -rotate-1">
                    <p className="font-black text-xs uppercase text-center">
                      <KeyRound className='inline-block mr-2' size={22} /> By registering, you help build better sustainability data worldwide!
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 border-4 border-black font-black uppercase text-lg transition-transform hover:-translate-y-1"
                    style={{ boxShadow: '6px 6px 0px #000' }}
                  >
                    {loading ? 'CREATING ACCOUNT...' : ' CREATE ACCOUNT'}
                  </button>
                </form>
              </div>
            </motion.div>



          </div>
        </div>

      </motion.div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={handleCloseToast}
      />

      </motion.div>
  );
}

export default LoginRegister;
