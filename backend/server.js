// SustainScan Backend Server
// Handles API integrations (Open Food Facts, Carbon APIs, etc.) with proper CORS handling

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fetch from 'node-fetch';
// import FormData from 'form-data'; // No longer needed, using URLSearchParams instead

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend development
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server + potential future prod URL
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
