// Packaging Impact Service for sustainability analysis

// Packaging Impact Database - based on scientific studies and LCA data
const PACKAGING_IMPACT_DATABASE = {
  // Containers
  'jar': {
    co2_kg_per_kg: 0.4,
    recyclability: 85,
    landfill_time: '∞ (but reusable)',
    ocean_impact: 'low',
    score: 'B',
    color: 'green',
    description: 'Glass jars are highly recyclable and often reusable, making them an eco-friendly choice'
  },
  'bottle': {
    co2_kg_per_kg: 1.8,  // Average between PET and glass
    recyclability: 67,
    landfill_time: '300 years',
    ocean_impact: 'moderate microplastic',
    score: 'C',
    color: 'yellow',
    description: 'Bottles vary by material but require proper recycling to minimize environmental impact'
  },

  // Plastic types (generally poor environmental impact)
  'plastic': {
    co2_kg_per_kg: 2.1,
    recyclability: 32,
    landfill_time: '500 years',
    ocean_impact: 'high microplastic',
    score: 'E',
    color: 'red',
    description: 'Single-use plastic creates long-term waste and microplastic pollution'
  },
  'pet': {
    co2_kg_per_kg: 1.8,
    recyclability: 29,
    landfill_time: '500 years',
    ocean_impact: 'high microplastic',
    score: 'E',
    color: 'red',
    description: 'PET plastic contributes to ocean microplastics and has low recyclability'
  },
  'hdpe': {
    co2_kg_per_kg: 1.5,
    recyclability: 12,
    landfill_time: '700 years',
    ocean_impact: 'very high microplastic',
    score: 'E',
    color: 'red',
    description: 'HDPE plastic persists in environment for hundreds of years'
  },

  // Metal cans (aluminum/steel)
  'can': {  // Added as requested - metal drinks/food cans
    co2_kg_per_kg: 1.8,
    recyclability: 88,
    landfill_time: '500 years',
    ocean_impact: 'moderate (lifetime ~100 years)',
    score: 'C',
    color: 'yellow',
    description: 'Aluminum cans are highly recyclable but require significant energy to produce'
  },
  'aluminum': {
    co2_kg_per_kg: 1.5,
    recyclability: 88,
    landfill_time: '500 years',
    ocean_impact: 'moderate toxicity',
    score: 'C',
    color: 'yellow',
    description: 'Energy-intensive to produce but highly recyclable'
  },

  // Glass (good when recycled, requires energy for transport)
  'glass': {
    co2_kg_per_kg: 0.4,
    recyclability: 85,
    landfill_time: '∞ (but reusable)',
    ocean_impact: 'low',
    score: 'B',
    color: 'green',
    description: 'Heavy delivery increases transport CO2 but fully recyclable forever'
  },

  // Paper/Cardboard (excellent environmental choice)
  'cardboard': {
    co2_kg_per_kg: 0.8,
    recyclability: 88,
    landfill_time: '2-3 months',
    ocean_impact: 'biodegradable',
    score: 'A',
    color: 'green',
    description: 'Renewable, biodegradable, and highly recyclable'
  },
  'paper': {
    co2_kg_per_kg: 0.6,
    recyclability: 72,
    landfill_time: '2-3 months',
    ocean_impact: 'biodegradable',
    score: 'B',
    color: 'green',
    description: 'Renewable and biodegradable when composted'
  }
};

export function analyzePackagingImpact(packagingText) {
  if (!packagingText || packagingText === 'Not specified') {
    return {
      impact: 'unknown',
      score: 'Unknown',
      details: 'No packaging information available',
      color: 'gray'
    };
  }

  // Analyze packaging text for materials
  const materials = extractMaterialsFromText(packagingText.toLowerCase());

  if (materials.length === 0) {
    return {
      impact: 'unknown',
      score: 'B',  // Assume neutral if text unclear
      details: `Packaging: ${packagingText}`,
      color: 'yellow',
      materials: ['unspecified']
    };
  }

  // Calculate average impact from all materials
  let totalCo2 = 0;
  let totalRecyclability = 0;
  let worstScore = 'A';
  let worstColor = 'green';
  let descriptions = [];
  const oceanImpacts = [];

  materials.forEach(material => {
    const impact = PACKAGING_IMPACT_DATABASE[material] || PACKAGING_IMPACT_DATABASE.paper; // Default to paper

    totalCo2 += impact.co2_kg_per_kg;
    totalRecyclability += impact.recyclability;
    descriptions.push(impact.description);

    // Track worst score (environmental safety pattern)
    if (getScoreRank(worstScore) < getScoreRank(impact.score)) {
      worstScore = impact.score;
      worstColor = impact.color;
    }

    if (impact.ocean_impact !== 'low') {
      oceanImpacts.push(impact.ocean_impact);
    }
  });

  const avgCo2 = (totalCo2 / materials.length).toFixed(2);
  const avgRecycle = Math.round(totalRecyclability / materials.length);

  return {
    impact: 'calculated',
    score: worstScore,
    color: worstColor,
    co2_kg_per_kg: parseFloat(avgCo2),
    recyclability_percent: avgRecycle,
    materials: materials,
    ocean_impact: oceanImpacts.length > 0 ? oceanImpacts : ['low'],
    landfill_time: materials.map(m => PACKAGING_IMPACT_DATABASE[m]?.landfill_time).filter(Boolean),
    description: descriptions[0], // Primary material description
    suggestions: generatePackagingSuggestions(materials, worstScore)
  };
}

// Extract material types from packaging text
function extractMaterialsFromText(text) {
  const materials = [];

  // Check for specific material mentions
  Object.keys(PACKAGING_IMPACT_DATABASE).forEach(material => {
    if (text.includes(material) ||
        text.includes(material + ' ') ||
        text.includes(' ' + material)) {
      materials.push(material);
    }
  });

  // Special patterns for common packaging
  if (text.includes('metal') || text.includes('tinplate')) {
    if (!materials.includes('can')) materials.push('aluminum'); // Assume aluminum for metal cans
  }

  if (text.includes('can') || text.includes('tin')) {
    if (!materials.includes('can')) materials.push('can');
  }

  if (text.includes('foil') || text.includes('metallic')) {
    if (!materials.includes('aluminum')) materials.push('aluminum');
  }

  if (text.includes('box') && !materials.includes('cardboard')) {
    materials.push('cardboard'); // Boxes are usually cardboard
  }

  if (text.includes('bag') && !materials.some(m => ['plastic', 'paper', 'cardboard'].includes(m))) {
    materials.push('plastic'); // Assume plastic if not specified
  }

  // Detect bottle types
  if (text.includes('bottle')) {
    if (text.includes('glass')) {
      materials.push('glass');
    } else if (!materials.includes('plastic')) {
      materials.push('pet'); // Common bottle plastic
    }
  }

  return [...new Set(materials)]; // Remove duplicates
}

function getScoreRank(score) {
  const ranks = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4};
  return ranks[score] || 2;
}

function generatePackagingSuggestions(materials, score) {
  const suggestions = [];

  if (materials.includes('plastic') || materials.includes('pet') || materials.includes('hdpe')) {
    suggestions.push('Consider glass or paper alternatives');
  }

  if (score === 'E') {
    suggestions.push('Choose products with sustainable packaging or recycle properly');
  }

  if (materials.includes('can') || materials.includes('aluminum')) {
    suggestions.push('Cans are recyclable - check local recycling programs');
  }

  if (materials.includes('glass')) {
    suggestions.push('Glass can be reused or recycled indefinitely');
  }

  return suggestions.length > 0 ? suggestions : ['Product has basic packaging information'];
}
