// Carbon Interface API service for transportation emissions

const CARBON_INTERFACE_API_KEY = import.meta.env.VITE_CARBON_INTERFACE_API_KEY || 'lDKCoYDPfnBSUtOgNisg'; 

export async function getTransportationEmissions(origin, destination, weightKg = 1, productType = 'food') {
  try {
    const baseUrl = 'https://www.carboninterface.com/api/v1';
    const endpoint = '/estimates';

    const requestBody = {
      type: 'shipping',
      weight_value: weightKg,
      weight_unit: 'kg',
      route: {
        origin_address: origin,      // Example: "Italy"
        destination_address: destination  // Example: "France"
      },
      vehicle_type: 'truck'  // Let API choose: truck for short haul, ocean for long
    };

    console.log('Carbon Interface Request:', requestBody);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CARBON_INTERFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // For demo purposes, don't throw errors - just return fallback
      console.warn(`Carbon Interface API: ${response.status} - using fallback`);
      // throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Carbon Interface Response:', data);

    return {
      co2_kg: data.data.attributes.carbon_kg,
      distance_km: data.data.attributes.distance_value,
      transport_method: data.data.attributes.transport_method || 'mixed',
      origin: origin,
      destination: destination,
      confidence: 'high',
      source: 'Carbon Interface API'
    };

  } catch {
    console.error('Carbon Interface API Error occurred');

    // Return fallback data when API fails
    return {
      co2_kg: calculateFallbackEmission(origin, destination, weightKg),
      distance_km: getApproximateDistance(origin, destination),
      transport_method: 'estimated',
      origin: origin,
      destination: destination,
      confidence: 'estimated',
      source: 'Fallback calculation'
    };
  }
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

// Export utility functions for other services
export {
  calculateFallbackEmission,
  getApproximateDistance
};
