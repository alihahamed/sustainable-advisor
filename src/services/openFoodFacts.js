// Open Food Facts API service

const OFF_BASE_URL = 'https://world.openfoodfacts.net/api/v2';

export async function getProductData(barcode) {
  try {
    const response = await fetch(`${OFF_BASE_URL}/product/${barcode}.json`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      throw new Error('Product not found or incomplete data');
    }

    const product = data.product;

    return {
      // Basic info
      code: product.code,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      category: product.categories_hierarchy?.[0] || product.categories || '',
      country: product.countries_tags?.[0]?.replace('en:', '') || '',

      // Nutritional info
      nutriscore_score: product.nutriscore_score,
      nutriscore_grade: product.nutriscore_grade,
      nutrients: product.nutrient_levels,

      // Packaging & eco info
      packaging: product.packaging || 'Not specified',
      eco_score: product.ecoscore_score,

      // Media
      image: product.image_front_url,
      ingredients: product.ingredients_text || 'Not available',

      // Metadata
      created: product.created_t,
      updated: product.last_modified_t,
      completeness: product.completeness,

      // Raw ecoscore data for analysis
      ecoscore_data: product.ecoscore_data,

      // Extraction helpers
      weight_kg: extractProductWeight(product),
    };

  } catch (error) {
    console.error('Open Food Facts API Error:', error);
    throw new Error(`Failed to fetch product data: ${error.message}`);
  }
}

// Extract product weight in kg
function extractProductWeight(product) {
  const quantity = product.product_quantity ||
                   product.quantity ||
                   product.serving_size;

  if (!quantity) return 1; // Default 1kg

  // Match patterns like "212g", "1.5kg", "500 ml"
  const match = quantity.match(/(\d*\.?\d+)\s*(g|kg|ml|l)/i);

  if (!match) return 1;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  // Convert to kg
  switch (unit) {
    case 'g':
      return Math.max(value / 1000, 0.01); // Minimum 10g
    case 'kg':
      return value;
    case 'ml':
    case 'l':
      // Assume density ~1 for liquids (ml to kg)
      return unit === 'l' ? value : Math.max(value / 1000, 0.01);
    default:
      return 1;
  }
}

// Check if product has sustainability data
export function hasSustainabilityData(productData) {
  const hasNutrition = productData.nutriscore_score !== undefined;
  const hasEco = productData.eco_score !== undefined;
  const hasOrigin = productData.ecoscore_data?.origins_of_ingredients?.aggregated_origins?.[0]?.origin !== 'en:unknown';

  return { hasNutrition, hasEco, hasOrigin };
}

// Get data quality warnings
export function getDataQualityWarnings(productData) {
  const warnings = [];

  if (productData.completeness < 0.5) {
    warnings.push('Product data is incomplete');
  }

  if (!productData.eco_score) {
    warnings.push('Environmental score not available');
  }

  if (!productData.ingredients_text) {
    warnings.push('Ingredients not specified');
  }

  if (productData.ecoscore_data?.adjustments?.origins_of_ingredients?.warning === 'origins_are_100_percent_unknown') {
    warnings.push('Origin information unknown');
  }

  if (!productData.packaging) {
    warnings.push('Packaging information missing');
  }

  return warnings;
}

// Search products by category (for alternatives)
export async function searchByCategory(category, page = 1) {
  try {
    const response = await fetch(
      `${OFF_BASE_URL}/search?categories_tags=${encodeURIComponent(category)}&page=${page}&fields=product_name,nutriscore_score,image_front_url`
    );

    const data = await response.json();

    return data.products || [];

  } catch (error) {
    console.error('Search by category failed:', error);
    return [];
  }
}
