import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ScanHeart } from "../icons/scanHeart"
import { ScanText } from "../icons/scanText"
import { User } from "../icons/profile"
import { LogIn, Trophy } from "lucide-react"
import { Annoyed } from "../icons/annoyed.js"
import { CheckCheck } from "../icons/check.js"

function BottomNav() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [opacity, setOpacity] = useState(0.25)

    // Simple opacity change after 1 second
    useEffect(() => {
        const timer = setTimeout(() => {
            setOpacity(1);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleFavouritesClick = () => {
        if (isAuthenticated) {
            navigate('/favourites')
        } else {
            sessionStorage.setItem('redirectAfterLogin', '/favourites')
            navigate('/login')
        }
    }

    const handleProfileClick = () => {
        if (isAuthenticated) {
            navigate('/profile')
        } else {
            navigate('/login')
        }
    }

    return (
        <>
        <motion.nav
          className="fixed bottom-2 sm:bottom-0 left-1/2 z-50"
          style={{
            transform: 'translateX(-50%) translateY(0)',
            pointerEvents: 'auto'
          }}
          initial={{ opacity: 0.25 }}
          animate={{ opacity: opacity }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="bg-white border-2 sm:border-4 border-black px-1 sm:px-2 py-1 sm:py-2" style={{ boxShadow: '4px 4px 0px #000' }}>
            <div className="flex gap-1 sm:gap-3 items-center">
              <button
                onClick={() => navigate('/')}
                className="flex flex-col items-center justify-center px-2 sm:px-3 py-1 sm:py-2 border-2 sm:border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 bg-lime-300"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <span className="text-lg sm:text-2xl mb-0.5 sm:mb-1"><ScanText/></span>
                <span className="text-xs sm:text-xs">Home</span>
              </button>

              <button
                onClick={() => navigate('/compare')}
                className="flex flex-col items-center justify-center px-2 sm:px-3 py-1 sm:py-2 border-2 sm:border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 bg-purple-500"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <span className="text-lg sm:text-2xl mb-0.5 sm:mb-1"><CheckCheck /></span>
                <span className="text-xs sm:text-xs">Compare</span>
              </button>

              <button
                onClick={handleFavouritesClick}
                className="flex flex-col items-center justify-center px-2 sm:px-3 py-1 sm:py-2 border-2 sm:border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 bg-blue-300"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <span className="text-lg sm:text-2xl mb-0.5 sm:mb-1"><ScanHeart /></span>
                <span className="text-xs sm:text-xs">Faves</span>
              </button>

              <button
                onClick={handleProfileClick}
                className={`flex flex-col items-center justify-center px-3 sm:px-5 py-1 sm:py-2 border-2 sm:border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 ${isAuthenticated ? 'bg-cyan-300' : 'bg-orange-300'}`}
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <span className="text-lg sm:text-2xl mb-0.5 sm:mb-1">
                  {isAuthenticated ? <User /> : <Annoyed />}
                </span>
                <span className="text-xs sm:text-xs">{isAuthenticated ? 'Profile' : 'Login'}</span>
              </button>
            </div>
          </div>
        </motion.nav>
        </>
    )
}

export default BottomNav
