// SustainScan Backend Server
// Handles API integrations (Open Food Facts, Carbon APIs, etc.) with proper CORS handling

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fetch from 'node-fetch';
import { GoogleGenAI, Type } from '@google/genai';
import { preinitModule } from 'react-dom';

const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});;



// import FormData from 'form-data'; // No longer needed, using URLSearchParams instead

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend development
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'], // Vite dev server + potential future prod URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Security headers
app.use(helmet());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'SustainScan Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Open Food Facts Contribution Endpoint - FIXED VERSION
app.post('/api/contribute/off', async (req, res) => {
  try {
    const { barcode, data } = req.body;

    // Validate required data
    if (!barcode) {
      return res.status(400).json({
        error: 'Barcode is required',
        success: false
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        error: 'Contribution data object is required',
        success: false
      });
    }

    console.log(`🔄 Processing OFF contribution for barcode: ${barcode}`);

    // Check OFF credentials
    const offUsername = process.env.OFF_USERNAME;
    const offPassword = process.env.OFF_PASSWORD;

    if (!offUsername || !offPassword) {
      return res.status(500).json({
        error: 'OFF credentials not configured. Please set OFF_USERNAME and OFF_PASSWORD environment variables.',
        success: false
      });
    }

    // Submit to OFF API
    const params = new URLSearchParams();

    // CRITICAL: These must be in this exact order and format
    params.append('user_id', offUsername);
    params.append('password', offPassword);
    params.append('code', barcode);

    // Add each data field individually
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(', '));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    // Add metadata
    params.append('comment', 'Added sustainability data via SustainScan');
    params.append('app_name', 'SustainScan');
    params.append('app_version', '1.0.0');

    console.log('📤 Sending params:', params.toString()); // DEBUG: See what's being sent

    const offResponse = await fetch('https://world.openfoodfacts.org/cgi/product_jqm2.pl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SustainScan/1.0.0'
      },
      body: params.toString()
    });

    // Log the raw response for debugging
    const responseText = await offResponse.text();
    console.log(`📥 OFF Raw Response (${offResponse.status}):`, responseText);

    // Try to parse as JSON
    let offResult;
    try {
      offResult = JSON.parse(responseText);
    } catch (e) {
      console.error('⚠️ Response is not JSON:', responseText);
      throw new Error(`OFF API returned non-JSON response: ${responseText.substring(0, 200)}`);
    }

    if (!offResponse.ok) {
      throw new Error(`OFF API responded with status: ${offResponse.status} - ${offResult.status_verbose || responseText}`);
    }

    console.log(`✅ OFF Response:`, {
      status: offResult.status,
      status_verbose: offResult.status_verbose
    });

    if (offResult.status === 1 || offResult.status_verbose === 'fields saved') {
      res.json({
        success: true,
        message: 'Your contribution has been successfully submitted to Open Food Facts!',
        details: offResult
      });
    } else {
      throw new Error(offResult.status_verbose || 'OFF contribution failed');
    }

  } catch (error) {
    console.error('❌ OFF Contribution Error:', error.message);

    // Check for specific error types
    if (error.message.includes('401') || error.message.includes('403')) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed. Please verify: 1) You are using your OFF USERNAME (not email), 2) Password is correct',
        details: error.message
      });
    } else if (error.message.includes('timeout')) {
      res.status(408).json({
        success: false,
        error: 'Request timed out. OFF server may be busy, please try again.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to submit contribution to Open Food Facts.',
        details: error.message
      });
    }
  }
});

// Helper function for OFF alternatives search (fallback when AI isn't available)
async function getOFFAlternatives(productData, limit = 5) {
  try {
    const currentGrade = productData.nutriscore_grade?.toLowerCase();
    const currentScore = productData.nutriscore_score;
    const category = productData.category;

    if (!category) {
      throw new Error('No category available for alternatives search');
    }

    console.log(`Searching OFF alternatives for category: "${category}"`);

    // Get better grades to search for
    const betterGrades = ['a', 'b', 'c'].filter(grade =>
      !currentGrade || { 'e': 1, 'd': 2, 'c': 3, 'b': 4, 'a': 5 }[grade] > { 'e': 1, 'd': 2, 'c': 3, 'b': 4, 'a': 5 }[currentGrade]
    );

    if (betterGrades.length === 0) {
      throw new Error(`Product already has best grade: ${currentGrade}`);
    }

    // Build OR query for better nutrition grades
    const gradeQueries = betterGrades.map(grade => `nutrition_grades_tags=${grade}`).join('&');

    // Search for better alternatives in same category using OFF API format
    const globalCountries = 'countries_tags_en=united-states|united-kingdom|canada|india|pakistan|australia|spain|brazil';

    const queryParams = [
      `categories_tags_en=${encodeURIComponent(category)}`,
      gradeQueries,
      globalCountries,
      'fields=code,product_name,nutriscore_grade,nutriscore_score,ecoscore_grade,ecoscore_score,image_front_url,labels_tags,energy-kj_100g,sugars_100g,salt_100g',
      'sort_by=popularity',
      `page_size=${Math.min(limit * 2, 20)}`,
      'page=1'
    ].join('&');

    console.log(`Alternatives OFF query: ${OFF_BASE_URL}/search?${queryParams}`);

    const response = await fetch(`${OFF_BASE_URL}/search?${queryParams}`);

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    const alternatives = data.products || [];

    // Format and score alternatives
    const scoredAlternatives = alternatives
      .filter(product => product.product_name && product.code)
      .map(alternative => ({
        code: alternative.code,
        product_name: alternative.product_name,
        brand: '',
        nutriscore_grade: alternative.nutriscore_grade || 'c',
        nutriscore_score: alternative.nutriscore_score || 0,
        improvement_score: calculateImprovementScore(
          currentScore || 0,
          currentGrade || 'e',
          alternative.nutriscore_score || 0,
          alternative.nutriscore_grade || 'c'
        ),
        benefits: analyzeBenefits(productData, alternative),
        is_organic: alternative.labels_tags?.some(tag => tag.includes('organic') || tag.includes('bio')),
        is_fair_trade: alternative.labels_tags?.some(tag => tag.includes('fair-trade')),
        image_front_url: alternative.image_front_url
      }))
      .sort((a, b) => b.improvement_score - a.improvement_score)
      .slice(0, limit);

    return scoredAlternatives;
  } catch (error) {
    console.error('OFF Alternatives search failed:', error);
    throw error;
  }
}

function calculateImprovementScore(currentScore, currentGrade, altScore, altGrade) {
  const gradePoints = { 'e': 1, 'd': 2, 'c': 3, 'b': 4, 'a': 5 };

  // Base grade improvement (0-4 points)
  const currentGradeNum = gradePoints[currentGrade] || 1;
  const altGradeNum = gradePoints[altGrade] || 1;
  const gradeImprovement = Math.max(0, altGradeNum - currentGradeNum);

  // Score improvement (0-20 points, scaled to grade difference)
  const scoreDiff = (altScore - currentScore) / 5;
  const scoreBonus = Math.max(0, Math.min(scoreDiff, 20));

  return gradeImprovement + scoreBonus;
}

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

function gradeBetter(gradeA, gradeB) {
  const grades = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
  return (grades[gradeB?.toLowerCase()] || 0) > (grades[gradeA?.toLowerCase()] || 0);
}

const OFF_BASE_URL = 'https://world.openfoodfacts.net/api/v2';

// Gemini AI Alternatives Endpoint
app.post('/api/alternatives/ai', async (req, res) => {
  try {
    const { productData } = req.body;

    if (!productData || !productData.name) {
      return res.status(400).json({
        error: 'Product data is required',
        success: false
      });
    }

    console.log('🤖 Calling Gemini AI for alternatives...');

    let aiError = null;
    let formattedAlternatives = null;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a sustainability expert. Find 4-5 sustainable alternatives for ${productData.name} that are nutritionally better. The alternatives brand should be based on what a customer in a supermarket would be able to find. The brand should be primarily indian. In the alternatives give the brand name as well as the product name. Return the packaging type of the product that you're suggesting (eg: 'plastic', 'paper', 'glass' etc. Keep it a single word). The nutrients should be in this format particularly fat: high, salt: low, sugar: high, saturated-fat:high and give the ingredients too, packaging that you are gonna give should be better than ${productData.nutrients}, ${productData.ingredients}, ${productData.packaging}. Also Return vegan products
        Also give a nutriscore grade based on the sustainability of the product you are suggesting.
        `,
        config: {
          thinkingConfig: {
            thinkingBudget: 1024,
          },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nutrients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                alternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                packaging: {
                  type: Type.STRING,
                },
                vegan: {
                  type: Type.BOOLEAN,
                },
                nutriscore_grade: {
                  type: Type.STRING,
                }
              },
              propertyOrdering: ["alternatives", "nutrients", "ingredients", "packaging", "vegan", "nutriscore_grade"],
            },
          },
        },
      });

      const result = response.text.replace(/```json\n?|\n?```/g, '');
      const cleanResult = JSON.parse(result);
      console.log('Response', cleanResult);

      formattedAlternatives = cleanResult.map((item, index) => {
        const fullName = item.alternatives[0]; // "Brand: Product Name"
        const [brand, ...productParts] = fullName.split(':');

        return {
          code: `ai_${Date.now()}_${index}`,
          product_name: productParts.join(':').trim() || fullName,
          brand: brand.trim(),
          nutrients: item.nutrients,
          ingredients: item.ingredients,
          packaging: item.packaging,
          vegan: item.vegan,
          nutriscore_grade: item.nutriscore_grade,
          improvement_score: 5 + (item.packaging === 'glass' ? 2 : 0),
          image_front_url: null
        };
      });
    } catch (error) {
      aiError = error;
      console.error('❌ Gemini AI failed:', error.message);
    }

    console.log(formattedAlternatives)

    if (formattedAlternatives) {
      return res.json({
        success: true,
        source: 'AI',
        alternatives: formattedAlternatives
      });
    }

    // Fallback to OFF search if AI fails
    console.log('🔄 Falling back to OFF search');
    try {
      const offAlternatives = await getOFFAlternatives(productData);

      return res.json({
        success: true,
        source: 'OFF',
        alternatives: offAlternatives
      });
    } catch (offError) {
      console.error('OFF fallback also failed:', offError.message);
      return res.status(500).json({
        success: false,
        error: 'Both AI and database alternatives failed',
        details: { ai: aiError?.message, off: offError?.message }
      });
    }

  } catch (error) {
    console.error('❌ Alternatives endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate alternatives',
      details: error.message
    });
  }
});

// Placeholder for future route: Carbon API
app.post('/api/carbon/transport', (req, res) => {
  // Future implementation for transportation calculations
  res.json({ message: 'Carbon API integration coming soon' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    availableEndpoints: ['POST /api/contribute/off']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 SustainScan Backend Server Running!
📍 Port: ${PORT}
🌐 CORS: Enabled for localhost development
🛡️  Security: Helmet middleware active

📋 Available Endpoints:
   POST /api/contribute/off    - Submit product data to OFF
   GET  /                      - Health check

🔧 Environment Requirements:
   OFF_USERNAME=${process.env.OFF_USERNAME ? '✓ Set' : '❌ Missing - Add to .env'}
   OFF_PASSWORD=${process.env.OFF_PASSWORD ? '✓ Set' : '❌ Missing - Add to .env'}

💡 Real contributions will help save the planet one barcode at a time!
  `);
});
