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
      className="bg-white border-4 border-black p-4 cursor-pointer hover:-translate-y-1 transition-transform"
      style={{ boxShadow: '8px 8px 0px #000' }}
      onClick={() => navigate('/product', { state: { productInfo: product } })}
    >
      {/* Product Image */}
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="w-24 h-24 object-cover border-2 border-black mx-auto mb-3 -rotate-1"
        />
      )}

      {/* Product Name */}
      <h3 className="text-lg font-black uppercase text-center mb-2 tracking-tight leading-tight">
        {product.name}
      </h3>

      {/* Eco Score */}
      {product.ecoScore !== undefined && product.ecoScore !== null && (
        <div className="mb-4">
          <div className="bg-lime-400 border-2 border-black px-3 py-2 text-center -rotate-1" style={{ boxShadow: '4px 4px 0px #000' }}>
            <div className="text-sm font-black uppercase text-black">
              <Sprout className='inline-block' /> Eco-Score: {product.ecoScore}/100
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
        className="w-full bg-red-500 border-2 border-black py-2 px-4 font-black uppercase text-sm hover:bg-red-600 transition-colors"
        style={{ boxShadow: '4px 4px 0px #000' }}
      >
        Remove <HeartCrack className='inline-block ml-1 mb-1 ' />
      </button>
    </div>
  );
}

function FavouriteProducts({ favourites, onRemove, navigate }) {
  const favouriteProducts = Object.values(favourites);

  return (
    <div className="space-y-6">
      <motion.h2
        className="text-3xl font-black uppercase mb-6 -rotate-1 bg-white border-4 border-black inline-block px-4 py-2 rotate-1"
        style={{ boxShadow: '6px 6px 0px #000' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
      >
         Your Favourite Products
      </motion.h2>

      {favouriteProducts.length === 0 ? (
        <motion.div
          className="bg-gray-100 border-4 border-black p-8 text-center rotate-1"
          style={{ boxShadow: '8px 8px 0px #000' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
        >
          <div className="text-6xl mb-4"><HeartCrack className='inline-block' size={48} color='red' /></div>
          <h3 className="text-2xl font-black uppercase mb-4">No Favourites Yet</h3>
          <p className="font-black text-sm uppercase tracking-wide">Scan products and add them to your favourites to see them here!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      className="min-h-screen bg-purple-500 p-4 flex flex-col pb-32"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="bg-blue-600 border-4 border-black p-4 mb-6 -rotate-1"
        style={{ boxShadow: '8px 8px 0px #000' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-4xl"><Heart size={42} color='red' /></span>
          Favourites
        </h1>
        {/* <p className="text-center text-sm font-black uppercase tracking-wide">Your Sustainable Choices</p> */}
      </motion.div>

      <motion.div
        className="max-w-4xl mx-auto bg-white border-4 border-black rotate-2 flex-1 flex flex-col"
        style={{ boxShadow: '16px 16px 0px #000' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >

        {/* Navigation */}
        <motion.div
          className="p-6 bg-yellow-300 border-b-4 border-black"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        >
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-8 py-4 border-4 border-black font-black uppercase text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
            style={{ boxShadow: '6px 6px 0px #000' }}
          >
            ← Back to Scanner
          </button>
        </motion.div>

        {/* Favourites List */}
        <div className="flex-1 overflow-y-auto p-6 pb-32">
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
