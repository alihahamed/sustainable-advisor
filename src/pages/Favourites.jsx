import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getFavourites, removeFromFavourites } from '../services/favouritesService.js';
import Toast from '../components/Toast.jsx';
import BottomNav from '../components/bottomNav.jsx';
import {Heart, HeartCrack, Sprout} from 'lucide-react'

function FavouriteProductCard({ product, onRemove, navigate }) {
  return (
    <div
      className="bg-white border-2 sm:border-4 border-black p-3 sm:p-4 cursor-pointer hover:-translate-y-1 transition-transform"
      style={{ boxShadow: '4px 4px 0px #000' }}
      onClick={() => navigate('/product', { state: { productInfo: product } })}
    >
      {/* Product Image */}
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="w-16 h-16 sm:w-24 sm:h-24 object-cover border-2 sm:border-3 border-black mx-auto mb-3 "
        />
      )}

      {/* Product Name */}
      <h3 className="text-base sm:text-lg font-black uppercase text-center mb-2 tracking-tight leading-tight">
        {product.name}
      </h3>

      {/* Eco Score */}
      {product.ecoScore !== undefined && product.ecoScore !== null && (
        <div className="mb-3 sm:mb-4">
          <div className="bg-lime-400 border-2 sm:border-3 border-black px-2 sm:px-3 py-1 sm:py-2 text-center -rotate-1" style={{ boxShadow: '4px 4px 0px #000' }}>
            <div className="text-xs sm:text-sm font-black uppercase text-black">
              <Sprout size={14} className='sm:w-4 sm:h-4 inline-block' /> Eco-Score: {product.ecoScore}/100
            </div>
          </div>
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(product.code);
        }}
        className="w-full bg-red-500 border-2 border-black py-2 px-4 font-black uppercase text-xs sm:text-sm hover:bg-red-600 transition-colors"
        style={{ boxShadow: '4px 4px 0px #000' }}
      >
        Remove <HeartCrack size={14} className='sm:w-4 sm:h-4 inline-block ml-1 mb-1 ' />
      </button>
    </div>
  );
}

function FavouriteProducts({ favourites, onRemove, navigate }) {
  const favouriteProducts = Object.values(favourites);

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.h2
        className="text-2xl sm:text-3xl font-black uppercase mb-4 sm:mb-6 -rotate-1 bg-white border-2 sm:border-4 border-black inline-block px-3 sm:px-4 py-2 rotate-1"
        style={{ boxShadow: '4px 4px 0px #000' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
      >
         Your Favourite Products
      </motion.h2>

      {favouriteProducts.length === 0 ? (
        <motion.div
          className="bg-gray-100 border-2 sm:border-4 border-black p-4 sm:p-8 text-center rotate-1"
          style={{ boxShadow: '4px 4px 0px #000' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
        >
          <div className="text-4xl sm:text-6xl mb-4"><HeartCrack className='inline-block sm:w-12 sm:h-12' size={32} color='red' /></div>
          <h3 className="text-xl sm:text-2xl font-black uppercase mb-4">No Favourites Yet</h3>
          <p className="font-black text-xs sm:text-sm uppercase tracking-wide">Scan products and add them to your favourites to see them here!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {favouriteProducts.map((product, index) => (
            <motion.div
              key={product.code}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 + (index * 0.1) }}
            >
              <FavouriteProductCard
                product={product}
                onRemove={onRemove}
                navigate={navigate}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Favourites() {
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    setFavourites(getFavourites());
  }, []);

  const handleRemove = (code) => {
    removeFromFavourites(code);
    setFavourites(getFavourites());
    setToast({ show: true, message: 'Removed from favourites 💔', type: 'success' });
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
      className="min-h-screen bg-purple-500 p-2 sm:p-4 flex flex-col pb-32"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="bg-blue-600 border-2 sm:border-4 border-black p-2 sm:p-4 mb-4 sm:mb-6 -rotate-1"
        style={{ boxShadow: '4px 4px 0px #000' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-2xl sm:text-3xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-2xl sm:text-3xl"><Heart size={32} className='sm:w-10 sm:h-10' color='red' /></span>
          Favourites
        </h1>
        {/* <p className="text-center text-xs sm:text-sm font-black uppercase tracking-wide">Your Sustainable Choices</p> */}
      </motion.div>

      <motion.div
        className=" bg-white border-2 sm:border-4 border-black  flex-1 flex flex-col"
        style={{ boxShadow: '8px 6px 0px #000' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >

        {/* Navigation */}
        <motion.div
          className="p-3 sm:p-6 bg-yellow-300 border-b-2 sm:border-b-4 border-black"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        >
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-4 sm:px-8 py-2 sm:py-4 border-2 sm:border-4 border-black font-black uppercase text-sm sm:text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
            style={{ boxShadow: '4px 4px 0px #000' }}
          >
            ← Back to Scanner
          </button>
        </motion.div>

        {/* Favourites List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-32">
          <FavouriteProducts
            favourites={favourites}
            onRemove={handleRemove}
            navigate={navigate}
          />
        </div>


      </motion.div>

       {/* Footer */}
       <BottomNav />

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

export default Favourites;
