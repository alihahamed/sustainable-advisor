import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Earth } from 'lucide-react';

function SplashScreen() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Save that user has seen splash screen
    localStorage.setItem('hasSeenSplash', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center p-6">
      {/* Main Content Card */}
      <div className="max-w-2xl w-full">
        {/* Hero Section */}
        <div className="bg-white border-4 border-black p-8 md:p-12 mb-8" style={{ boxShadow: '16px 16px 0px #000' }}>
          {/* App Icon/Logo */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-24 h-24 bg-yellow-400 border-4 border-black flex items-center justify-center -rotate-3"
              style={{ boxShadow: '8px 8px 0px #000' }}
            >
              <span className="text-5xl">📱</span>
            </div>
          </div>

          {/* Welcome Text */}
          <h1 className="text-5xl md:text-6xl font-black uppercase text-center mb-4 -rotate-1">
            Welcome to
          </h1>
          <div className="bg-cyan-400 border-4 border-black px-6 py-4 rotate-1 mb-6" style={{ boxShadow: '8px 8px 0px #000' }}>
            <h2 className="text-4xl md:text-5xl font-black uppercase text-center">
              Your App
            </h2>
          </div>

          {/* Description */}
          <p className="text-xl font-bold text-center mb-8 leading-relaxed">
            Scan products, discover sustainable alternatives, and make better choices for the planet! 🌍
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-pink-300 border-4 border-black p-4 text-center" style={{ boxShadow: '6px 6px 0px #000' }}>
              <div className="text-4xl mb-2">📸</div>
              <p className="font-black text-sm uppercase">Scan Products</p>
            </div>
            <div className="bg-yellow-300 border-4 border-black p-4 text-center" style={{ boxShadow: '6px 6px 0px #000' }}>
              <div className="text-4xl mb-2">🌟</div>
              <p className="font-black text-sm uppercase">Find Alternatives</p>
            </div>
            <div className="bg-lime-300 border-4 border-black p-4 text-center" style={{ boxShadow: '6px 6px 0px #000' }}>
              <div className="text-4xl mb-2">🌱</div>
              <p className="font-black text-sm uppercase">Go Green</p>
            </div>
          </div>

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            className="w-full bg-orange-400 border-4 border-black px-8 py-5 font-black text-2xl uppercase hover:translate-x-1 hover:translate-y-1 transition-transform active:translate-x-2 active:translate-y-2"
            style={{ boxShadow: '8px 8px 0px #000' }}
          >
            Get Started! →
          </button>
        </div>

        {/* Footer Badge */}
        <div className="flex justify-center">
          <div className="bg-purple-400 border-4 border-black px-6 py-2 -rotate-2" style={{ boxShadow: '6px 6px 0px #000' }}>
            <p className="font-black text-sm uppercase">Made with ❤️ for Earth</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplashScreenAnimated({ onGetStarted }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center p-6">
      <div 
        className={`max-w-2xl w-full transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="bg-white border-4 border-black p-8 md:p-12 mb-8" style={{ boxShadow: '16px 16px 0px #000' }}>
          <div className="flex justify-center mb-6">
            <div 
              className="w-24 h-24 bg-yellow-400 border-4 border-black flex items-center justify-center -rotate-3"
              style={{ 
                boxShadow: '8px 8px 0px #000',
                animation: 'bounce 2s ease-in-out infinite'
              }}
            >
              <span className="text-5xl">📱</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-black uppercase text-center mb-4 -rotate-1">
            Welcome to
          </h1>
          <div className="bg-cyan-500 border-4 border-black px-6 py-4 rotate-1 mb-6" style={{ boxShadow: '8px 8px 0px #000' }}>
            <h2 className="text-4xl md:text-5xl font-black uppercase text-center">
              Eco-Dex
            </h2>
          </div>

          <p className="text-xl font-bold text-center mb-8 leading-relaxed">
            Scan products, discover sustainable alternatives, and make better choices for the planet! 🌍
          </p>

          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '📸', text: 'Scan Products', color: 'bg-pink-300', delay: '0s' },
              { icon: '🌟', text: 'Find Alternatives', color: 'bg-yellow-300', delay: '0.1s' },
              { icon: '🌱', text: 'Go Green', color: 'bg-lime-300', delay: '0.2s' }
            ].map((feature, i) => (
              <div 
                key={i}
                className={`${feature.color} border-4 border-black p-4 text-center`}
                style={{ 
                  boxShadow: '6px 6px 0px #000',
                  animation: `slideUp 0.6s ease-out ${feature.delay} both`
                }}
              >
                <div className="text-4xl mb-2">{feature.icon}</div>
                <p className="font-black text-sm uppercase">{feature.text}</p>
              </div>
            ))}
          </div> */}

          <button
            onClick={onGetStarted}
            className="w-full bg-green-400 border-4 border-black px-8 py-5 font-black text-2xl uppercase hover:translate-x-1 hover:translate-y-1 transition-transform active:translate-x-2 active:translate-y-2"
            style={{ boxShadow: '8px 8px 0px #000' }}
          >
            Get Started! →
          </button>
        </div>

        <div className="flex justify-center">
          <div className="bg-purple-400 border-4 border-black px-6 py-2 -rotate-2" style={{ boxShadow: '6px 6px 0px #000' }}>
            <p className="font-black text-sm uppercase">Made with <Heart className='inline-block' color='red'/> for Earth</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SplashScreenMinimal() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 to-pink-300 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Large Icon */}
        <div 
          className="inline-block bg-cyan-400 border-4 border-black p-8 mb-8 -rotate-3"
          style={{ boxShadow: '12px 12px 0px #000' }}
        >
          <span className="text-8xl">🌍</span>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-black uppercase mb-4 rotate-2">
          ECO
        </h1>
        <h2 className="text-5xl font-black uppercase mb-8 -rotate-1">
          Scanner
        </h2>

        {/* Tagline */}
        <div className="bg-white border-4 border-black px-6 py-4 mb-8" style={{ boxShadow: '8px 8px 0px #000' }}>
          <p className="text-xl font-black uppercase">
            Scan. Compare. Choose Better.
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleGetStarted}
          className="bg-lime-400 border-4 border-black px-12 py-4 font-black text-xl uppercase hover:translate-x-1 hover:translate-y-1 transition-transform"
          style={{ boxShadow: '8px 8px 0px #000' }}
        >
          Start Scanning →
        </button>
      </div>
    </div>
  );
}

export {SplashScreen, SplashScreenAnimated, SplashScreenMinimal} ;
