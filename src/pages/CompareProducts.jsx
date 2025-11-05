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

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Bus, Recycle, Apple, Leaf, Plus } from 'lucide-react';
import BottomNav from '../components/bottomNav.jsx';
import { getFavourites } from '../services/favouritesService.js';

function CompareProducts() {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState([null, null]);
  const [comparisonData, setComparisonData] = useState(null);
  const [winner, setWinner] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    loadRecentProducts();
  }, []);

  useEffect(() => {
    if (selectedProducts[0] && selectedProducts[1]) {
      performComparison();
    } else {
      setComparisonData(null);
      setWinner(null);
    }
  }, [selectedProducts]);

  const loadRecentProducts = () => {
    // Get products from favourites as source of recent products
    const favourites = getFavourites();
    // Convert favourites object to array
    const favouritesArray = Object.values(favourites || {});
    console.log('FAVOURITES DEBUG:', favouritesArray.slice(0, 2)); // Debug first 2 items

    // Filter out old favourites that lack comparison data
    const productsWithData = favouritesArray.filter(product =>
      product.transportation?.co2_kg ||
      product.packaging_impact?.recyclability_percent ||
      product.nutrients
    );

    if (productsWithData.length < favouritesArray.length) {
      console.log('OLD FAVOURITES FOUND - Need to re-favourite products for comparison!');
    }

    // Also get from recently scanned (you might need to store these)
    const recentScanned = JSON.parse(localStorage.getItem('recentScanned') || '[]');

    // Combine and deduplicate
    const allProducts = [...productsWithData, ...recentScanned];
    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex(p => p.code === product.code)
    ).slice(-20); // Last 20 products

    setRecentProducts(uniqueProducts);
  };

  const performComparison = () => {
    const [product1, product2] = selectedProducts;
    if (!product1 || !product2) return;

    const ecoScore1 = calculateEcoScore(product1) || 50; // Default to 50 if no data
    const ecoScore2 = calculateEcoScore(product2) || 50; // Default to 50 if no data

    // Transport CO2 comparison
    const co2_1 = product1.transportation?.co2_kg || 0;
    const co2_2 = product2.transportation?.co2_kg || 0;

    // Recyclability comparison
    const recycle_1 = product1.packaging_impact?.recyclability_percent || 0;
    const recycle_2 = product2.packaging_impact?.recyclability_percent || 0;

    // Nutrient warnings comparison
    const nutrientWarnings1 = countHighNutrientWarnings(product1.nutrients);
    const nutrientWarnings2 = countHighNutrientWarnings(product2.nutrients);

    // Scoring system
    let score1 = 0;
    let score2 = 0;

    // Eco score comparison (higher is better)
    if (ecoScore1 > ecoScore2) score1 += 3;
    else if (ecoScore2 > ecoScore1) score2 += 3;

    // CO2 comparison (lower is better)
    if (co2_1 < co2_2) score1 += 2;
    else if (co2_2 < co2_1) score2 += 2;

    // Recyclability comparison (higher is better)
    if (recycle_1 > recycle_2) score1 += 2;
    else if (recycle_2 > recycle_1) score2 += 2;

    // Nutrient warnings (fewer is better)
    if (nutrientWarnings1 < nutrientWarnings2) score1 += 1;
    else if (nutrientWarnings2 < nutrientWarnings1) score2 += 1;

    const winnerProduct = score1 > score2 ? product1 : (score2 > score1 ? product2 : null);
    setWinner(winnerProduct);

    setComparisonData({
      score1,
      score2,
      ecoScore1,
      ecoScore2,
      co2_1,
      co2_2,
      recycle_1,
      recycle_2,
      nutrientWarnings1,
      nutrientWarnings2
    });
  };

  const countHighNutrientWarnings = (nutrients) => {
    if (!nutrients) return 0;
    const highNutrients = ['fat', 'sugar', 'salt', 'saturated-fat'];
    return highNutrients.filter(nutrient => nutrients[nutrient] === 'high').length;
  };

  const selectProduct = (product, index) => {
    const newSelected = [...selectedProducts];
    newSelected[index] = product;
    setSelectedProducts(newSelected);
  };

  const deselectProduct = (index) => {
    const newSelected = [...selectedProducts];
    newSelected[index] = null;
    setSelectedProducts(newSelected);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-orange-600 p-2 sm:p-4 flex flex-col pb-32">
      {/* Header */}
      <motion.div
        className="bg-green-500 border-2 sm:border-4 border-black p-2 sm:p-4 mb-4 sm:mb-6 -rotate-1"
        style={{ boxShadow: '4px 4px 0px #000' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          {/* <button
            onClick={() => navigate('/')}
            className="bg-white border-2 border-black p-2 -rotate-1 flex-shrink-0"
          >
            <ArrowLeft size={24} />
          </button> */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight rotate-1 inline-flex items-center justify-center gap-2">
              <span className=""><Trophy size={32} className='sm:w-10 sm:h-10 inline-block' /></span>
              Compare Products
            </h1>
            <p className="text-center text-xs sm:text-sm font-black uppercase tracking-wide">Find the better choice</p>
          </div>
          <div className="w-12"></div>
        </div>
      </motion.div>

      <motion.div
        className="bg-white border-2 sm:border-4 border-black  flex-1 flex flex-col"
        style={{ boxShadow: '8px 6px 0px #000' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        {/* Winner Announcement */}
        {winner && comparisonData && (
          <motion.div
            className="p-3 sm:p-4 bg-yellow-300 border-b-2 sm:border-b-4 border-black text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Trophy size={28} className="sm:w-8 sm:h-8 mx-auto mb-2 text-yellow-600" />
            <h2 className="font-black text-lg sm:text-xl uppercase mb-1">Better Choice:</h2>
            <p className="font-black text-xl sm:text-2xl text-red-600">{winner.name}</p>
            <p className="text-xs sm:text-sm">Won {Math.max(comparisonData.score1, comparisonData.score2)} out of 8 points</p>
          </motion.div>
        )}

        {selectedProducts[0] && selectedProducts[1] && comparisonData ? (
          /* Comparison View */
          <div className="p-3 sm:p-4">
            {/* Side-by-side Product Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Product 1 Card */}
              <motion.div
                className={`bg-cyan-400 border-2 sm:border-4 border-black p-3 sm:p-4 ${winner === selectedProducts[0] ? 'bg-green-200' : ''}`}
                style={{ boxShadow: '4px 4px 0px #000' }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <img
                  src={selectedProducts[0].image}
                  alt={selectedProducts[0].name}
                  className="w-full h-20 sm:h-24 object-cover border-2 sm:border-3 border-black mb-3"
                />
                <h3 className="font-black text-xs sm:text-sm uppercase mb-2 text-center">{selectedProducts[0].name}</h3>

                {/* Eco Score */}
                <div className="bg-white border-2 sm:border-3 border-black p-2 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Leaf size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">Eco Score</span>
                  </div>
                  <div className="font-black text-lg sm:text-xl text-center">{comparisonData.ecoScore1 || '0'}</div>
                </div>

                {/* Transport CO2 */}
                <div className="bg-white border-2 sm:border-3 border-black p-2 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Bus size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">CO₂</span>
                  </div>
                  <div className="font-black text-base sm:text-lg text-center">{comparisonData.co2_1.toFixed(2)}kg</div>
                </div>

                {/* Recyclability */}
                <div className="bg-white border-2 sm:border-3 border-black p-2 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Recycle size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">Recycle</span>
                  </div>
                  <div className="font-black text-base sm:text-lg text-center">{comparisonData.recycle_1}%</div>
                </div>

                {/* Nutrients */}
                <div className="bg-white border-2 sm:border-3 border-black p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Apple size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">Warnings</span>
                  </div>
                  <div className="font-black text-base sm:text-lg text-center">{comparisonData.nutrientWarnings1}</div>
                </div>
              </motion.div>

              {/* Product 2 Card */}
              <motion.div
                className={`bg-cyan-400 border-2 sm:border-4 border-black p-3 sm:p-4 ${winner === selectedProducts[1] ? 'bg-green-200' : ''}`}
                style={{ boxShadow: '4px 4px 0px #000' }}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <img
                  src={selectedProducts[1].image}
                  alt={selectedProducts[1].name}
                  className="w-full h-20 sm:h-24 object-cover border-2 sm:border-3 border-black mb-3"
                />
                <h3 className="font-black text-xs sm:text-sm uppercase mb-2 text-center">{selectedProducts[1].name}</h3>

                {/* Eco Score */}
                <div className="bg-white border-2 sm:border-3 border-black p-2 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Leaf size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">Eco Score</span>
                  </div>
                  <div className="font-black text-lg sm:text-xl text-center">{comparisonData.ecoScore2 || '0'}</div>
                </div>

                {/* Transport CO2 */}
                <div className="bg-white border-2 sm:border-3 border-black p-2 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Bus size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">CO₂</span>
                  </div>
                  <div className="font-black text-base sm:text-lg text-center">{comparisonData.co2_2.toFixed(2)}kg</div>
                </div>

                {/* Recyclability */}
                <div className="bg-white border-2 sm:border-3 border-black p-2 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Recycle size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">Recycle</span>
                  </div>
                  <div className="font-black text-base sm:text-lg text-center">{comparisonData.recycle_2}%</div>
                </div>

                {/* Nutrients */}
                <div className="bg-white border-2 sm:border-3 border-black p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Apple size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-black text-xs uppercase">Warnings</span>
                  </div>
                  <div className="font-black text-base sm:text-lg text-center">{comparisonData.nutrientWarnings2}</div>
                </div>
              </motion.div>
            </div>

            {/* Reset Button */}
            <motion.button
              onClick={() => setSelectedProducts([null, null])}
              className="w-full bg-red-500 text-white py-2 sm:py-3 px-4 sm:px-6 border-2 sm:border-4 border-black font-black uppercase text-sm sm:text-lg"
              style={{ boxShadow: '4px 4px 0px #000' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              🔄 Reset
            </motion.button>
          </div>
        ) : (
          /* Selection View */
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {/* <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4 text-center">Select Products to Compare</h2> */}

            {/* Selection Cards */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {[0, 1].map((index) => (
                <motion.div
                  key={index}
                  className="bg-blue-400 border-2 sm:border-4 border-black p-3 sm:p-4"
                  style={{ boxShadow: '4px 4px 0px #000' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (index * 0.1) }}
                >
                  {!selectedProducts[index] ? (
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl mb-2"><Plus size={32} className="sm:w-10 sm:h-10" /></div>
                      <p className="font-black uppercase text-sm sm:text-base">Select Product {index + 1}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedProducts[index].image}
                        alt={selectedProducts[index].name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover border-2 sm:border-3 border-black"
                      />
                      <div className="flex-1">
                        <h3 className="font-black text-xs sm:text-sm uppercase">{selectedProducts[index].name}</h3>
                        <p className="text-xs">Eco Score: {calculateEcoScore(selectedProducts[index]) || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => deselectProduct(index)}
                        className="bg-red-500 text-white px-2 py-1 border-2 border-black text-xs sm:text-sm font-black"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Recent Products Grid */}
            <h3 className="text-lg sm:text-xl font-black uppercase mb-3 sm:mb-4 text-center">Recent Products</h3>
            {recentProducts.length === 0 ? (
              <motion.div
                className="bg-yellow-300 border-2 sm:border-4 border-black p-3 sm:p-4 text-center"
                style={{ boxShadow: '4px 4px 0px #000' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="font-black uppercase text-sm sm:text-base">No products found</p>
                <p className="text-xs sm:text-sm">Scan some products or add to favourites first!</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-3 bg-black text-white px-4 sm:px-6 py-2 border-2 border-black font-black uppercase text-sm sm:text-base"
                >
                  Start Scanning
                </button>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 gap-3 sm:gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {recentProducts.map((product, index) => (
                  <motion.div
                    key={product.code}
                    className="bg-yellow-300 border-2 sm:border-4 border-black p-3 sm:p-4"
                    style={{ boxShadow: '4px 4px 0px #000' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + (index * 0.05) }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover border-2 sm:border-3 border-black"
                      />
                      <div className="flex-1">
                        <h3 className="font-black text-xs sm:text-sm uppercase">{product.name}</h3>
                        <p className="text-xs">Eco Score: {calculateEcoScore(product) || 'N/A'}</p>
                      </div>
                      <div className="flex gap-2">
                        {[0, 1].map((slotIndex) => (
                          selectedProducts[slotIndex]?.code !== product.code && (
                            <button
                              key={slotIndex}
                              onClick={() => selectProduct(product, slotIndex)}
                              disabled={selectedProducts[slotIndex]?.code === product.code}
                              className="bg-black text-white px-2 sm:px-3 py-1 border-2 border-black text-xs font-black uppercase disabled:opacity-50"
                            >
                              {slotIndex + 1}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      <BottomNav />
    </div>
  );
}

export default CompareProducts;
