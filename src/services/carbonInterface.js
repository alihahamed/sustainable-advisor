// Climatiq API service for transportation emissions

const CLIMATIQ_API_KEY = import.meta.env.VITE_CLIMATIQ_API_KEY
const CLIMATIQ_BASE_URL = 'https://api.climatiq.io';

export async function getTransportationEmissions(origin, destination, weightKg = 1, productType = 'food') { // eslint-disable-line no-unused-vars
  try {
    if (!CLIMATIQ_API_KEY) {
      console.warn('No Climatiq API key found, using fallback calculations');
      return calculateProductPortionEmission(origin, destination, weightKg);
    }

    const distance = getApproximateDistance(origin, destination);
    const activityId = selectActivityId(origin, destination, distance);

    // Use realistic shipment size (not 10 tonnes!)
    const shipmentTons = getShipmentSize(distance);
    const shipmentCo2 = await getShipmentEmission(activityId, shipmentTons, distance);

    // Calculate product's portion of the shipment
    const productTons = weightKg / 1000; // Convert to tonnes
    const productPortion = Math.min(productTons / shipmentTons, 0.05); // Max 5% of shipment
    const productCo2 = shipmentCo2 * productPortion;

    return {
      co2_kg: Math.max(productCo2, 0.001), // At least 1g CO2
      distance_km: distance,
      transport_method: getTransportMethodFromResponse(activityId),
      origin: origin,
      destination: destination,
      confidence: 'medium',
      source: 'Climatiq API (per-product allocation)',
      shipment_size_tons: shipmentTons,
      product_portion_percent: (productPortion * 100).toFixed(6)
    };

  } catch {
    console.error('Climatiq API Error occurred');

    // Return fallback data when API fails
    return calculateProductPortionEmission(origin, destination, weightKg);
  }
}

// Get appropriate shipment size based on distance and route
function getShipmentSize(distanceKm) {
  if (distanceKm > 5000) return 24000; // Sea container: 24,000 tonnes
  if (distanceKm > 1500) return 20000; // Road/train container: 20,000 tonnes
  return 18000; // Local truck: 18,000 tonnes
}

// Get total shipment emission (standalone API call)
async function getShipmentEmission(activityId, shipmentTons, distance) {
  const response = await fetch(`${CLIMATIQ_BASE_URL}/estimate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLIMATIQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      emission_factor: {
        activity_id: activityId,
        data_version: "^26"
      },
      parameters: {
        weight: shipmentTons,
        weight_unit: "t",
        distance: distance,
        distance_unit: "km"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Shipment API failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(data)
  return data.co2e; // Total shipment CO2
  
}

// Fallback calculations when API is unavailable - improved for realistic values
function calculateFallbackEmission(origin, destination, weightKg) {
  const distance = getApproximateDistance(origin, destination);
  const transportMode = determineBestTransportMode(origin, destination);

  // Realistic emission factors for different transport modes (kg CO2 per tonne-km)
  const emissionFactors = {
    'truck': 0.062,        // Road transport
    'rail': 0.022,         // Rail transport
    'sea': 0.008          // Sea freight
  };

  const emissionFactor = emissionFactors[transportMode] || 0.062; // Default to truck

  // Convert: factor is kg CO2 per tonne-km, so divide by 1000 to get kg per kg-km
  // Then multiply by weight and distance
  const co2kg = (emissionFactor / 1000) * weightKg * distance;

  // Add realistic minimums and variations
  const minEmission = Math.max(co2kg, 0.01); // At least 0.01kg for any transport
  const variation = Math.random() * 0.5 + 0.75; // ±25% variation

  return Math.round((minEmission * variation) * 100) / 100;
}

// Determine appropriate transport mode based on origin/destination
function determineBestTransportMode(origin, destination) {
  // Short European distances
  if (['France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland'].includes(origin) &&
      ['France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland'].includes(destination)) {
    return 'truck'; // Road for European intra-country
  }

  // European to Asian (including India)
  if (['France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland'].includes(origin) ||
      ['India', 'China', 'Vietnam', 'Pakistan', 'Indonesia'].includes(destination)) {
    return 'sea'; // Sea freight for long distances
  }

  // Asian to Asian (including India)
  if (['India', 'China', 'Vietnam', 'Pakistan', 'Indonesia'].includes(origin) &&
      ['India', 'China', 'Vietnam', 'Pakistan', 'Indonesia'].includes(destination)) {
    return 'truck'; // Road for intra-Asia
  }

  // Default to sea freight for long distances
  const distance = getApproximateDistance(origin, destination);
  return distance > 3000 ? 'sea' : 'truck';
}

function getApproximateDistance(origin, destination) {
  // Realistic distance approximations by air distance for major transport routes
  const distances = {
    // European routes (truck/rail)
    'Italy-France': 640,
    'Italy-Germany': 730,
    'France-Germany': 450,
    'Italy-Spain': 1000,
    'Italy-UK': 1300,
    'Netherlands-France': 420,
    'Switzerland-France': 480,
    'Belgium-France': 300,
    'Switzerland-Italy': 150,
    'Germany-Netherlands': 200,

    // North America
    'USA-France': 6200,
    'USA-Germany': 6900,

    // South America
    'Brazil-France': 8900,

    // Indian routes (sea freight mostly)
    'India-France': 7500,
    'India-Germany': 6800,
    'India-UK': 7800,
    'India-USA': 12400,
    'India-Italy': 7000,
    'India-Spain': 8200,
    'India-Netherlands': 7400,
    'India-Belgium': 7300,
    'India-Switzerland': 7100,

    // Asian routes
    'China-France': 8200,
    'China-India': 3900,
    'Vietnam-India': 2700,
    'Pakistan-India': 1700,

    // Within India (truck)
    'India-India': 500,
  };

  const key1 = `${origin}-${destination}`;
  const key2 = `${destination}-${origin}`;

  return distances[key1] || distances[key2] || 1500; // Default 1500km if not found
}

// Determine likely transport method based on distance
export function getTransportMethod(origin, destination, distanceKm) {
  if (distanceKm > 5000) return 'ocean_freight';
  if (distanceKm > 1000) return 'mixed_road_rail';
  return 'truck';
}

// Get user location for destination (if not provided)
export async function getUserLocation() {
  if (!navigator.geolocation) return 'France'; // Default

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Simple reverse geocoding to get country
        // In production, use a geocoding service
        if (lat > 40 && lat < 60 && lng > 0 && lng < 20) {
          resolve('France');
        } else {
          resolve('Unknown');
        }
      },
      (error) => resolve('France'), // Default fallback
      { timeout: 5000 }
    );
  });
}

// Origin inference when OFF data doesn't have it
export function deriveProductOrigin(productData) {
  // Strategy 1: Brand matching
  const brandOrigins = {
    'ferrero': 'Italy',
    'nestle': 'Switzerland',
    'danone': 'France',
    'kraft': 'USA',
    'cocacola': 'USA',
    'pepsi': 'USA',
    'mars': 'USA',
    'barilla': 'Italy',
    'heinz': 'USA'
  };

  const brand = productData.brands?.toLowerCase();
  if (brandOrigins[brand]) {
    return brandOrigins[brand];
  }

  // Strategy 2: Sales country proxy (80% of products consumed locally)
  if (productData.countries_tags) {
    const country = productData.countries_tags[0].replace('en:', '');
    return country.charAt(0).toUpperCase() + country.slice(1);
  }

  // Strategy 3: Default
  return 'Europe';
}

// Helper functions for Climatiq API
function selectActivityId(origin, destination, distanceKm) {
  // Climatiq v26.26 specific activity IDs provided by user
  if (distanceKm > 5000) {
    // Sea freight for long international routes (Europe to Asia/India)
    return "sea_freight-vessel_type_container_ship-route_type_na-vessel_length_na-tonnage_na-fuel_source_na";
  } else if (distanceKm > 2000) {
    // Heavy goods vehicle for medium distances
    return "freight_vehicle-vehicle_type_truck-freight_category_refrigerated-smartway_co2_rank_4";
  } else {
    // Commercial truck for shorter routes
    return "freight_vehicle-vehicle_type_truck-freight_category_refrigerated-smartway_co2_rank_4";
  }
}

function getCountryCode(countryName) {
  const countryMap = {
    'France': 'FR',
    'Germany': 'DE',
    'Italy': 'IT',
    'India': 'IN',
    'USA': 'US',
    'China': 'CN',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Spain': 'ES',
    'United Kingdom': 'GB'
  };
  return countryMap[countryName] || countryName;
}

// Calibrate API emissions to realistic transportation values
function calibrateEmission(apiCo2kg, productWeightKg, distanceKm, activityId) {
  // Skip calibration if API result is already reasonable
  const tonneKm = (10 * distanceKm) / 1000; // 10 tonnes (representing load)
  const emissionPerTonneKm = apiCo2kg / tonneKm;

  // Realistic baseline ranges (kg CO2 per tonne-km)
  const realisticRanges = {
    'sea': { min: 0.004, max: 0.012 },  // 4-12g per tonne-km
    'truck': { min: 0.030, max: 0.100 }, // 30-100g per tonne-km
    'rail': { min: 0.015, max: 0.035 }  // 15-35g per tonne-km
  };

  const transportType = getTransportMethodFromResponse(activityId);
  const range = realisticRanges[transportType] || realisticRanges.truck;

  // If emission is within realistic range, return as-is
  if (emissionPerTonneKm >= range.min && emissionPerTonneKm <= range.max) {
    return apiCo2kg;
  }

  // Apply calibration factor to bring into realistic range
  let correctionFactor = 1.0;

  if (emissionPerTonneKm > range.max * 1.5) {
    // Way too high - apply strong downward correction
    correctionFactor = Math.max(0.1, range.max / emissionPerTonneKm);
  } else if (emissionPerTonneKm < range.min) {
    // Too low - slight upward correction
    correctionFactor = range.min / emissionPerTonneKm;
  }

  const calibrated = apiCo2kg * correctionFactor;

  console.log(`Emission calibrated: ${apiCo2kg.toFixed(2)}kg → ${calibrated.toFixed(2)}kg (factor: ${correctionFactor.toFixed(2)})`);

  return Math.max(calibrated, 0.01); // Ensure at least 0.01kg minimum
}

function getTransportMethodFromResponse(activityId) {
  if (activityId.startsWith('sea_freight')) return 'sea';
  if (activityId.startsWith('freight_vehicle')) return 'truck';
  return 'mixed';
}

// Fallback for when API is not available
function calculateProductPortionEmission(origin, destination, weightKg) {
  const distance = getApproximateDistance(origin, destination);
  const transportMode = determineBestTransportMode(origin, destination);

  // Realistic shipment sizes
  const shipmentSizes = {
    'truck': 18000,  // 18 tonnes
    'rail': 20000,   // 20 tonnes
    'sea': 24000     // 24 tonnes
  };

  const shipmentTons = shipmentSizes[transportMode] || 18000;
  const shipmentCo2 = calculateFallbackEmission(origin, destination, shipmentTons * 1000);

  // Calculate product's portion
  const productTons = weightKg / 1000;
  const productPortion = Math.min(productTons / shipmentTons, 0.05);
  const productCo2 = shipmentCo2 * productPortion;

  return {
    co2_kg: Math.max(productCo2, 0.001),
    distance_km: distance,
    transport_method: transportMode,
    origin: origin,
    destination: destination,
    confidence: 'estimated',
    source: 'Fallback calculation',
    shipment_size_tons: shipmentTons,
    product_portion_percent: (productPortion * 100).toFixed(6)
  };
}

// Export utility functions for other services
export {
  calculateFallbackEmission,
  getApproximateDistance
};
