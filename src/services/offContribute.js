// Open Food Facts Contribution Service
// Allows users to contribute missing product data directly from the app

const OFF_BASE_URL = 'https://world.openfoodfacts.net';

export async function contributeMissingData(barcode, contributionData) {
  try {
    console.log('📤 Sending contribution to backend:', { barcode, contributionData });

    const response = await fetch('http://localhost:3001/api/contribute/off', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        barcode,
        data: contributionData
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ Backend response:', result);
    return result;

  } catch (error) {
    console.error('❌ Contribution request failed:', error);

    // Provide helpful error message
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Backend server not running. Please start the backend with: cd backend && npm run dev');
    }

    throw new Error(`Failed to contribute data: ${error.message}`);
  }
}

// Alternative: Try direct API call but with different approach (keeping for reference)
/*
export async function contributeMissingDataDirect(barcode, contributionData) {
  // This would require a backend proxy to avoid CORS
  // For now, we use the redirect approach which is more reliable in browsers
}
*/

// Assess what data is missing from the product
export function assessDataCompleteness(productData) {
  const completeness = {
    packaging: !!productData.packaging && productData.packaging !== 'Not specified',
    ingredients: !!productData.ingredients && productData.ingredients !== 'Not available',
    nutrients: !!productData.nutrients && Object.keys(productData.nutrients).length > 0,
    image: !!productData.image,
    brand: !!productData.brand,
    categories: !!productData.category,
    completeness_score: productData.completeness || 0
  };

  // Identify which fields are missing
  completeness.missing_fields = [];
  if (!completeness.packaging) completeness.missing_fields.push('packaging');
  if (!completeness.ingredients) completeness.missing_fields.push('ingredients');
  if (!completeness.nutrients) completeness.missing_fields.push('nutrients');

  return completeness;
}

// Validate contribution data before submission
export function validateContributionData(data) {
  const errors = [];

  if (data.packaging && data.packaging.trim().length < 2) {
    errors.push('Packaging description must be at least 2 characters');
  }

  if (data.ingredients && data.ingredients.trim().length < 10) {
    errors.push('Ingredients list should be more detailed (minimum 10 characters)');
  }

  if (data.brands && data.brands.length > 0 && data.brands.some(b => b.length < 2)) {
    errors.push('Brand names must be at least 2 characters each');
  }

  // Check if at least one field is being contributed
  const hasData = data.packaging || data.ingredients || data.brands || data.categories || data.labels;
  if (!hasData) {
    errors.push('Please fill at least one field to contribute');
  }

  return errors;
}
