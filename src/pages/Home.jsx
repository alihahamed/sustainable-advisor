import { useRef, useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTransportationEmissions } from '../services/carbonInterface.js'
import { getProductData, findSustainableAlternatives } from '../services/openFoodFacts.js'
import { enhanceOffDataWithBarcodeOrigin } from '../services/barcodeLookup.js'
import { analyzePackagingImpact } from '../services/packagingImpact.js'
import { challengeActions } from '../services/challengesService.js'
import { Camera, Ban, Leaf, Flower, Earth, Bug, Tractor, Sprout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import BottomNav from '../components/bottomNav.jsx';
import {LoadingBouncingBoxes1, LoadingBouncingBoxes2, LoadingBouncingBoxes3, LoadingTextMorph1, LoadingTextMorph2, LoadingTextMorph3, LoadingGeometric1, LoadingGeometric2, LoadingGeometric3} from '../components/loaders.jsx'

function RecentlyScannedProducts({ products, onSelectProduct }) {
  // Define animation variants locally
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

  if (!products || products.length === 0) {
    return (
      <motion.div
        className="p-8 text-center bg-yellow-300 border-4 border-black m-4"
        style={{ boxShadow: '8px 8px 0px #000' }}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          className="text-6xl mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 200 }}
        >
          📦
        </motion.div>
        <motion.p
          className="text-xl font-black uppercase tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          Scanned products will appear here
        </motion.p>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, x: -10 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      className="p-6 bg-cyan-400 border-4 border-black m-4"
      style={{ boxShadow: '12px 12px 0px #000' }}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.h2
        className="text-3xl font-black uppercase mb-6 -rotate-1 bg-white border-4 border-black inline-block px-4 py-2"
        style={{ boxShadow: '6px 6px 0px #000' }}
        initial={{ opacity: 0, rotate: -5, x: -10 }}
        animate={{ opacity: 1, rotate: -1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        Recently Scanned
      </motion.h2>

      <motion.div
        className="space-y-4 mt-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {products.slice(0, 5).map((product, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            onClick={() => onSelectProduct(product)}
            className="bg-white p-5 border-4 border-black cursor-pointer hover:translate-x-1 hover:translate-y-1 transition-transform"
            style={{ boxShadow: '6px 6px 0px #000' }}
            whileHover={{
              x: 4,
              y: -4,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              {product.image && (
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover border-3 border-black flex-shrink-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              )}
              <div className="flex-1 min-w-0">
                <motion.h3
                  className="font-black text-lg uppercase truncate"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  {product.name}
                </motion.h3>
                <motion.p
                  className="font-bold text-sm mt-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  Nutri-Score: {product.ecoScore || 'N/A'}
                </motion.p>
              </div>
              <motion.span
                className="text-4xl font-black"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4, type: "spring" }}
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                →
              </motion.span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [recentProducts, setRecentProducts] = useState([]);
  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('flower');

  // Avatar options for helper function
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

  // Load profile settings and recent products from localStorage
  useEffect(() => {
    // Load recent products
    const saved = localStorage.getItem('recentProducts');
    if (saved) {
      try {
        setRecentProducts(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent products:', e);
      }
    }

    // Load profile settings
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

  const addToRecent = (product) => {
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.code !== product.code);
      const updated = [product, ...filtered].slice(0, 5);
      localStorage.setItem('recentProducts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleScanComplete = (productInfo) => {
    addToRecent(productInfo);
    navigate('/product', { state: { productInfo } });
  };

  const handleSelectProduct = (product) => {
    fetchProductInfo(product.code);
  };

  const applyScannerStyles = () => {
    setTimeout(() => {
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.style.backgroundColor = '#fff';
        readerElement.style.border = '4px solid #000';
        readerElement.style.padding = '1rem';
        readerElement.style.width = '280px';
        readerElement.style.height = '350px';
        readerElement.style.display = 'flex';
        readerElement.style.flexDirection = 'column';
        readerElement.style.justifyContent = 'center';
        readerElement.style.boxShadow = '8px 8px 0px #000';

        const canvas = readerElement.querySelector('video, canvas');
        if (canvas) {
          canvas.style.border = '4px solid #000';
          canvas.style.boxShadow = 'none';
          canvas.style.width = '240px';
          canvas.style.height = '240px';
          canvas.style.objectFit = 'cover';
        }

        const scanRegion = readerElement.querySelector('#reader__scan_region');
        if (scanRegion) {
          scanRegion.style.backgroundColor = '#fff';
          scanRegion.style.width = '200px';
          scanRegion.style.height = '200px';
        }

        const buttons = readerElement.querySelectorAll('button');
        buttons.forEach(button => {
          button.style.backgroundColor = '#000';
          button.style.color = '#fff';
          button.style.padding = '8px 16px';
          button.style.fontSize = '14px';
          button.style.fontWeight = '900';
          button.style.border = '3px solid #000';
          button.style.cursor = 'pointer';
          button.style.margin = '4px';
          button.style.textTransform = 'uppercase';
        });
      }
    }, 100);
  };

  const scannerRef = useRef(null);
  const isScanning = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startScanning = () => {
    if (isScanning.current) return;

    isScanning.current = true;
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      {
        qrbox: {
          width: 200,
          height: 200,
        },
        fps: 5,
      },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);
    applyScannerStyles();
  };

  const stopScanning = () => {
    console.log('Scanning stopped');
    if (scannerRef.current && isScanning.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
      isScanning.current = false;
    }
  };

  const fetchProductInfo = async (barcode) => {
    setLoading(true);
    setError(null);

    try {
      const productData = await getProductData(barcode);
      const enhancedData = enhanceOffDataWithBarcodeOrigin(productData);

      let transportationEmissions = null;
      if (enhancedData.inferred_origin?.country !== 'Unknown') {
        try {
          transportationEmissions = await getTransportationEmissions(
            enhancedData.inferred_origin.country,
            'India',
            enhancedData.weight_kg || 1,
            'food'
          );
        } catch (transportError) {
          console.warn('Transportation calculation failed:', transportError);
        }
      }

      const packagingImpact = analyzePackagingImpact(enhancedData.packaging);

      let alternativesResponse = null;
      try {
        alternativesResponse = await findSustainableAlternatives(enhancedData);
      } catch (altError) {
        console.warn('Failed to find alternatives:', altError);
      }

      // Extract data from response object
      const alternativesArray = alternativesResponse?.alternatives || [];
      const mealSuggestions = alternativesResponse?.mealSuggestions || [];
      const hasHighProtein = alternativesResponse?.hasHighProtein || false;

      const productInfo = {
        code: enhancedData.code,
        name: enhancedData.name,
        ingredients: enhancedData.ingredients,
        ecoScore: enhancedData.nutriscore_score,
        nutriGrade:enhancedData.nutriscore_grade,
        packaging: enhancedData.packaging,
        image: enhancedData.image,
        nutrients: enhancedData.nutrients,
        nutrientsData: enhancedData.nutrientsData,
        ingredientConcerns: enhancedData.ingredientConcerns,
        transportation: transportationEmissions,
        origin: enhancedData.inferred_origin,
        completeness: enhancedData.completeness,
        packaging_impact: packagingImpact,
        alternatives: alternativesArray,
        mealSuggestions: mealSuggestions,
        hasHighProtein: hasHighProtein
      };

      console.log('HOME: productInfo.ingredientConcerns:', productInfo.ingredientConcerns);
      console.log('HOME: full productInfo:', productInfo);
      

      handleScanComplete(productInfo);

    } catch (err) {
      console.error('Product fetch error:', err);
      setError(`Failed to fetch product data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log(`Code scanned = ${decodedText}`, decodedResult);

    // Track scan challenge progress for logged in users
    if (user?.id) {
      await challengeActions.onScan(user.id);
    }

    stopScanning();
    fetchProductInfo(decodedText);
  };

  const onScanFailure = () => {
    // console.warn(`Code scan error = ${error}`);
  };

  // Weekly eco tips - rotate based on week number
  const getWeeklyEcoTip = () => {
    const tips = [
      "🌍 Buy local produce to reduce transportation emissions by up to 90%!",
      "♻️ Choose products with recycled packaging - glass beats plastic every time!",
      "🥗 Foods with no or minimal packaging are always the most sustainable choice!",
      "🛒 Plan your meals to avoid food waste - up to 30% of food is thrown away globally!",
      "💧 Check water usage - some crops use 100x more water than others!",
      "🌱 Products in season don't need long transport - they're fresher too!",
      "📦 Think before you buy - single-use plastics take 500+ years to decompose!"
    ];

    const weekStart = new Date(2024, 0, 1); // Start of 2024 for consistent rotation
    const today = new Date();
    const weekNumber = Math.floor((today - weekStart) / (1000 * 60 * 60 * 24 * 7));

    return tips[weekNumber % tips.length];
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

  return (
    <motion.div
      className="min-h-screen bg-red-700 p-4 flex flex-col relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 backdrop-blur-md flex items-center justify-center z-50" onClick={() => {}}>
          <LoadingGeometric1 />
        </div>
      )}

      {/* Header - Made Smaller */}
      <motion.div
        className="bg-green-500 border-4 border-black p-4 mb-6 -rotate-1"
        style={{ boxShadow: '8px 8px 0px #000' }}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-3xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-3xl"><Leaf size={40} /></span>
          Eco-Dex
        </h1>
        <p className="text-center text-sm font-black uppercase tracking-wide">Make conscious choices</p>
      </motion.div>

      <motion.div
        className="max-w-md mx-auto bg-white border-4 border-black rotate-1 flex-1 flex flex-col"
        style={{ boxShadow: '16px 12px 0px #000' }}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Scan Controls */}
        <motion.div
          className="p-6 bg-yellow-300 border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              onClick={startScanning}
              disabled={isScanning.current}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 border-4 border-black font-black uppercase text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
              style={{ boxShadow: '6px 6px 0px #000' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="text-2xl "><Camera  size={42}/></span> Scan
            </motion.button>
            <motion.button
              onClick={stopScanning}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 border-4 border-black font-black uppercase text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
              style={{ boxShadow: '6px 6px 0px #000' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="text-2xl "><Ban size={42} /></span> Stop
            </motion.button>
          </div>
        </motion.div>

        {/* Scanner Area */}
        <motion.div
          className="p-8 bg-blue-300 border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div
            id="reader"
            className="w-full max-w-sm mx-auto bg-white border-4 border-black p-6"
            style={{ boxShadow: '8px 8px 0px #000' }}
          ></div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            className="p-8 bg-red-300 border-b-4 border-black"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="bg-white border-4 border-black px-6 py-6 text-center" style={{ boxShadow: '8px 8px 0px #000' }}>
              <div className="text-6xl mb-4">⚠️</div>
              <p className="font-black uppercase text-lg">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Auth Status Indicator with Profile */}
        <motion.div
          className="px-6 py-2 bg-purple-400 border-b-4 border-black"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, delay: error ? 0.7 : 0.6 }}
        >
          {isAuthenticated ? (
            <div className="flex items-center justify-center">
              <div className="">
                {/* <motion.div
                  className="avatar cursor-pointer hover:scale-110 transition-transform mr-3"
                  onClick={() => navigate('/profile')}
                >
                  <div className="ring-primary ring-offset-base-100 w-10 rounded-full ring-2 ring-offset-1 flex justify-center items-center bg-black">
                    {getSelectedAvatarComponent()}
                  </div>
                </motion.div> */}
                <p className="text-sm font-black uppercase text-white bg-black inline-block px-3 py-1 -rotate-1">
                  👋 Hi, {customName || user?.email?.split('@')[0] || 'Eco Warrior'}!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-black uppercase text-white bg-black inline-block px-3 py-1 -rotate-1">
                👤 Guest Mode - Login for Favourites!
              </p>
            </div>
          )}
        </motion.div>

        {/* Recently Scanned Products */}
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Weekly Eco Tip */}
          <motion.div
            className="p-4 bg-lime-400 border-4 border-black m-4 -rotate-1"
            style={{ boxShadow: '10px 10px 0px #000' }}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: error ? 0.9 : 0.8 }}
          >
            <div className="text-center">
              <motion.span
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  delay: error ? 1.2 : 1.0,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
              >
                💡
              </motion.span>
              <motion.p
                className="text-lg font-black uppercase text-black leading-tight"
                initial={{ opacity: 0, y: 15, scaleX: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleX: 1 }}
                transition={{
                  duration: 0.7,
                  delay: error ? 1.4 : 1.2,
                  ease: "easeOut"
                }}
              >
                {getWeeklyEcoTip()}
              </motion.p>
            </div>
          </motion.div>

          <RecentlyScannedProducts products={recentProducts} onSelectProduct={handleSelectProduct} />
          {console.log('Recent products:', recentProducts)}
        </div>

      </motion.div>
      <BottomNav />
    </motion.div>
  );
}

export default Home;
