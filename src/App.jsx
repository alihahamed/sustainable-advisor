
import { useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './App.css'
import { getTransportationEmissions } from './services/carbonInterface.js'
import { getProductData } from './services/openFoodFacts.js'
import { enhanceOffDataWithBarcodeOrigin } from './services/barcodeLookup.js'
import { analyzePackagingImpact } from './services/packagingImpact.js'
import { contributeMissingData, assessDataCompleteness, validateContributionData } from './services/offContribute.js'

// DataContributionForm Component - Neo-Brutalism Style
// DataContributionForm Component - Refined Neo-Brutalism
function DataContributionForm({ productData, onContribute, contributionData, onDataChange, loading }) {
  const completeness = assessDataCompleteness(productData);
  const hasMissing = !completeness.packaging || !completeness.ingredients || !completeness.nutrients;

  if (!hasMissing) return null;

  return (
    <div className="bg-yellow-300 border-3 border-red-600 p-4 md:p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📝</span>
        <h3 className="text-lg md:text-xl font-black text-black">HELP COMPLETE THIS PRODUCT!</h3>
      </div>

      <p className="text-black text-xs md:text-sm font-bold mb-4">
        Missing information impacts our sustainability analysis. Your contributions make a difference!
      </p>

      <div className="space-y-3">
        {!completeness.packaging && (
          <div>
            <label className="block text-xs md:text-sm font-black text-black mb-2">
              📦 PACKAGING TYPE
            </label>
            <select
              className="w-full p-2 md:p-3 border-3 border-red-600 bg-white text-black font-bold text-sm"
              value={contributionData.packaging || ''}
              onChange={(e) => onDataChange({...contributionData, packaging: e.target.value})}
            >
              <option value="">Select packaging type...</option>
              <option value="cardboard box">Cardboard Box</option>
              <option value="plastic bottle">Plastic Bottle</option>
              <option value="glass jar">Glass Jar</option>
              <option value="metal can">Metal Can</option>
            </select>
          </div>
        )}

        {!completeness.ingredients && (
          <div>
            <label className="block text-xs md:text-sm font-black text-black mb-2">
              🥕 INGREDIENTS LIST
            </label>
            <textarea
              className="w-full p-2 md:p-3 border-3 border-red-600 bg-white text-black font-bold h-20 resize-none text-sm"
              placeholder="List all main ingredients..."
              value={contributionData.ingredients || ''}
              onChange={(e) => onDataChange({...contributionData, ingredients: e.target.value})}
            />
          </div>
        )}

        {Object.keys(contributionData).length > 0 && (
          <button
            onClick={() => onContribute(contributionData)}
            disabled={loading}
            className="w-full bg-lime-400 hover:bg-lime-500 disabled:bg-gray-400 text-black py-2 md:py-3 px-4 border-3 border-red-600 font-black transition-colors flex items-center justify-center gap-2 text-sm md:text-base shadow-md"
          >
            <span>🚀</span>
            {loading ? 'SUBMITTING...' : 'SHARE WITH DATABASE'}
          </button>
        )}
      </div>
    </div>
  );
}

// Main App Component - Refined Neo-Brutalism with Responsive Design
function App() {
  const applyScannerStyles = () => {
    setTimeout(() => {
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.style.backgroundColor = '#FFFF00';
        readerElement.style.borderRadius = '0px';
        readerElement.style.padding = '0.75rem';
        readerElement.style.width = '100%';
        readerElement.style.maxWidth = '280px';
        readerElement.style.height = 'auto';
        readerElement.style.display = 'flex';
        readerElement.style.flexDirection = 'column';
        readerElement.style.justifyContent = 'center';
        readerElement.style.border = '3px solid #DC2626';
        readerElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        const canvas = readerElement.querySelector('video, canvas');
        if (canvas) {
          canvas.style.borderRadius = '0px';
          canvas.style.border = '3px solid #FF00FF';
          canvas.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.objectFit = 'cover';
        }

        const buttons = readerElement.querySelectorAll('button');
        buttons.forEach(button => {
          button.style.backgroundColor = '#FF00FF';
          button.style.color = '#000000';
          button.style.borderRadius = '0px';
          button.style.padding = '6px 12px';
          button.style.fontSize = '11px';
          button.style.fontWeight = '900';
          button.style.border = '3px solid #DC2626';
          button.style.cursor = 'pointer';
          button.style.margin = '3px';
          button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
      }
    }, 100);
  };

  const scannerRef = useRef(null);
  const isScanning = useRef(false);
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contributionData, setContributionData] = useState({});
  const [contributionLoading, setContributionLoading] = useState(false);

  const startScanning = () => {
    if (isScanning.current) return;
    isScanning.current = true;
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { qrbox: { width: 200, height: 200 }, fps: 5 },
      false
    );
    scannerRef.current.render(onScanSuccess, onScanFailure);
    applyScannerStyles();
  };

  const stopScanning = () => {
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
      setProductInfo({
        code: enhancedData.code,
        name: enhancedData.name,
        ingredients: enhancedData.ingredients,
        ecoScore: enhancedData.nutriscore_score,
        packaging: enhancedData.packaging,
        image: enhancedData.image,
        nutrients: enhancedData.nutrients,
        transportation: transportationEmissions,
        origin: enhancedData.inferred_origin,
        completeness: enhancedData.completeness,
        packaging_impact: packagingImpact
      });
    } catch (err) {
      console.error('Product fetch error:', err);
      setError(`Failed to fetch product data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    stopScanning();
    fetchProductInfo(decodedText);
  };

  const onScanFailure = () => {};

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* <CHANGE> Header repositioned to top left, made small and compact */}
        <div className="flex items-center gap-2 mb-6 md:mb-8">
          <span className="text-2xl md:text-3xl">🌱</span>
          <h1 className="text-xl md:text-2xl font-black text-white">SUSTAINSCAN</h1>
        </div>

        {/* <CHANGE> Main container with responsive layout */}
        <div className="bg-white border-3 border-red-600 shadow-xl">
          {/* <CHANGE> Redesigned scanning section with better mobile layout */}
          <div className="p-4 md:p-6 bg-cyan-300 border-b-3 border-red-600">
            <h2 className="text-sm md:text-base font-black text-black mb-4 flex items-center gap-2">
              <span>📷</span>
              SCAN BARCODE
            </h2>
            
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <button
                onClick={startScanning}
                disabled={isScanning.current}
                className="flex-1 bg-lime-400 hover:bg-lime-500 disabled:bg-gray-400 text-black px-4 md:px-6 py-3 border-3 border-red-600 font-black transition-all text-sm md:text-base shadow-md"
              >
                START SCAN
              </button>
              <button
                onClick={stopScanning}
                className="flex-1 bg-pink-400 hover:bg-pink-500 text-black px-4 md:px-6 py-3 border-3 border-red-600 font-black text-sm md:text-base shadow-md"
              >
                STOP
              </button>
            </div>

            {/* <CHANGE> Scanner container with responsive sizing */}
            <div className="flex justify-center bg-yellow-300 p-3 md:p-4 border-3 border-red-600 shadow-md">
              <div id="reader" className="w-full max-w-xs"></div>
            </div>
          </div>

          {/* <CHANGE> Loading state with consistent spacing */}
          {loading && (
            <div className="p-6 md:p-8 text-center bg-orange-300 border-b-3 border-red-600">
              <div className="animate-spin rounded-none h-12 w-12 border-3 border-red-600 border-t-transparent mx-auto mb-4"></div>
              <div className="text-4xl animate-bounce mb-3">🔍</div>
              <p className="text-black font-black text-base md:text-lg mb-3">ANALYZING SUSTAINABILITY...</p>
              <div className="w-full bg-black h-2 border-2 border-red-600">
                <div className="bg-lime-400 h-2 animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* <CHANGE> Error state with consistent styling */}
          {error && (
            <div className="p-4 md:p-6 bg-red-400 border-b-3 border-red-600">
              <div className="bg-white border-3 border-red-600 text-black px-4 md:px-6 py-3 text-center shadow-md">
                <div className="text-3xl mb-2">❌</div>
                <p className="font-black text-sm md:text-base">{error}</p>
              </div>
            </div>
          )}

          {/* <CHANGE> Product information with consistent spacing and dark blue accents */}
          {productInfo && (
            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-blue-900 border-3 border-red-600 p-4 md:p-6 shadow-lg">
                <h2 className="text-xl md:text-2xl font-black text-white mb-4 text-center">{productInfo.name}</h2>

                {productInfo.image && (
                  <div className="mb-6 flex justify-center">
                    <img
                      src={productInfo.image || "/placeholder.svg"}
                      alt={productInfo.name}
                      className="w-32 md:w-40 h-32 md:h-40 object-cover border-3 border-red-600 shadow-md"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {/* <CHANGE> Eco-Score card with consistent styling */}
                  <div className="flex items-center gap-3 bg-cyan-300 p-3 md:p-4 border-3 border-red-600 shadow-md">
                    <div className="text-2xl md:text-3xl">🌍</div>
                    <div>
                      <div className="text-xs md:text-sm text-black font-black">ECO-SCORE</div>
                      <div className="text-xl md:text-2xl font-black text-black">
                        {productInfo.ecoScore || 'NOT RATED'}
                      </div>
                    </div>
                  </div>

                  {/* <CHANGE> Packaging card with consistent spacing */}
                  {productInfo.packaging_impact && productInfo.packaging_impact.impact !== 'unknown' && (
                    <div className="flex items-center gap-3 bg-lime-300 p-3 md:p-4 border-3 border-red-600 shadow-md">
                      <div className="text-2xl md:text-3xl">♻️</div>
                      <div className="flex-1">
                        <div className="text-xs md:text-sm text-black font-black mb-1">
                          PACKAGING SUSTAINABILITY
                        </div>
                        <div className="text-base md:text-lg font-black text-black">
                          {productInfo.packaging_impact.recyclability_percent}% RECYCLABLE
                        </div>
                        <div className="text-xs text-black font-bold mt-1">
                          CO2: {productInfo.packaging_impact.co2_kg_per_kg}kg/kg
                        </div>
                      </div>
                    </div>
                  )}

                  {/* <CHANGE> Ingredients card */}
                  <div className="bg-yellow-300 p-3 md:p-4 border-3 border-red-600 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl md:text-3xl">🥕</div>
                      <div className="text-xs md:text-sm text-black font-black">INGREDIENTS</div>
                    </div>
                    <div className="text-black leading-relaxed text-xs md:text-sm font-bold">{productInfo.ingredients}</div>
                  </div>

                  {/* <CHANGE> Transportation card */}
                  {productInfo.transportation && (
                    <div className="flex items-center gap-3 bg-pink-300 p-3 md:p-4 border-3 border-red-600 shadow-md">
                      <div className="text-2xl md:text-3xl">🚚</div>
                      <div className="flex-1">
                        <div className="text-xs md:text-sm text-black font-black mb-1">
                          TRANSPORTATION IMPACT
                        </div>
                        <div className="text-base md:text-lg font-black text-black">
                          {productInfo.transportation.co2_kg?.toFixed(2)} kg CO₂e
                        </div>
                        <div className="text-xs text-black font-bold mt-1">
                          {productInfo.origin?.country || 'Unknown'} → India ({productInfo.transportation.distance_km}km)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* <CHANGE> Origin card */}
                  {productInfo.origin && productInfo.origin.country !== 'Unknown' && (
                    <div className="flex items-center gap-3 bg-orange-300 p-3 md:p-4 border-3 border-red-600 shadow-md">
                      <div className="text-2xl md:text-3xl">📍</div>
                      <div className="flex-1">
                        <div className="text-xs md:text-sm text-black font-black mb-1">ORIGIN</div>
                        <div className="text-black font-black text-sm">
                          {productInfo.origin.country}
                        </div>
                        <div className="text-xs text-black font-bold mt-1">
                          Confidence: {productInfo.origin.confidence}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* <CHANGE> Data Contribution Form */}
                  {!import.meta.env.VITE_OFF_USERNAME || !import.meta.env.VITE_OFF_PASSWORD ? (
                    <div className="bg-blue-400 border-3 border-red-600 p-3 md:p-4 shadow-md">
                      <div className="text-xs md:text-sm text-black font-black">
                        💡 Configure Open Food Facts credentials to contribute data!
                      </div>
                    </div>
                  ) : (
                    <DataContributionForm
                      productData={productInfo}
                      onContribute={async (data) => {
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
                      }}
                      contributionData={contributionData}
                      onDataChange={(data) => setContributionData(data)}
                      loading={contributionLoading}
                    />
                  )}

                  {/* <CHANGE> Nutrient Levels card */}
                  {productInfo.nutrients && Object.keys(productInfo.nutrients).length > 0 && (
                    <div className="bg-red-400 p-3 md:p-4 border-3 border-red-600 shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-2xl md:text-3xl">📊</div>
                        <div className="text-xs md:text-sm text-black font-black">NUTRIENT LEVELS</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(productInfo.nutrients).map(([nutrient, level]) => (
                          level && (
                            <div key={nutrient} className="capitalize p-2 bg-white border-2 border-red-600 text-black font-black">
                              {nutrient}: {level}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
 
