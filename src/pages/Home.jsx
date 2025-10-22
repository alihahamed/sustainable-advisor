import { useRef, useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTransportationEmissions } from '../services/carbonInterface.js'
import { getProductData, findSustainableAlternatives } from '../services/openFoodFacts.js'
import { enhanceOffDataWithBarcodeOrigin } from '../services/barcodeLookup.js'
import { analyzePackagingImpact } from '../services/packagingImpact.js'

function RecentlyScannedProducts({ products, onSelectProduct }) {
  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center bg-yellow-300 border-4 border-black m-4" style={{ boxShadow: '8px 8px 0px #000' }}>
        <div className="text-6xl mb-4">📦</div>
        <p className="text-xl font-black uppercase tracking-tight">Scanned products will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cyan-400 border-4 border-black m-4" style={{ boxShadow: '12px 12px 0px #000' }}>
      <h2 className="text-3xl font-black uppercase mb-6 -rotate-1 bg-white border-4 border-black inline-block px-4 py-2" style={{ boxShadow: '6px 6px 0px #000' }}>
        Recently Scanned
      </h2>
      <div className="space-y-4 mt-6">
        {products.slice(0, 5).map((product, index) => (
          <div
            key={index}
            onClick={() => onSelectProduct(product)}
            className="bg-white p-5 border-4 border-black cursor-pointer hover:translate-x-1 hover:translate-y-1 transition-transform"
            style={{ boxShadow: '6px 6px 0px #000' }}
          >
            <div className="flex items-center gap-4">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover border-3 border-black flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg uppercase truncate">{product.name}</h3>
                <p className="font-bold text-sm mt-1">Nutri-Score: {product.nutriscore_score || 'N/A'}</p>
              </div>
              <span className="text-4xl font-black">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentProducts');
    if (saved) {
      try {
        setRecentProducts(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent products:', e);
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

      let alternatives = [];
      try {
        alternatives = await findSustainableAlternatives(enhancedData);
      } catch (altError) {
        console.warn('Failed to find alternatives:', altError);
      }

      const productInfo = {
        code: enhancedData.code,
        name: enhancedData.name,
        ingredients: enhancedData.ingredients,
        ecoScore: enhancedData.nutriscore_score,
        packaging: enhancedData.packaging,
        image: enhancedData.image,
        nutrients: enhancedData.nutrients,
        nutrientsData: enhancedData.nutrientsData,
        transportation: transportationEmissions,
        origin: enhancedData.inferred_origin,
        completeness: enhancedData.completeness,
        packaging_impact: packagingImpact,
        alternatives: alternatives
      };

      handleScanComplete(productInfo);

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
    fetchProductInfo(decodedText);
  };

  const onScanFailure = () => {
    // console.warn(`Code scan error = ${error}`);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-red-700 p-4 flex flex-col">
      {/* Header - Made Smaller */}
      <div className="bg-lime-300 border-4 border-black p-4 mb-6 -rotate-1" style={{ boxShadow: '8px 8px 0px #000' }}>
        <h1 className="text-3xl font-black uppercase text-center mb-1 tracking-tight rotate-1 flex items-center justify-center gap-2">
          <span className="text-3xl">🌱</span>
          SustainScan
        </h1>
        <p className="text-center text-sm font-black uppercase tracking-wide">Make conscious choices</p>
      </div>

      <div className="max-w-md mx-auto bg-white border-4 border-black rotate-1 flex-1 flex flex-col" style={{ boxShadow: '16px 16px 0px #000' }}>
        {/* Scan Controls */}
        <div className="p-6 bg-yellow-300 border-b-4 border-black">
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={startScanning}
              disabled={isScanning.current}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 border-4 border-black font-black uppercase text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
              style={{ boxShadow: '6px 6px 0px #000' }}
            >
              <span className="text-2xl">📷</span> Scan
            </button>
            <button
              onClick={stopScanning}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 border-4 border-black font-black uppercase text-lg tracking-tight transform hover:-translate-y-1 transition-transform"
              style={{ boxShadow: '6px 6px 0px #000' }}
            >
              <span className="text-2xl">⏹️</span> Stop
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-8 bg-blue-300 border-b-4 border-black">
          <div
            id="reader"
            className="w-full max-w-sm mx-auto bg-white border-4 border-black p-6"
            style={{ boxShadow: '8px 8px 0px #000' }}
          ></div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center bg-blue-300 border-b-4 border-black">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <div className="bg-black text-white px-6 py-3 border-4 border-black inline-block font-black uppercase text-xl mb-4" style={{ boxShadow: '6px 6px 0px #fff' }}>
              Analyzing...
            </div>
            <div className="w-full bg-white border-4 border-black h-8" style={{ boxShadow: '4px 4px 0px #000' }}>
              <div className="bg-black h-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 bg-red-300 border-b-4 border-black">
            <div className="bg-white border-4 border-black px-6 py-6 text-center" style={{ boxShadow: '8px 8px 0px #000' }}>
              <div className="text-6xl mb-4">⚠️</div>
              <p className="font-black uppercase text-lg">{error}</p>
            </div>
          </div>
        )}

        {/* Recently Scanned Products */}
        <div className="flex-1 overflow-y-auto">
          <RecentlyScannedProducts products={recentProducts} onSelectProduct={handleSelectProduct} />
        </div>

        {/* Bottom Navigation - Inside White Div */}
        <nav className="bg-black border-t-4 border-black mt-auto">
          <div className="flex justify-around items-center p-2">
            <button
              onClick={() => navigate('/')}
              className={`flex flex-col items-center justify-center px-4 py-2 border-2 border-black font-black uppercase text-xs transition-transform hover:-translate-y-0.5 ${
                isActive('/') ? 'bg-lime-300' : 'bg-white'
              }`}
              style={{ boxShadow: '3px 3px 0px #000' }}
            >
              <span className="text-lg mb-0.5">🏠</span>
              <span>Home</span>
            </button>

            <button
              onClick={() => navigate('/history')}
              className={`flex flex-col items-center justify-center px-4 py-2 border-2 border-black font-black uppercase text-xs transition-transform hover:-translate-y-0.5 ${
                isActive('/history') ? 'bg-cyan-400' : 'bg-white'
              }`}
              style={{ boxShadow: '3px 3px 0px #000' }}
            >
              <span className="text-lg mb-0.5">📋</span>
              <span>History</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center justify-center px-4 py-2 border-2 border-black font-black uppercase text-xs transition-transform hover:-translate-y-0.5 ${
                isActive('/profile') ? 'bg-yellow-300' : 'bg-white'
              }`}
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

export default Home;
