
import { TreePalm } from "lucide-react";

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

    console.log('product.nutriments:', product.nutriments);
    console.log('product.ingredients_tags:', product.ingredients_tags);

    const result = {
      // Basic info
      code: product.code,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      category: getFirstThreeCategories(product.categories_hierarchy || product.categories),
      country: product.countries_tags?.[0]?.replace('en:', '') || '',

      // Nutritional info
      nutriscore_score: product.nutriscore_score,
      nutriscore_grade: product.nutriscore_grade,
      nutrients: product.nutrient_levels,
      nutrientsData: {
        energy: product.nutriments?.['energy-kcal'],
        sodium: product.nutriments?.sodium,
        salt: product.nutriments?.salt,
        proteins: product.nutriments?.proteins,
        fat: product.nutriments?.fat,
        carbohydrates: product.nutriments?.carbohydrates,
        sugar:product.nutriments?.sugars
      },

      // Packaging & eco info
      packaging: product.packaging || 'Not specified',
      eco_score: product.ecoscore_score,

      // Media
      image: product.image_front_url,
      ingredients: product.ingredients_text || 'Not available',

      // Ingredient concerns analysis
      ingredientConcerns: (() => {
        const ingredientsTags = product.ingredients_tags;
        console.log('RAW ingredients_tags:', ingredientsTags);

        if (!ingredientsTags || !Array.isArray(ingredientsTags) || ingredientsTags.length === 0) {
          console.log('No ingredients_tags found or invalid format');
          return [];
        }

        const concerns = analyzeIngredientConcerns(ingredientsTags);
        console.log('ANALYZED concerns:', concerns);
        return concerns;
      })(),

      // Metadata
      created: product.created_t,
      updated: product.last_modified_t,
      completeness: product.completeness,

      // Raw ecoscore data for analysis
      ecoscore_data: product.ecoscore_data,

      // Extraction helpers
      weight_kg: extractProductWeight(product),
    };

    console.log('returning:', result);
    return result;

  } catch (error) {
    console.error('Open Food Facts API Error:', error);
    throw new Error(`Failed to fetch product data: ${error.message}`);
  }
}

function getFirstThreeCategories(categories) {
  if (!categories) return '';

  // Handle if categories is an array (categories_hierarchy) or string
  let categoryArray = [];
  if (Array.isArray(categories)) {
    categoryArray = categories;
  } else if (typeof categories === 'string') {
    categoryArray = categories.split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);
  }

  // Clean up category names (remove en: prefixes)
  const cleanCategories = categoryArray
    .map(cat => cat.replace('en:', '').replace('fr:', '').trim())
    .filter(cat => cat.length > 0);

  // Take first 3 categories and join them back
  return cleanCategories.slice(0, 4).join(', ');
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

// Find sustainable alternatives using AI (with OFF fallback)
export async function findSustainableAlternatives(productData, limit = 5) {
  try {
    console.log(`🤖 Requesting AI alternatives for: "${productData.name}"`);

    // Call the AI endpoint first
    const response = await fetch('/api/alternatives/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productData: productData,
        limit: limit
      })
    });

    if (!response.ok) {
      throw new Error(`AI Alternatives API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.alternatives) {
      console.log(`🎯 Found ${data.alternatives.length} ${data.source === 'AI' ? 'AI-generated' : 'database'} sustainable alternatives`);
      return data.alternatives.slice(0, limit);
    }

    throw new Error(data.error || 'Unknown error from alternatives API');

  } catch (error) {
    console.error('❌ AI alternatives failed:', error.message);

    // Fallback to direct OFF search
    console.log('🔄 Falling back to direct OFF search...');
    return await findSustainableAlternativesOFF(productData, limit);
  }
}

// Fallback: Search Open Food Facts database directly
async function findSustainableAlternativesOFF(productData, limit = 5) {
  try {
    const currentGrade = productData.nutriscore_grade?.toLowerCase();
    const currentScore = productData.nutriscore_score;
    const category = productData.category;

    if (!category) {
      console.log('No category available for alternatives search');
      return [];
    }

    console.log(`Searching OFF alternatives for category: "${category}"`);

    // Get better grades to search for
    const betterGrades = getBetterGrades(currentGrade);
    if (betterGrades.length === 0) {
      console.log(`Product already has best grade: ${currentGrade}`);
      return [];
    }

    // Build OR query for better nutrition grades
    const gradeQueries = betterGrades.map(grade => `nutrition_grades_tags=${grade}`).join('&');

    // Search for better alternatives in same category using OFF API format
    const globalCountries = 'countries_tags_en=united-states|united-kingdom|canada|india|pakistan|australia|spain|brazil';

    const queryParams = [
      `categories_tags_en=${encodeURIComponent(category)}`,
      gradeQueries,
      globalCountries,
      'fields=code,product_name,nutriscore_grade,nutriscore_score,ecoscore_grade,ecoscore_score,image_front_url,labels_tags,energy-kj_100g,sugars_100g,salt_100g,categories_tags_en',
      'sort_by=popularity',
      `page_size=${Math.min(limit * 2, 20)}`, // Get more results to filter
      'page=1'
    ].join('&');

    console.log(`Alternatives OFF query: ${OFF_BASE_URL}/search?${queryParams}`);

    const response = await fetch(`${OFF_BASE_URL}/search?${queryParams}`);

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    const alternatives = data.products || [];

    // Filter and sort alternatives by improvement score
    const scoredAlternatives = alternatives
      .filter(product => product.product_name && product.code)
      .map(alternative => ({
        ...alternative,
        improvement_score: calculateImprovementScore(
          currentScore,
          currentGrade,
          alternative.nutriscore_score,
          alternative.nutriscore_grade
        ),
        benefits: analyzeBenefits(productData, alternative),
        is_organic: alternative.labels_tags?.some(tag => tag.includes('organic') || tag.includes('bio')),
        is_fair_trade: alternative.labels_tags?.some(tag => tag.includes('fair-trade'))
      }))
      .sort((a, b) => b.improvement_score - a.improvement_score)
      .slice(0, limit);

    console.log(`Found ${scoredAlternatives.length} OFF database alternatives for ${productData.name}`);
    return scoredAlternatives;

  } catch (error) {
    console.error('OFF Alternatives search failed:', error);
    return [];
  }
}

// Get grades that are better than current grade
function getBetterGrades(currentGrade) {
  const gradeRanking = { 'e': 1, 'd': 2, 'c': 3, 'b': 4, 'a': 5 };
  const currentLevel = gradeRanking[currentGrade] || 0;

  return Object.entries(gradeRanking)
    .filter(([, level]) => level > currentLevel)
    .map(([grade]) => grade);
}

// Calculate improvement score for ranking alternatives
function calculateImprovementScore(currentScore, currentGrade, altScore, altGrade) {
  const gradePoints = { 'e': 1, 'd': 2, 'c': 3, 'b': 4, 'a': 5 };

  // Base grade improvement (0-4 points)
  const currentGradeNum = gradePoints[currentGrade] || 1;
  const altGradeNum = gradePoints[altGrade] || 1;
  const gradeImprovement = Math.max(0, altGradeNum - currentGradeNum);

  // Score improvement (0-20 points, scaled to grade difference)
  const scoreDiff = (altScore - (currentScore || 0)) / 5;
  const scoreBonus = Math.max(0, Math.min(scoreDiff, 20)); // Cap at 20 points

  return gradeImprovement + scoreBonus;
}

// Analyze specific benefits of alternative vs current product
function analyzeBenefits(current, alternative) {
  const benefits = [];

  // Nutrition improvements
  if ((alternative.nutriscore_score || 0) > (current.nutriscore_score || 0)) {
    benefits.push({ type: 'nutrition', text: 'Better nutritional score', icon: '🥗' });
  }

  // Grade improvements
  if (gradeBetter(current.nutriscore_grade, alternative.nutriscore_grade)) {
    benefits.push({ type: 'grade', text: `${alternative.nutriscore_grade.toUpperCase()} grade`, icon: '⭐' });
  }

  // Lower sugar
  if (alternative.sugars_100g && current.sugars_100g &&
      alternative.sugars_100g < current.sugars_100g * 0.8) {
    benefits.push({ type: 'sugar', text: 'Lower sugar content', icon: '🎯' });
  }

  // Lower energy
  if (alternative['energy-kj_100g'] && current['energy-kj_100g'] &&
      alternative['energy-kj_100g'] < current['energy-kj_100g'] * 0.9) {
    benefits.push({ type: 'calories', text: 'Lower calorie content', icon: '⚡' });
  }

  // Certifications
  if (alternative.is_organic) {
    benefits.push({ type: 'organic', text: 'Organic certified', icon: '🌱' });
  }

  if (alternative.is_fair_trade) {
    benefits.push({ type: 'fair_trade', text: 'Fair trade certified', icon: '🤝' });
  }

  // Eco score if available
  if (alternative.ecoscore_score && (!current.eco_score || alternative.ecoscore_score > current.eco_score)) {
    benefits.push({ type: 'eco', text: 'Better eco-score', icon: '♻️' });
  }

  return benefits;
}



// Check if grade A is better than grade B
function gradeBetter(gradeA, gradeB) {
  const grades = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
  return (grades[gradeB?.toLowerCase()] || 0) > (grades[gradeA?.toLowerCase()] || 0);
}

// Analyze ingredients for concerning components
function analyzeIngredientConcerns(ingredientsTags = []) {
  const concerns = [];

  // Simple keyword matching - if tag contains these words, flag it
  const harmfulIngredients = [
    // Palm oil and variants
    { keyword: 'palm', category: 'Palm Oil', severity: 'high', icon:'🌴' , description: 'Palm oil contributes to deforestation' },

    // MSG and flavor enhancers
    { keyword: 'artificial', category: 'MSG', severity: 'medium', icon: '🧪', description: 'Artificial Flavouring' },
    { keyword: 'acidity', category: 'Flavor Enhancers', severity: 'medium', icon: '🧪', description: 'Acidity Regulators' },
    { keyword: 'e627', category: 'Flavor Enhancers', severity: 'medium', icon: '🧪', description: 'Disodium guanylate flavor enhancer' },

    // Artificial colors (E100-199 range)
    { keyword: '150d', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Artificial food color E150d (continued in E101-E199)' },
    { keyword: 'e330', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'e330 - Citric Acid' },
    { keyword: 'e508', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'e508 - Gelling agent' },
    { keyword: 'e375', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Sunset Yellow (E110) - artificial orange color' },
    { keyword: 'e122', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Carmoisine (E122) - artificial red color' },
    { keyword: 'e123', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Amaranth (E123) - artificial red color' },
    { keyword: 'e124', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Ponceau 4R (E124) - artificial red color' },
    { keyword: 'e127', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Erythrosine (E127) - artificial red color' },
    { keyword: 'e129', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Allura Red (E129) - artificial red color' },
    { keyword: 'e130', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Indigotine (E130) - artificial blue color' },
    { keyword: 'tartrazine', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Yellow 5 artificial color' },
    { keyword: 'sunset', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Sunset Yellow artificial color' },
    { keyword: 'ponceau', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Ponceau red artificial color' },
    { keyword: 'allura', category: 'Artificial Colors', severity: 'medium', icon: '🎨', description: 'Allura Red artificial color' },

    // Trans fats
    { keyword: 'hydrogenated', category: 'Trans Fats', severity: 'high', icon: '🚫', description: 'Hydrogenated oils may contain trans fats' },
    { keyword: 'partially', category: 'Trans Fats', severity: 'high', icon: '🚫', description: 'Partially hydrogenated oils contain trans fats' }
  ];

  // Check each ingredient tag
  ingredientsTags.forEach(tag => {
    // Remove language prefixes (en:, fr:, etc.)
    const cleanTag = tag.toLowerCase().replace(/^[a-z]{2}:/i, '');

    harmfulIngredients.forEach(ingredient => {
      if (cleanTag.includes(ingredient.keyword.toLowerCase())) {
        // Only add if not already in concerns (avoid duplicates)
        const existing = concerns.find(c => c.category === ingredient.category);
        if (!existing) {
          concerns.push({
            category: ingredient.category,
            severity: ingredient.severity,
            icon: ingredient.icon,
            description: ingredient.description,
            detected: cleanTag
          });
        }
      }
    });
  });

  return concerns;
}
