// Barcode prefix lookup service using GS1 country codes for origin inference

// GS1 Country Prefix Mapping (Major food manufacturers)
const GS1_PREFIX_TO_COUNTRY = {
  // India (Primary - GS1 India assigned range)
  '890': 'India',
  '891': 'India',
  '892': 'India',
  '893': 'India',
  '894': 'India',
  '895': 'India',
  '896': 'India',
  '897': 'India',
  '898': 'India',
  '899': 'India',

  // Europe
  '30': 'France',
  '31': 'France',
  '32': 'France',
  '33': 'France',
  '34': 'France',
  '35': 'France',
  '36': 'France',
  '37': 'France',
  '380': 'Bulgaria',
  '383': 'Slovenia',
  '385': 'Croatia',
  '387': 'Bosnia Herzegovina',
  '389': 'North Macedonia',
  '40': 'Germany',
  '41': 'Germany',
  '42': 'Germany',
  '43': 'Germany',
  '44': 'Germany',
  '45': 'Japan',
  '46': 'Russia',
  '470': 'Kyrgyzstan',
  '471': 'Taiwan',
  '474': 'Estonia',
  '475': 'Latvia',
  '477': 'Lithuania',
  '479': 'Sri Lanka',
  '480': 'Philippines',
  '482': 'Ukraine',
  '484': 'Moldova',
  '485': 'Armenia',
  '486': 'Georgia',
  '487': 'Kazakhstan',
  '488': 'Tajikistan',
  '489': 'Hong Kong',
  '49': 'Japan',
  '50': 'United Kingdom',
  '520': 'Greece',
  '528': 'Lebanon',
  '529': 'Cyprus',
  '531': 'North Macedonia',
  '535': 'Malta',
  '539': 'Ireland',
  '54': 'Belgium & Luxembourg',
  '560': 'Portugal',
  '569': 'Iceland',
  '57': 'Denmark',
  '590': 'Poland',
  '594': 'Romania',
  '599': 'Hungary',
  '600': 'South Africa',
  '601': 'South Africa',
  '608': 'Bahrain',
  '609': 'Mauritius',
  '611': 'Morocco',
  '613': 'Algeria',
  '615': 'Nigeria',
  '616': 'Kenya',
  '617': 'Cameroon',
  '618': 'Ivory Coast',
  '619': 'Tunisia',
  '621': 'Syria',
  '622': 'Egypt',
  '623': 'Brunei',
  '624': 'Libya',
  '625': 'Jordan',
  '626': 'Iran',
  '627': 'Kuwait',
  '628': 'Saudi Arabia',
  '629': 'United Arab Emirates',
  '64': 'Yugoslavia', // Serbia now
  '690': 'China',
  '691': 'China',
  '692': 'China',
  '693': 'China',
  '694': 'China',
  '695': 'China',
  '697': 'China',
  '698': 'China',
  '699': 'China',
  '70': 'Norway',
  '729': 'Israel',
  '73': 'Sweden',
  '740': 'Guatemala',
  '741': 'El Salvador',
  '742': 'Honduras',
  '743': 'Nicaragua',
  '744': 'Costa Rica',
  '745': 'Panama',
  '746': 'Dominican Republic',
  '750': 'Mexico',
  '759': 'Venezuela',
  '76': 'Switzerland',
  '770': 'Colombia',
  '773': 'Uruguay',
  '775': 'Peru',
  '777': 'Bolivia',
  '778': 'Argentina',
  '779': 'Ecuador',
  '780': 'Chile',
  '784': 'Paraguay',
  '785': 'Peru',
  '786': 'Ecuador',
  '789': 'Brazil',
  '790': 'Brazil',
  '80': 'Italy',
  '81': 'Italy',
  '82': 'Italy',
  '83': 'Italy',
  '84': 'Spain',
  '850': 'Cuba',
  '858': 'Slovakia',
  '859': 'Czech Republic',
  '860': 'Serbia',
  '865': 'Mongolia',
  '867': 'North Korea',
  '868': 'Turkey',
  '869': 'Turkey',
  '870': 'Netherlands',
  '880': 'South Korea',
  '884': 'Cambodia',
  '885': 'Thailand',
  '888': 'Singapore',
  // '893': 'Vietnam', // Duplicate removed - now India
  // '896': 'Pakistan', // Duplicate removed - now India
  // '899': 'Indonesia', // Duplicate removed - now India
  '90': 'Austria',
  '91': 'Austria',
  '93': 'Australia',
  '94': 'New Zealand',
  '955': 'Malaysia',
  '958': 'Macau',
  '977': 'Israel',
  '978': 'Jordan',
  '979': 'Colombia',
  '980': 'Philippines'
};

// Special cases for major food brands (these may not follow GS1 country codes)
const BRAND_ORIGIN_OVERRIDES = {
  'ferrero': 'Italy',
  'nestle': 'Switzerland',
  'danone': 'France',
  'kraft': 'USA',
  'cocacola': 'USA',
  'pepsi': 'USA',
  'mars': 'USA',
  'barilla': 'Italy',
  'heinz': 'USA',
  'unilever': 'Netherlands',
  'procter': 'USA',
  'mondelez': 'USA',
  'cargill': 'USA'
};

/**
 * Estimate product origin from barcode GS1 prefix
 * @param {string} barcode - The full barcode number
 * @param {string} brand - Optional brand name for override
 * @returns {object} Origin information with confidence level
 */
export function getOriginFromBarcode(barcode, brand = '') {
  try {
    if (!barcode || barcode.length < 8) {
      return { country: 'Unknown', confidence: 'low', method: 'invalid' };
    }

    // First check brand overrides (highest confidence)
    if (brand) {
      const brandLower = brand.toLowerCase();
      for (const [brandName, origin] of Object.entries(BRAND_ORIGIN_OVERRIDES)) {
        if (brandLower.includes(brandName)) {
          return {
            country: origin,
            confidence: 'high',
            method: 'brand_override',
            brand_matched: brandName
          };
        }
      }
    }

    // Analyze GS1 prefix (next highest confidence)
    const prefix = findGs1Prefix(barcode);
    const prefixCountry = GS1_PREFIX_TO_COUNTRY[prefix];

    if (prefixCountry) {
      // Some country names need refinement
      const refinedCountry = refineCountryName(prefixCountry, barcode, brand);

      return {
        country: refinedCountry,
        confidence: 'medium',
        method: 'gs1_prefix',
        prefix_used: prefix,
        original_country: prefixCountry
      };
    }

    // Fallback: Check for known barcode patterns
    const fallbackResult = getBarcodePatternFallback(barcode);
    if (fallbackResult) {
      return { ...fallbackResult, confidence: 'low' };
    }

  } catch (error) {
    console.warn('Barcode origin lookup failed:', error);
  }

  return { country: 'Unknown', confidence: 'none', method: 'error' };
}

/**
 * Find the GS1 country prefix from barcode
 */
function findGs1Prefix(barcode) {
  // EAN-13 codes: first 3 digits are country prefix
  // Except when they start with 0, then it's 2 digits

  if (barcode.startsWith('0')) {
    // Common products starting with 0
    return barcode.substring(0, 2);
  } else {
    // Standard 3-digit prefix
    return barcode.substring(0, 3);
  }
}

/**
 * Refine country names for better accuracy
 */
function refineCountryName(country, barcode, brand) {
  // Handle composite countries
  if (country === 'Belgium & Luxembourg') {
    // European food often Belgian or Dutch
    if (brand?.toLowerCase().includes('belgium')) return 'Belgium';
    if (brand?.toLowerCase().includes('luxembourg')) return 'Luxembourg';
    return 'Belgium'; // Most common
  }

  // Handle regional codes that may not match production
  if (country === 'Netherlands') {
    // Unilever HQ is NL but products made worldwide
    if (brand?.toLowerCase().includes('unilever')) return 'Netherlands';
  }

  return country;
}

/**
 * Fallback patterns for barcodes that don't match GS1 codes
 */
function getBarcodePatternFallback(barcode) {
  // Check for product codes that suggest origin
  if (barcode.startsWith('300') || barcode.startsWith('301')) {
    return { country: 'France', method: 'fallback_pattern' };
  }

  if (barcode.startsWith('400') || barcode.startsWith('401')) {
    return { country: 'Germany', method: 'fallback_pattern' };
  }

  if (barcode.startsWith('800') || barcode.startsWith('801')) {
    return { country: 'Italy', method: 'fallback_pattern' };
  }

  if (barcode.startsWith('30')) {
    return { country: 'France', method: 'fallback_pattern' };
  }

  if (barcode.startsWith('500')) {
    return { country: 'United Kingdom', method: 'fallback_pattern' };
  }

  return null;
}

/**
 * Get transport optimization hints based on origin
 */
export function getTransportHints(originCountry, destinationCountry) {
  const hints = [];

  // Short distance optimizations
  if (originCountry === destinationCountry) {
    hints.push('local_production');
  }

  // Regional preferences
  if (originCountry.includes('Europe') && destinationCountry.includes('Europe')) {
    hints.push('rail_preferred');
  }

  if (Math.abs(getCountryLat(originCountry) - getCountryLat(destinationCountry)) > 50) {
    hints.push('sea_preferred');
  }

  return hints;
}

/**
 * Very rough latitude approximation for distance calculation hints
 */
function getCountryLat(country) {
  const latitudes = {
    'France': 46,
    'Germany': 51,
    'Italy': 42,
    'Spain': 40,
    'United Kingdom': 54,
    'Netherlands': 52,
    'Belgium': 50,
    'Switzerland': 47,
    'USA': 40,
    'China': 35,
    'Brazil': -10,
    'India': 20
  };

  return latitudes[country] || 50; // Default to Europe
}

/**
 * Combine with Open Food Facts data for better accuracy
 */
export function enhanceOffDataWithBarcodeOrigin(offProductData) {
  const barcode = offProductData.code;
  const brand = offProductData.brand;

  const barcodeOrigin = getOriginFromBarcode(barcode, brand);

  // Only override if OFF has no origin data
  if (!offProductData.ecoscore_data ||
      offProductData.ecoscore_data.adjustments?.origins_of_ingredients?.warning === 'origins_are_100_percent_unknown') {

    return {
      ...offProductData,
      inferred_origin: barcodeOrigin
    };
  }

  return offProductData;
}

export { GS1_PREFIX_TO_COUNTRY, BRAND_ORIGIN_OVERRIDES };
