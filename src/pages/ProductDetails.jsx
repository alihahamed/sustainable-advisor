import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useInView } from 'framer-motion';
import { contributeMissingData, assessDataCompleteness, validateContributionData } from '../services/offContribute.js';
import { addToFavourites, isFavourite } from '../services/favouritesService.js';
import Toast from '../components/Toast.jsx';
import { Leaf, Sprout, Package, Bus, Map, Banana, ChartColumn, Candy, Carrot, Apple } from 'lucide-react';
import BottomNav from '../components/bottomNav.jsx';


// Copy the SustainableAlternativesDisplay and DataContributionForm from App.jsx
function calculateEcoScore(productInfo) {
  if (!productInfo) return null;

  let score = 0;
  let totalPossible = 0;

  // Packaging Sustainability (20 points)
  if (productInfo.packaging_impact?.recyclability_percent !== undefined) {
    totalPossible += 20;
    const recyclability = productInfo.packaging_impact.recyclability_percent;
    if (recyclability >= 90) score += 20;
    else if (recyclability >= 70) score += 15;
    else if (recyclability >= 50) score += 10;
    else if (recyclability >= 30) score += 5;
    // else 0
  }

  // Transportation CO₂ (20 points)
  if (productInfo.transportation?.co2_kg !== undefined) {
    totalPossible += 20;
    const co2 = productInfo.transportation.co2_kg;
    if (co2 < 0.5) score += 20;
    else if (co2 < 1) score += 15;
    else if (co2 < 2) score += 10;
    else if (co2 < 3) score += 5;
    // else 0
  }

  // Ingredient Quality (30 points)
  totalPossible += 30;
  let ingredientScore = 30;

  // Check sugar content
  if (productInfo.nutrientsData?.sugar !== undefined && !isNaN(productInfo.nutrientsData.sugar)) {
    if (productInfo.nutrientsData.sugar > 10) {
      ingredientScore -= 5;
    }
  }

  // Check for concerning ingredients
  const ingredientsLower = productInfo.ingredients?.toLowerCase() || '';
  if (ingredientsLower.includes('palm oil') || ingredientsLower.includes('palm fat')) {
    ingredientScore -= 10;
  }
  if (ingredientsLower.includes('artificial') || ingredientsLower.includes('asp artame') || ingredientsLower.includes('preservative')) {
    ingredientScore -= 5;
  }

  // Additional ingredient concerns from detected issues
  if (productInfo.ingredientConcerns) {
    productInfo.ingredientConcerns.forEach(concern => {
      if (concern.severity === 'high') ingredientScore -= 8;
      else if (concern.severity === 'medium') ingredientScore -= 5;
      else ingredientScore -= 3;
    });
  }

  ingredientScore = Math.max(0, ingredientScore);
  score += ingredientScore;

  // Nutritional Balance (30 points)
  totalPossible += 30;
  let nutritionScore = 0;

  const nutrients = productInfo.nutrientsData;
  if (nutrients) {
    // Proteins
    if (nutrients.proteins > 7) nutritionScore += 4;
    // Fat
    if (nutrients.fat < 10) nutritionScore += 4;
    // Carbs
    if (nutrients.carbohydrates < 20) nutritionScore += 3;
    // Salt
    if (nutrients.salt < 1) nutritionScore += 4;
    // Sugar
    if (nutrients.sugar < 5) nutritionScore += 4;
  }

  // Nutrient levels (additional bonus)
  if (productInfo.nutrients) {
    if (productInfo.nutrients['salt'] === 'low') nutritionScore += 3;
    if (productInfo.nutrients['saturated-fat'] === 'low') nutritionScore += 3;
    if (productInfo.nutrients['sugars'] === 'low') nutritionScore += 3;
    if (productInfo.nutrients['fiber'] === 'high') nutritionScore += 3;
  }

  score += Math.min(30, nutritionScore);

  // If we have less than 20% of possible data, return null
  if (totalPossible < 40) return null;

  // Return percentage
  return Math.round((score / totalPossible) * 100);
}

function SustainableAlternativesDisplay({ alternatives }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <motion.div
      className="p-6 bg-lime-400 border-4 border-black m-4"
      style={{ boxShadow: '12px 12px 0px #000' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 1.9 }}
    >
      <motion.h2
        className="text-3xl font-black uppercase mb-6 -rotate-1 bg-white border-4 border-black inline-block px-4 py-2 -rotate-2"
        style={{ boxShadow: '6px 6px 0px #000' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 2.0 }}
      >
        🌟 Alternatives
      </motion.h2>

      <div className="space-y-6 mt-6">
        {alternatives.map((alternative, index) => (
          <motion.div
            key={alternative.code}
            className="bg-white p-4 border-4 border-black"
            style={{ boxShadow: '6px 6px 0px #000' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 2.1 + (index * 0.15) }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Product Image */}
              {alternative.image_front_url && (
                <img
                  src={alternative.image_front_url}
                  alt={alternative.product_name}
                  className="w-24 h-24 object-cover border-3 border-black flex-shrink-0 self-center md:self-start"
                  style={{ border: '3px solid #000' }}
                />
              )}

              {/* Product Info Container */}
              <div className="flex-1">
                <h4 className="font-black text-xl uppercase mb-3 text-center md:text-left">{alternative.product_name}</h4>

                {/* Grades & Scores */}
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  {alternative.nutriscore_grade && (
                    <span className="bg-lime-300 border-2 border-black px-3 py-1 font-black text-sm uppercase -rotate-1">
                      {alternative.nutriscore_grade.toUpperCase()} GRADE
                    </span>
                  )}
                  {alternative.nutriscore_score && (
                    <span className="bg-yellow-300 border-2 border-black px-3 py-1 font-black text-sm uppercase">
                      {alternative.nutriscore_score} PTS
                    </span>
                  )}
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Packaging - Top Left */}
                  {alternative.packaging && (
                    <div className="bg-cyan-100 border-2 border-black p-3">
                      <div className="font-black text-sm uppercase mb-1 text-cyan-800"><Package /> Packaging</div>
                      <div className="font-bold text-sm">{alternative.packaging}</div>
                    </div>
                  )}

                  {/* Nutrients - Top Right */}
                  {alternative.nutrients && alternative.nutrients.length > 0 && (
                    <div className="bg-purple-100 border-2 border-black p-3">
                      <div className="font-black text-sm uppercase mb-1 text-purple-800"><Carrot /> Nutrients</div>
                      <div className="font-bold text-sm">
                        {alternative.nutrients.slice(0, 4).join(', ')}{alternative.nutrients.length > 4 ? '...' : ''}
                      </div>
                    </div>
                  )}

                  {/* Ingredients - Bottom Full Width */}
                  {alternative.ingredients && alternative.ingredients.length > 0 && (
                    <div className="col-span-2 bg-green-100 border-2 border-black p-3">
                      <div className="font-black text-sm uppercase mb-1 text-green-800"><Apple /> Ingredients</div>
                      <div className="font-bold text-sm leading-tight">
                        {alternative.ingredients.slice(0, 3).join(', ')}{alternative.ingredients.length > 3 ? '...' : ''}
                      </div>
                    </div>
                  )}

                  {/* Benefits - If needed, can be placed after ingredients */}
                  {alternative.benefits && alternative.benefits.length > 0 && (
                    <div className="col-span-2 bg-pink-100 border-2 border-black p-3">
                      <div className="font-black text-sm uppercase mb-2 text-pink-800">✨ Benefits</div>
                      <div className="space-y-1">
                        {alternative.benefits.slice(0, 2).map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-bold">
                            <span>{benefit.icon}</span>
                            <span>{benefit.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
function DataContributionForm({ productData, onContribute, contributionData, onDataChange, loading }) {
  const completeness = assessDataCompleteness(productData);
  const hasMissing = !completeness.packaging || !completeness.ingredients || !completeness.nutrients;

  if (!hasMissing) return null;

  return (
    <motion.div
      className="bg-orange-400 border-4 border-black p-6 m-4 -rotate-1"
      style={{ boxShadow: '8px 8px 0px #000' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 2.5 }}
    >
      <motion.h2
        className="text-3xl font-black uppercase mb-6 bg-white border-4 border-black inline-block px-4 py-2 rotate-1"
        style={{ boxShadow: '6px 6px 0px #000' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 2.6 }}
      >
        📝 Contribute Data
      </motion.h2>

      <motion.p
        className="mb-6 font-black text-sm uppercase bg-white border-2 border-black p-3 -rotate-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 2.7 }}
      >
        Help Sustainability Analysis!
      </motion.p>

      <div className="space-y-4">
        {!completeness.packaging && (
          <div>
            <label className="block font-black text-sm uppercase mb-2 bg-black text-white p-2 -rotate-1 border-2 border-black">
              📦 Packaging Type
            </label>
            <select
              className="w-full p-4 border-4 border-black bg-white font-black text-sm uppercase"
              style={{ boxShadow: '4px 4px 0px #000' }}
              value={contributionData.packaging || ''}
              onChange={(e) => onDataChange({...contributionData, packaging: e.target.value})}
            >
              <option value="">Select packaging...</option>
              <option value="cardboard box">Cardboard Box</option>
              <option value="plastic bottle">Plastic Bottle</option>
              <option value="glass jar">Glass Jar</option>
              <option value="metal can">Metal Can</option>
              <option value="foil wrapper">Foil Wrapper</option>
              <option value="paper bag">Paper Bag</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {!completeness.ingredients && (
          <div>
            <label className="block font-black text-sm uppercase mb-2 bg-black text-white p-2 rotate-1 border-2 border-black">
              🥕 Ingredients List
            </label>
            <textarea
              className="w-full p-4 border-4 border-black bg-white h-24 font-bold"
              style={{ boxShadow: '4px 4px 0px #000' }}
              placeholder="List main ingredients..."
              value={contributionData.ingredients || ''}
              onChange={(e) => onDataChange({...contributionData, ingredients: e.target.value})}
            />
          </div>
        )}

        {Object.keys(contributionData).length > 0 && (
          <button
            onClick={() => onContribute(contributionData)}
            disabled={loading}
            className="w-full bg-black text-white py-4 px-6 border-4 border-black font-black uppercase text-lg transition-transform hover:-translate-y-1"
            style={{ boxShadow: '6px 6px 0px #000' }}
          >
            {loading ? 'SUBMITTING...' : '🚀 SUBMIT TO DATABASE'}
          </button>
        )}

        <div className="bg-white border-2 border-black p-3 font-black text-xs uppercase -rotate-1">
          Your contribution helps improve global sustainability data!
        </div>
      </div>
    </motion.div>
  );
}

function ProductDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const productInfo = state?.productInfo;
  const [contributionData, setContributionData] = useState({});
  const [contributionLoading, setContributionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Individual animation controls for each section
  const fadeInVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  if (!productInfo) {
    return <div className="p-8 text-center">No product selected</div>;
  }

  console.log('productInfo:', productInfo);
  console.log('nutrientsData:', productInfo?.nutrientsData);

  const handleContribute = async (data) => {
    try {
      setContributionLoading(true);
      const validationErrors = validateContributionData(data);
      if (validationErrors.length > 0) {
        alert('Please fix these issues:\n' + validationErrors.join('\n'));
        return;
      }

      const result = await contributeMissingData(productInfo.code, data);
      setContributionData({});
      alert(result.message);
    } catch (error) {
      alert('Submission failed: ' + error.message);
    } finally {
      setContributionLoading(false);
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <div className="min-h-screen bg-red-700 p-4 flex flex-col pb-32">
      {/* Header */}
      <motion.div
        className="bg-green-500 border-4 border-black p-4 mb-6 -rotate-1"
        style={{ boxShadow: '8px 8px 0px #000' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-3xl"><Leaf size={43} className='mt-2'/></span>
          Product Details
        </h1>
        <p className="text-center text-sm font-black uppercase tracking-wide">Sustainability Analysis</p>
      </motion.div>

      <motion.div
        className="max-w-md mx-auto bg-white border-4 border-black rotate-1 flex-1 flex flex-col"
        style={{ boxShadow: '16px 16px 0px #000' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >

        {/* Back Button Section */}
        <div className="p-6 bg-yellow-300 border-b-4 border-black">
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-8 py-4 border-4 border-black font-black uppercase text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
            style={{ boxShadow: '6px 6px 0px #000' }}
          >
            ← Back to Scanner
          </button>
        </div>

        {/* Product Info */}
        <div className="flex-1 overflow-y-auto p-6 pb-32">
          {/* Product Image */}
          {productInfo.image && (
            <motion.div
              className="mb-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <img
                src={productInfo.image}
                alt={productInfo.name}
                className="w-48 h-48 object-cover border-4 border-black mx-auto -rotate-2"
                style={{ border: '4px solid #000', boxShadow: '8px 8px 0px #000' }}
              />
            </motion.div>
          )}

          {/* Product Title and Favourite Button */}
          <motion.div
            className="bg-cyan-400 border-4 border-black p-4 mb-6 -rotate-1"
            style={{ boxShadow: '6px 6px 0px #000' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-black uppercase text-center tracking-tight">{productInfo.name}</h2>
              </div>
              <button
                onClick={() => {
                  if (isFavourite(productInfo.code)) {
                    setToast({ show: true, message: 'Already in favourites! 💖', type: 'success' });
                  } else {
                    // Calculate and store the eco-score when favouriting
                    const calculatedEcoScore = calculateEcoScore(productInfo);
                    addToFavourites({
                      ...productInfo,
                      ecoScore: calculatedEcoScore
                    });
                    setToast({ show: true, message: 'Added to favourites! 💖', type: 'success' });
                  }
                }}
                className="bg-pink-500 border-4 border-black px-4 py-2 font-black text-sm uppercase hover:scale-105 transition-transform rotate-1"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                {isFavourite(productInfo.code) ? '❤️ Added' : '♡ Add Favourite'}
              </button>
            </div>
          </motion.div>

          {/* Eco-Score */}
          <motion.div
            className="bg-lime-400 border-4 border-black p-6 mb-4"
            style={{ boxShadow: '6px 6px 0px #000' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.6 }}
          >
            <div className="flex items-center justify-center gap-4">
              <span className="text-6xl mr-2"><Sprout size={54}/></span>
              <div className="text-center">
                <div className="text-sm font-black uppercase mb-1">Eco-Score</div>
                <div className="text-4xl font-black text-black">
                  {calculateEcoScore(productInfo)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Ingredient Concerns Warnings */}
          {(() => {
            console.log('Ingredient concerns debug:', productInfo.ingredientConcerns?.length, productInfo.ingredientConcerns);
            return productInfo.ingredientConcerns && productInfo.ingredientConcerns.length > 0 && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.8 }}
              >
                <motion.div
                  className="bg-black text-white p-3 border-2 border-black mb-4 rotate-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.9 }}
                >
                  <p className="font-black text-sm uppercase tracking-tight">⚠️ CONCERNING INGREDIENTS DETECTED</p>
                </motion.div>
                {productInfo.ingredientConcerns.map((concern, index) => {
                  const severityColor =
                    concern.severity === 'high' ? 'bg-red-600 border-black' :
                    concern.severity === 'medium' ? 'bg-yellow-300 border-black' :
                    'bg-orange-600 border-black';

                  return (
                    <motion.div
                      key={index}
                      className={`p-4 mb-3 border-4 ${severityColor} -rotate-1`}
                      style={{ boxShadow: '6px 6px 0px #000', transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)` }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 1.0 + (index * 0.1) }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{concern.icon}</span>
                        <div>
                          <h3 className="font-black text-lg uppercase text-black tracking-tight">
                             {concern.category.toUpperCase()}
                          </h3>
                          <p className="font-black text-sm uppercase text-black tracking-tight mt-1">
                            {concern.description}
                          </p>
                          <div className="mt-2">
                            <span className="bg-white text-black px-2 py-1 text-xs font-black uppercase border-2 border-black">
                              INGREDIENT: {concern.detected.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })()}

          

          {/* Masonry Layout for Packaging, Transport, Origin */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 1.2 }}
          >
            {/* Packaging Sustainability */}
            {productInfo.packaging_impact && productInfo.packaging_impact.impact !== 'unknown' && (
              <motion.div
                className="bg-lime-400 border-4 border-black p-3 col-span-2 md:col-span-1"
                style={{ boxShadow: '6px 6px 0px #000', gridRow: 'span 2' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 1.3 }}
              >
                <h3 className="text-base font-black uppercase mb-2 bg-white border-2 border-black inline-block px-1 py-1 -rotate-2">
                  <Package /> Packaging
                </h3>
                <div className={`text-3xl md:text-4xl mb-1 font-black ${productInfo.packaging_impact.color === 'green' ? 'text-green-600' : productInfo.packaging_impact.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {productInfo.packaging_impact.recyclability_percent}%
                </div>
                <div className="font-black text-xs uppercase">Reusable</div>
              </motion.div>
            )}

            {/* Transportation */}
            {productInfo.transportation && (
              <motion.div
                className="bg-cyan-400 border-4 border-black p-3 col-span-1 md:col-span-1"
                style={{ boxShadow: '6px 6px 0px #000' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 1.4 }}
              >
                <h3 className="text-sm font-black uppercase mb-2 bg-white border-2 border-black inline-block px-1 py-1 rotate-1">
                  <Bus /> Transport CO₂
                </h3>
                <div className={`text-2xl md:text-2xl mb-1 font-black ${productInfo.transportation.co2_kg < 1 ? 'text-green-600' : productInfo.transportation.co2_kg < 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {productInfo.transportation.co2_kg?.toFixed(3)}kg
                </div>
                <div className="font-black text-xs uppercase">
                  {productInfo.transportation.transport_method?.toUpperCase()}
                </div>
              </motion.div>
            )}

            {/* Origin */}
            <motion.div
              className="bg-yellow-300 border-4 border-black p-3 col-span-1 md:col-span-1"
              style={{ boxShadow: '6px 6px 0px #000' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 1.5 }}
            >
              <h3 className="text-sm font-black uppercase mb-2 bg-white border-2 border-black inline-block px-1 py-1 -rotate-1">
                <Map /> Origin
              </h3>
              <div className="text-2xl md:text-3xl font-black uppercase text-center leading-tight">
                {productInfo.origin?.country === 'Unknown' || !productInfo.origin?.country ? 'UNKNOWN' : productInfo.origin.country}
              </div>
              <div className="text-xs font-bold uppercase text-center mt-1 text-gray-600">
                {productInfo.origin?.confidence || 'Estimated'}
              </div>
            </motion.div>
          </motion.div>

          {/* Ingredients */}
          <motion.div
            className="bg-white border-4 border-black p-6 mb-4"
            style={{ boxShadow: '6px 6px 0px #000' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 1.6 }}
          >
            <h3 className="text-xl font-black uppercase mb-4 bg-cyan-400 border-2 border-black inline-block px-3 py-1">
              <Banana className='inline-block' /> Ingredients
            </h3>
            <p className="text-sm leading-relaxed font-black uppercase tracking-tight">{productInfo.ingredients}</p>
          </motion.div>

          {/* Nutrition Facts */}
          {productInfo.nutrientsData && (
            <motion.div
              className="bg-lime-400 border-4 border-black p-6 mb-4"
              style={{ boxShadow: '6px 6px 0px #000' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 1.7 }}
            >
              <h3 className="text-xl font-black uppercase mb-4 bg-white border-2 border-black inline-block px-3 py-1 -rotate-2">
                <ChartColumn className='inline-block' /> Nutrition (100g)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border-2 border-black p-3 font-black text-xs uppercase">
                  Energy: {(productInfo.nutrientsData?.energy ?? 'N/A')} kcal
                </div>
                <div className="bg-white border-2 border-black p-3 font-black text-xs uppercase">
                  Proteins: {(productInfo.nutrientsData?.proteins ?? 'N/A')}g
                </div>
                <div className="bg-white border-2 border-black p-3 font-black text-xs uppercase">
                  Fat: {(productInfo.nutrientsData?.fat ?? 'N/A')}g
                </div>
                <div className="bg-white border-2 border-black p-3 font-black text-xs uppercase">
                  Carbs: {(productInfo.nutrientsData?.carbohydrates ?? 'N/A')}g
                </div>
                <div className="bg-white border-2 border-black p-3 font-black text-xs uppercase">
                  Salt: {(productInfo.nutrientsData?.salt ?? 'N/A')}g
                </div>
                <div className="bg-white border-2 border-black p-3 font-black text-xs uppercase">
                  Sugar: {(productInfo.nutrientsData?.sugar ?? 'N/A')}g
                </div>
              </div>
            </motion.div>
          )}

          {/* Nutrient Levels */}
          {productInfo.nutrients && Object.keys(productInfo.nutrients).length > 0 && (
            <motion.div
              className="bg-yellow-300 border-4 border-black p-6 mb-4"
              style={{ boxShadow: '6px 6px 0px #000' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 1.8 }}
            >
              <h3 className="text-xl font-black uppercase mb-4 bg-white border-2 border-black inline-block px-3 py-1 rotate-1">
                <Candy className='inline-block' /> Nutrient Levels
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(productInfo.nutrients).map(([nutrient, level]) => (
                  level && (
                    <div key={nutrient} className={`border-2 border-black p-3 ${level === 'low' ? 'bg-green-400' : level === 'moderate' ? 'bg-yellow-400' : 'bg-red-600'}`}>
                      <div className="font-black text-xs uppercase">{nutrient}:</div>
                      <div className="font-black text-lg uppercase">{level}</div>
                    </div>
                  )
                ))}
              </div>
            </motion.div>
          )}

          {/* Data Contribution Form */}
          {!import.meta.env.VITE_OFF_USERNAME || !import.meta.env.VITE_OFF_PASSWORD ? null : (
            <DataContributionForm
              productData={productInfo}
              onContribute={handleContribute}
              contributionData={contributionData}
              onDataChange={setContributionData}
              loading={contributionLoading}
            />
          )}

          {/* Sustainable Alternatives */}
          {productInfo.alternatives && (
            <SustainableAlternativesDisplay
              alternatives={productInfo.alternatives}
            />
          )}
        </div>

        {/* Footer */}
        
      </motion.div>
      <BottomNav />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={handleCloseToast}
      />
    </div>
  );
}

export default ProductDetails;
