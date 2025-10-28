// SustainScan Backend API - Gemini AI Alternatives Endpoint
// Deployed as Vercel Serverless Function

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(request, response) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return response.status(200).json({});
  }

  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    const { productData } = request.body;

    if (!productData || !productData.name) {
      return response.status(400).json({
        error: 'Product data is required',
        success: false
      });
    }

  console.log('🤖 Calling Gemini AI for alternatives...');

  let aiError = null;
  let formattedAlternatives = null;
  let mealSuggestions = [];
  let hasHighProtein = false;

    try {
      const response_ = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a sustainability expert. Find 3 sustainable alternatives for ${productData.name} that are nutritionally better. The alternatives brand should be based on what a customer in a supermarket would be able to find. The brand should be primarily indian. In the alternatives give the brand name as well as the product name. Return the packaging type of the product that you're suggesting (eg: 'plastic', 'paper', 'glass' etc. Keep it a single word).

        Also, ALWAYS suggest 4 simple meal names that can be made using "${productData.name}" as a key ingredient, regardless of what the product is. Also return the protein amount of each of the recipe.

        The nutrients should be in this format particularly fat: high, salt: low, sugar: high, saturated-fat:high and give the ingredients too, packaging that you are gonna give should be better than ${productData.nutrients}, ${productData.ingredients}, ${productData.packaging}. Also Return vegan products.

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
                },
                meal_suggestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
                protein: {
                  type: Type.STRING,
                }
              },
              propertyOrdering: ["alternatives", "nutrients", "ingredients", "packaging", "vegan", "nutriscore_grade", "meal_suggestions", "protein"],
            },
          },
        },
      });

      const result = response_.text.replace(/```json\n?|\n?```/g, '');

      let cleanResult;
      try {
        cleanResult = JSON.parse(result);
        console.log('✅ Successfully parsed Gemini response:', cleanResult);

        // Validate response structure
        if (!Array.isArray(cleanResult) || cleanResult.length === 0) {
          console.error('❌ Invalid Gemini response structure - not an array or empty');
          throw new Error('Invalid response structure from Gemini');
        }

        // Check if any item has the expected properties
        const hasValidItems = cleanResult.some(item =>
          item &&
          ((item.alternatives && Array.isArray(item.alternatives)) ||
           (item.meal_suggestions && Array.isArray(item.meal_suggestions)))
        );

        if (!hasValidItems) {
          console.error('❌ None of the items have expected properties (alternatives, meal_suggestions)');
          throw new Error('Invalid item structure from Gemini');
        }

      } catch (parseError) {
        console.error('❌ JSON parsing failed or invalid structure:', parseError.message);
        console.error('Raw result:', result.substring(0, 500));
        throw new Error(`Gemini response parsing failed: ${parseError.message}`);
      }

      formattedAlternatives = cleanResult.map((item, index) => {
        // Get the alternative product name (Gemini often gives us brand + product together)
        const product_name = item?.alternatives?.[0] || `Alternative ${index + 1}`;

        console.log('🔍 Alternative', index, ':', product_name);

        return {
          code: `ai_${Date.now()}_${index}`,
          product_name: product_name,
          brand: '', // We'll determine brand later or use full name
          nutrients: item?.nutrients || [],
          ingredients: item?.ingredients || [],
          packaging: item?.packaging || 'unknown',
          vegan: item?.vegan || false,
          nutriscore_grade: item?.nutriscore_grade || 'c',
          improvement_score: 5 + ((item?.packaging === 'glass') ? 2 : 0),
          image_front_url: null
        };
      });

      // Extract meal suggestions and protein indicator from first result
      mealSuggestions = cleanResult[0]?.meal_suggestions || [];
      hasHighProtein = cleanResult[0]?.protein || false;
    } catch (error) {
      aiError = error;
      console.error('❌ Gemini AI failed:', error.message);
    }

    console.log("formatted alternatives",formattedAlternatives)
    console.log("suggestions:", mealSuggestions)
    console.log("protein", hasHighProtein)

    if (formattedAlternatives) {
      const responseData = {
        success: true,
        source: 'AI',
        alternatives: formattedAlternatives,
        mealSuggestions: mealSuggestions,
        hasHighProtein: hasHighProtein
      };

      console.log('📤 Returning AI response to frontend:', {
        source: responseData.source,
        alternativesCount: responseData.alternatives?.length || 0,
        mealSuggestions: responseData.mealSuggestions,
        hasHighProtein: responseData.hasHighProtein
      });

      return response.status(200).json(responseData);
    }

    // Fallback to OFF search if AI fails
    console.log('🔄 Falling back to OFF search');
    try {
      const offAlternatives = await getOFFAlternatives(productData);

      return response.status(200).json({
        success: true,
        source: 'OFF',
        alternatives: offAlternatives
      });
    } catch (offError) {
      console.error('OFF fallback also failed:', offError.message);
      return response.status(500).json({
        success: false,
        error: 'Both AI and database alternatives failed',
        details: { ai: aiError?.message, off: offError?.message }
      });
    }

  } catch (error) {
    console.error('❌ Alternatives endpoint error:', error);
    return response.status(500).json({
      success: false,
      error: 'Failed to generate alternatives',
      details: error.message
    });
  }
}

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

    // Search for better alternatives in same category
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

  const currentGradeNum = gradePoints[currentGrade] || 1;
  const altGradeNum = gradePoints[altGrade] || 1;
  const gradeImprovement = Math.max(0, altGradeNum - currentGradeNum);

  const scoreDiff = (altScore - currentScore) / 5;
  const scoreBonus = Math.max(0, Math.min(scoreDiff, 20));

  return gradeImprovement + scoreBonus;
}

function analyzeBenefits(current, alternative) {
  const benefits = [];

  if ((alternative.nutriscore_score || 0) > (current.nutriscore_score || 0)) {
    benefits.push({ type: 'nutrition', text: 'Better nutritional score', icon: '🥗' });
  }

  if (gradeBetter(current.nutriscore_grade, alternative.nutriscore_grade)) {
    benefits.push({ type: 'grade', text: `${alternative.nutriscore_grade.toUpperCase()} grade`, icon: '⭐' });
  }

  if (alternative.sugars_100g && current.sugars_100g &&
      alternative.sugars_100g < current.sugars_100g * 0.8) {
    benefits.push({ type: 'sugar', text: 'Lower sugar content', icon: '🎯' });
  }

  if (alternative['energy-kj_100g'] && current['energy-kj_100g'] &&
      alternative['energy-kj_100g'] < current['energy-kj_100g'] * 0.9) {
    benefits.push({ type: 'calories', text: 'Lower calorie content', icon: '⚡' });
  }

  if (alternative.is_organic) {
    benefits.push({ type: 'organic', text: 'Organic certified', icon: '🌱' });
  }

  if (alternative.is_fair_trade) {
    benefits.push({ type: 'fair_trade', text: 'Fair trade certified', icon: '🤝' });
  }

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
