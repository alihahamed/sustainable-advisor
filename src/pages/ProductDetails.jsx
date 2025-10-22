import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { contributeMissingData, assessDataCompleteness, validateContributionData } from '../services/offContribute.js'

// Copy the SustainableAlternativesDisplay and DataContributionForm from App.jsx
function SustainableAlternativesDisplay({ alternatives }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="p-6 bg-lime-400 border-4 border-black m-4" style={{ boxShadow: '12px 12px 0px #000' }}>
      <h2 className="text-3xl font-black uppercase mb-6 -rotate-1 bg-white border-4 border-black inline-block px-4 py-2 -rotate-2" style={{ boxShadow: '6px 6px 0px #000' }}>
        🌟 Alternatives
      </h2>

      <div className="space-y-6 mt-6">
        {alternatives.map((alternative) => (
          <div
            key={alternative.code}
            className="bg-white p-4 border-4 border-black"
            style={{ boxShadow: '6px 6px 0px #000' }}
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
                      <div className="font-black text-sm uppercase mb-1 text-cyan-800">📦 Packaging</div>
                      <div className="font-bold text-sm">{alternative.packaging}</div>
                    </div>
                  )}

                  {/* Nutrients - Top Right */}
                  {alternative.nutrients && alternative.nutrients.length > 0 && (
                    <div className="bg-purple-100 border-2 border-black p-3">
                      <div className="font-black text-sm uppercase mb-1 text-purple-800">🥕 Nutrients</div>
                      <div className="font-bold text-sm">
                        {alternative.nutrients.slice(0, 4).join(', ')}{alternative.nutrients.length > 4 ? '...' : ''}
                      </div>
                    </div>
                  )}

                  {/* Ingredients - Bottom Full Width */}
                  {alternative.ingredients && alternative.ingredients.length > 0 && (
                    <div className="col-span-2 bg-green-100 border-2 border-black p-3">
                      <div className="font-black text-sm uppercase mb-1 text-green-800">🍎 Ingredients</div>
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
          </div>
        ))}
      </div>
    </div>
  );
}
function DataContributionForm({ productData, onContribute, contributionData, onDataChange, loading }) {
  const completeness = assessDataCompleteness(productData);
  const hasMissing = !completeness.packaging || !completeness.ingredients || !completeness.nutrients;

  if (!hasMissing) return null;

  return (
    <div className="bg-orange-400 border-4 border-black p-6 m-4 -rotate-1" style={{ boxShadow: '8px 8px 0px #000' }}>
      <h2 className="text-3xl font-black uppercase mb-6 bg-white border-4 border-black inline-block px-4 py-2 rotate-1" style={{ boxShadow: '6px 6px 0px #000' }}>
        📝 Contribute Data
      </h2>

      <p className="mb-6 font-black text-sm uppercase bg-white border-2 border-black p-3 -rotate-1">
        Help Sustainability Analysis!
      </p>

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
    </div>
  );
}

function ProductDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const productInfo = state?.productInfo;
  const [contributionData, setContributionData] = useState({});
  const [contributionLoading, setContributionLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-red-700 p-4 flex flex-col">
      {/* Header */}
      <div className="bg-lime-300 border-4 border-black p-4 mb-6 -rotate-1" style={{ boxShadow: '8px 8px 0px #000' }}>
        <h1 className="text-3xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-3xl">🏷️</span>
          Product Details
        </h1>
        <p className="text-center text-sm font-black uppercase tracking-wide">Sustainability Analysis</p>
      </div>

      <div className="max-w-md mx-auto bg-white border-4 border-black rotate-1 flex-1 flex flex-col" style={{ boxShadow: '16px 16px 0px #000' }}>

        {/* Back Button Section */}
        <div className="p-6 bg-yellow-300 border-b-4 border-black">
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-8 py-4 border-4 border-black font-black uppercase text-lg tracking-tight"
            style={{ boxShadow: '6px 6px 0px #000' }}
          >
            ← Back to Scanner
          </button>
        </div>

        {/* Product Info */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Product Image */}
          {productInfo.image && (
            <div className="mb-6 text-center">
              <img
                src={productInfo.image}
                alt={productInfo.name}
                className="w-48 h-48 object-cover border-4 border-black mx-auto -rotate-2"
                style={{ border: '4px solid #000', boxShadow: '8px 8px 0px #000' }}
              />
            </div>
          )}

          {/* Product Title */}
          <div className="bg-cyan-400 border-4 border-black p-4 mb-6 -rotate-1" style={{ boxShadow: '6px 6px 0px #000' }}>
            <h2 className="text-2xl font-black uppercase text-center tracking-tight">{productInfo.name}</h2>
          </div>

          {/* Eco-Score */}
          <div className="bg-yellow-300 border-4 border-black p-6 mb-4" style={{ boxShadow: '6px 6px 0px #000' }}>
            <div className="flex items-center justify-center gap-4">
              <span className="text-6xl">🌱</span>
              <div className="text-center">
                <div className="text-sm font-black uppercase mb-1">Eco-Score</div>
                <div className={`text-4xl font-black ${productInfo.ecoScore ? 'text-black' : 'text-gray-500'}`}>
                  {productInfo.ecoScore || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Masonry Layout for Packaging, Transport, Origin */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
            {/* Packaging Sustainability */}
            {productInfo.packaging_impact && productInfo.packaging_impact.impact !== 'unknown' && (
              <div className="bg-lime-400 border-4 border-black p-3 col-span-2 md:col-span-1" style={{ boxShadow: '6px 6px 0px #000', gridRow: 'span 2' }}>
                <h3 className="text-base font-black uppercase mb-2 bg-white border-2 border-black inline-block px-2 py-1 -rotate-2">
                  📦 Packaging
                </h3>
                <div className={`text-3xl md:text-4xl mb-1 font-black ${productInfo.packaging_impact.color === 'green' ? 'text-green-600' : productInfo.packaging_impact.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {productInfo.packaging_impact.recyclability_percent}%
                </div>
                <div className="font-black text-xs uppercase">Reusable</div>
              </div>
            )}

            {/* Transportation */}
            {productInfo.transportation && (
              <div className="bg-cyan-400 border-4 border-black p-3 col-span-1 md:col-span-1" style={{ boxShadow: '6px 6px 0px #000' }}>
                <h3 className="text-sm font-black uppercase mb-2 bg-white border-2 border-black inline-block px-1 py-1 rotate-1">
                  🚢 Transport CO₂
                </h3>
                <div className={`text-2xl md:text-4xl mb-1 font-black ${productInfo.transportation.co2_kg < 1 ? 'text-green-600' : productInfo.transportation.co2_kg < 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {productInfo.transportation.co2_kg?.toFixed(1)}kg
                </div>
                <div className="font-black text-xs uppercase">
                  {productInfo.transportation.transport_method?.toUpperCase()}
                </div>
              </div>
            )}

            {/* Origin */}
            <div className="bg-yellow-300 border-4 border-black p-3 col-span-1 md:col-span-1" style={{ boxShadow: '6px 6px 0px #000' }}>
              <h3 className="text-sm font-black uppercase mb-2 bg-white border-2 border-black inline-block px-1 py-1 -rotate-1">
                🗺️ Origin
              </h3>
              <div className="text-2xl md:text-3xl font-black uppercase text-center leading-tight">
                {productInfo.origin?.country === 'Unknown' || !productInfo.origin?.country ? 'UNKNOWN' : productInfo.origin.country}
              </div>
              <div className="text-xs font-bold uppercase text-center mt-1 text-gray-600">
                {productInfo.origin?.confidence || 'Estimated'}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white border-4 border-black p-6 mb-4" style={{ boxShadow: '6px 6px 0px #000' }}>
            <h3 className="text-xl font-black uppercase mb-4 bg-cyan-400 border-2 border-black inline-block px-3 py-1">
              🥕 Ingredients
            </h3>
            <p className="text-sm leading-relaxed">{productInfo.ingredients}</p>
          </div>

          {/* Nutrition Facts */}
          {productInfo.nutrientsData && (
            <div className="bg-lime-400 border-4 border-black p-6 mb-4" style={{ boxShadow: '6px 6px 0px #000' }}>
              <h3 className="text-xl font-black uppercase mb-4 bg-white border-2 border-black inline-block px-3 py-1 -rotate-2">
                📊 Nutrition (100g)
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
              </div>
            </div>
          )}

          {/* Nutrient Levels */}
          {productInfo.nutrients && Object.keys(productInfo.nutrients).length > 0 && (
            <div className="bg-yellow-300 border-4 border-black p-6 mb-4" style={{ boxShadow: '6px 6px 0px #000' }}>
              <h3 className="text-xl font-black uppercase mb-4 bg-white border-2 border-black inline-block px-3 py-1 rotate-1">
                📈 Nutrient Levels
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(productInfo.nutrients).map(([nutrient, level]) => (
                  level && (
                    <div key={nutrient} className={`border-2 border-black p-3 ${level === 'low' ? 'bg-green-400' : level === 'moderate' ? 'bg-yellow-400' : 'bg-red-400'}`}>
                      <div className="font-black text-xs uppercase">{nutrient}:</div>
                      <div className="font-black text-lg uppercase">{level}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
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
        <nav className="bg-black border-t-4 border-black mt-auto">
          <div className="flex justify-around items-center p-2">
            <button
              onClick={() => navigate('/')}
              className="flex flex-col items-center justify-center px-4 py-2 border-2 border-black font-black uppercase text-xs transition-transform hover:-translate-y-0.5 bg-lime-300"
              style={{ boxShadow: '3px 3px 0px #000' }}
            >
              <span className="text-lg mb-0.5">🏠</span>
              <span>Home</span>
            </button>

            <button
              onClick={() => navigate('/history')}
              className={`flex flex-col items-center justify-center px-4 py-2 border-2 border-black font-black uppercase text-xs transition-transform hover:-translate-y-0.5 bg-white`}
              style={{ boxShadow: '3px 3px 0px #000' }}
            >
              <span className="text-lg mb-0.5">📋</span>
              <span>History</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center justify-center px-4 py-2 border-2 border-black font-black uppercase text-xs transition-transform hover:-translate-y-0.5 bg-white`}
              style={{ boxShadow: '3px 3px 0px #000' }}
            >
              <span className="text-lg mb-0.5">👤</span>
              <span>Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default ProductDetails;
