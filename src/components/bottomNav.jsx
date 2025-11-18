import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { motion } from "framer-motion";
import { ScanHeart } from "../icons/scanHeart";
import { ScanText } from "../icons/scanText";
import { User } from "../icons/profile";
import { Annoyed } from "../icons/annoyed.js";
import { CheckCheck } from "../icons/check.js";

function NavButton({ onClick, icon, label, bgColor, rotateDir }) {
  return (
    <motion.button
      onClick={onClick}
      className="group flex flex-col items-center justify-center px-3 py-2 border-2 border-black font-black uppercase text-xs rounded-xl relative overflow-hidden"
      style={{ boxShadow: '2px 2px 0px #000', backgroundColor: bgColor }}
      whileHover={{ y: -2, rotate: rotateDir || 0 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <span className="text-xl mb-1 relative z-10">{icon}</span>
      <span className="text-[10px] tracking-wider relative z-10">{label}</span>
    </motion.button>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleFavouritesClick = () => {
    if (isAuthenticated) {
      navigate('/favourites');
    } else {
      sessionStorage.setItem('redirectAfterLogin', '/favourites');
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <motion.nav
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      initial={{ opacity: 0.25, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className="bg-white border-2 border-black rounded-2xl px-2 py-2 backdrop-blur-sm"
        style={{ boxShadow: '4px 4px 0px #000' }}
      >
        <div className="flex gap-2 items-center">
          <NavButton
            onClick={() => navigate('/')}
            icon={<ScanText />}
            label="HOME"
            bgColor="#bef264"
            rotateDir={-1}
          />
          <NavButton
            onClick={() => navigate('/compare')}
            icon={<CheckCheck />}
            label="COMPARE"
            bgColor="#c084fc"
            rotateDir={1}
          />
          <NavButton
            onClick={handleFavouritesClick}
            icon={<ScanHeart />}
            label="FAVES"
            bgColor="#93c5fd"
            rotateDir={-1}
          />
          <NavButton
            onClick={handleProfileClick}
            icon={isAuthenticated ? <User /> : <Annoyed />}
            label={isAuthenticated ? 'PROFILE' : 'LOGIN'}
            bgColor={isAuthenticated ? '#67e8f9' : '#fdba74'}
            rotateDir={1}
          />
        </div>
      </div>
    </motion.nav>
  );
}

export default BottomNav;
