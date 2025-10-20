
import { useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './App.css'
import { getTransportationEmissions } from './services/carbonInterface.js'
import { getProductData } from './services/openFoodFacts.js'
import { enhanceOffDataWithBarcodeOrigin } from './services/barcodeLookup.js'

function App() {
  // Custom QR scanner styles applied after library initialization
  const applyScannerStyles = () => {
    setTimeout(() => {
      // Style the scanner container
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.style.backgroundColor = '#f0fdf4'; // Light green background
        readerElement.style.borderRadius = '1rem';
        readerElement.style.padding = '1rem';
        readerElement.style.width = '280px';
        readerElement.style.height = '350px';
        readerElement.style.display = 'flex';
        readerElement.style.flexDirection = 'column';
        readerElement.style.justifyContent = 'center';

        // Style the canvas/video elements
        const canvas = readerElement.querySelector('video, canvas');
        if (canvas) {
          canvas.style.borderRadius = '12px';
          canvas.style.border = '3px solid #16a34a'; // Green border
          canvas.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
          canvas.style.width = '240px';
          canvas.style.height = '240px';
          canvas.style.objectFit = 'cover';
        }

        // Style the selection box
        const scanRegion = readerElement.querySelector('#reader__scan_region');
        if (scanRegion) {
          scanRegion.style.borderRadius = '8px';
          scanRegion.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Light green overlay
          scanRegion.style.width = '200px';
          scanRegion.style.height = '200px';
        }

        // Style buttons
        const buttons = readerElement.querySelectorAll('button');
        buttons.forEach(button => {
          button.style.backgroundColor = '#16a34a';
          button.style.color = 'white';
          button.style.borderRadius = '8px';
          button.style.padding = '6px 12px';
          button.style.fontSize = '12px';
          button.style.fontWeight = '600';
          button.style.border = 'none';
          button.style.cursor = 'pointer';
          button.style.margin = '2px';
        });
      }
    }, 100);
  };
  const scannerRef = useRef(null);
  const isScanning = useRef(false);
  const [productInfo, setProductInfo] = useState(null);
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
      false // verbose
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
      // Use our service instead of direct fetch
      const productData = await getProductData(barcode);

      // Enhance with barcode origin detection if needed
      const enhancedData = enhanceOffDataWithBarcodeOrigin(productData);

      // Get transportation emissions for sustainability scoring
      let transportationEmissions = null;
      if (enhancedData.inferred_origin?.country !== 'Unknown') {
        try {
          transportationEmissions = await getTransportationEmissions(
            enhancedData.inferred_origin.country,
            'India', // Default destination for Indian users
            enhancedData.weight_kg || 1,
            'food'
          );
        } catch (transportError) {
          console.warn('Transportation calculation failed:', transportError);
          // Continue without transportation data
        }
      }

      setProductInfo({
        name: enhancedData.name,
        ingredients: enhancedData.ingredients,
        ecoScore: enhancedData.nutriscore_score,
        packaging: enhancedData.packaging,
        image: enhancedData.image,
        nutrients: enhancedData.nutrients,
        // Add transportation data
        transportation: transportationEmissions,
        origin: enhancedData.inferred_origin,
        completeness: enhancedData.completeness
      });

    } catch (err) {
      console.error('Product fetch error:', err);
      setError(`Failed to fetch product data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    console.log(`Code scanned = ${decodedText}`, decodedResult);

    stopScanning();

    // console.log(enhancedData)
    fetchProductInfo(decodedText);
  };

  const onScanFailure = () => {
    // console.warn(`Code scan error = ${error}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-700 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <span className="text-4xl">🌱</span>
            SustainScan
          </h1>
          <p className="text-green-100 opacity-90">Make conscious shopping choices</p>
        </div>

        {/* Scan Controls */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="flex gap-3 justify-center">
            <button
              onClick={startScanning}
              disabled={isScanning.current}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2 text-lg"
            >
              <span className="text-xl">📷</span>
              Scan Product
            </button>
            <button
              onClick={stopScanning}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2 text-lg"
            >
              <span className="text-xl">⏹️</span>
              Stop
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200">
          <div
            id="reader"
            className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white p-6 border-4 border-dashed border-green-300"
          ></div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>
            <div className="text-2xl animate-bounce">🔍</div>
            <p className="mt-4 text-gray-600 font-medium">Analyzing sustainability...</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-2xl text-center">
              <div className="text-4xl mb-2"></div>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Product Information */}
        {productInfo && (
          <div className="p-8">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{productInfo.name}</h2>

              {productInfo.image && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={productInfo.image}
                    alt={productInfo.name}
                    className="w-40 h-40 object-cover rounded-2xl shadow-xl border-4 border-white"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-3xl"></div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Eco-Score</div>
                    <div className={`text-xl font-bold ${productInfo.ecoScore ? 'text-green-600' : 'text-gray-500'}`}>
                      {productInfo.ecoScore || 'Not rated'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-3xl"></div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 font-medium mb-1">Packaging</div>
                    <div className="text-gray-800">{productInfo.packaging}</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl"></div>
                    <div className="text-sm text-gray-600 font-medium">Ingredients</div>
                  </div>
                  <div className="text-gray-700 leading-relaxed text-sm">{productInfo.ingredients}</div>
                </div>

                {/* Transportation Emissions */}
                {productInfo.transportation && (
                  <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                    <div className="text-3xl">🚚</div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 font-medium mb-1">
                        Transportation Impact {productInfo.transportation.confidence === 'estimated' ? '(Estimated)' : ''}
                      </div>
                      <div className={`text-lg font-bold ${
                        productInfo.transportation.co2_kg < 1 ? 'text-green-600' :
                        productInfo.transportation.co2_kg < 3 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {productInfo.transportation.co2_kg?.toFixed(2)} kg CO₂e
                      </div>
                      {productInfo.origin?.country !== 'Unknown' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {productInfo.origin.country} → Your location ({productInfo.transportation.distance_km}km)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Origin Information */}
                {productInfo.origin && productInfo.origin.country !== 'Unknown' && (
                  <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                    <div className="text-3xl">🌍</div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 font-medium mb-1">
                        Estimated Origin
                        {productInfo.origin.confidence === 'high' ? ' (High Confidence)' :
                         productInfo.origin.confidence === 'medium' ? ' (Medium Confidence)' :
                         ' (Estimated)'}
                      </div>
                      <div className="text-gray-800 text-sm">
                        {productInfo.origin.country}
                      </div>
                      {productInfo.origin.method && (
                        <div className="text-xs text-gray-500 mt-1">
                          Method: {productInfo.origin.method}
                          {productInfo.origin.prefix_used && ` (Prefix: ${productInfo.origin.prefix_used})`}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {productInfo.nutrients && Object.keys(productInfo.nutrients).length > 0 && (
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">📊</div>
                      <div className="text-sm text-gray-600 font-medium">Nutrient Levels</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(productInfo.nutrients).map(([nutrient, level]) => (
                        level && (
                          <div key={nutrient} className={`capitalize p-2 rounded-lg ${
                            level === 'low' ? 'bg-green-100 text-green-800' :
                            level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
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
  )
}

export default App
