// SustainScan Backend API - Open Food Facts Contribution Endpoint
// Deployed as Vercel Serverless Function

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
    const { barcode, data } = request.body;

    // Validate required data
    if (!barcode) {
      return response.status(400).json({
        error: 'Barcode is required',
        success: false
      });
    }

    if (!data || typeof data !== 'object') {
      return response.status(400).json({
        error: 'Contribution data object is required',
        success: false
      });
    }

    console.log(`🔄 Processing OFF contribution for barcode: ${barcode}`);

    // Check OFF credentials - using Vercel environment variables
    const offUsername = process.env.OFF_USERNAME;
    const offPassword = process.env.OFF_PASSWORD;

    if (!offUsername || !offPassword) {
      return response.status(500).json({
        error: 'OFF credentials not configured. Please set OFF_USERNAME and OFF_PASSWORD environment variables.',
        success: false
      });
    }

    // Submit to OFF API using native fetch (available in Node.js 18+)
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

    console.log('📤 Sending params to OFF API');

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
      return response.status(500).json({
        success: false,
        error: `OFF API returned non-JSON response: ${responseText.substring(0, 200)}`
      });
    }

    if (!offResponse.ok) {
      return response.status(500).json({
        success: false,
        error: `OFF API responded with status: ${offResponse.status} - ${offResult.status_verbose || responseText}`
      });
    }

    console.log(`✅ OFF Response:`, {
      status: offResult.status,
      status_verbose: offResult.status_verbose
    });

    if (offResult.status === 1 || offResult.status_verbose === 'fields saved') {
      return response.status(200).json({
        success: true,
        message: 'Your contribution has been successfully submitted to Open Food Facts!',
        details: offResult
      });
    } else {
      return response.status(500).json({
        success: false,
        error: offResult.status_verbose || 'OFF contribution failed'
      });
    }

  } catch (error) {
    console.error('❌ OFF Contribution Error:', error.message);

    // Check for specific error types
    if (error.message.includes('401') || error.message.includes('403')) {
      return response.status(401).json({
        success: false,
        error: 'Authentication failed. Please verify: 1) You are using your OFF USERNAME (not email), 2) Password is correct',
        details: error.message
      });
    } else if (error.message.includes('timeout')) {
      return response.status(408).json({
        success: false,
        error: 'Request timed out. OFF server may be busy, please try again.'
      });
    } else {
      return response.status(500).json({
        success: false,
        error: 'Failed to submit contribution to Open Food Facts.',
        details: error.message
      });
    }
  }
}
