// SustainScan Backend API - Health Check
// Deployed as Vercel Serverless Function

export default function handler(request, response) {
  if (request.method === 'GET') {
    return response.status(200).json({
      service: 'SustainScan Backend API',
      version: '1.0.0',
      platform: 'Vercel Serverless',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api',
        'POST /api/contribute/off',
        'POST /api/alternatives/ai'
      ]
    });
  }

  return response.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET']
  });
}
