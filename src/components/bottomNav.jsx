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
          className="fixed bottom-5 left-1/2 z-50"
          style={{
            transform: 'translateX(-50%) translateY(0)',
            pointerEvents: 'auto'
          }}
          initial={{ opacity: 0.25 }}
          animate={{ opacity: opacity }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="bg-yellow-300 border-4 border-black px-2 py-2" style={{ boxShadow: '8px 8px 0px #000' }}>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => navigate('/')}
                className="flex flex-col items-center justify-center px-3 py-2 border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 bg-lime-300"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                <span className="text-2xl mb-1"><ScanText/></span>
                <span>Home</span>
              </button>

              <button
                onClick={() => navigate('/compare')}
                className="flex flex-col items-center justify-center px-3 py-2 border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 bg-purple-700"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                <span className="text-2xl mb-1"><CheckCheck /></span>
                <span>Compare</span>
              </button>

              <button
                onClick={handleFavouritesClick}
                className="flex flex-col items-center justify-center px-3 py-2 border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 bg-blue-500"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                <span className="text-2xl mb-1"><ScanHeart /></span>
                <span>Faves</span>
              </button>

              <button
                onClick={handleProfileClick}
                className={`flex flex-col items-center justify-center px-5 py-2 border-3 border-black font-black uppercase text-xs transition-transform hover:-translate-y-1 ${isAuthenticated ? 'bg-cyan-300' : 'bg-orange-400'}`}
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                <span className="text-2xl mb-1">
                  {isAuthenticated ? <User /> : <Annoyed />}
                </span>
                <span>{isAuthenticated ? 'Profile' : 'Login'}</span>
              </button>
            </div>
          </div>
        </motion.nav>
        </>
    )
}

export default BottomNav
