const getsSchema = require('../../gets_v0_1_schema.json');

// Calculate Data Quality Score (25% weight)
const calculateDataScore = (parsedData) => {
  if (!parsedData || parsedData.length === 0) return 0;

  let totalScore = 0;
  let totalChecks = 0;

  // Check data completeness
  const completenessScore = calculateCompletenessScore(parsedData);
  totalScore += completenessScore * 0.4; // 40% of data score
  totalChecks += 0.4;

  // Check data consistency
  const consistencyScore = calculateConsistencyScore(parsedData);
  totalScore += consistencyScore * 0.3; // 30% of data score
  totalChecks += 0.3;

  // Check data format quality
  const formatScore = calculateFormatScore(parsedData);
  totalScore += formatScore * 0.3; // 30% of data score
  totalChecks += 0.3;

  return Math.round((totalScore / totalChecks) * 100);
};

// Calculate Coverage Score (35% weight)
const calculateCoverageScore = (fieldMappings) => {
  if (!fieldMappings) return 0;

  const standardFields = getsSchema.fields;
  const requiredFields = standardFields.filter(f => f.required);
  const optionalFields = standardFields.filter(f => !f.required);

  const mappedFields = Object.values(fieldMappings).filter(Boolean);
  const mappedRequired = mappedFields.filter(field => 
    requiredFields.some(req => req.path === field)
  );
  const mappedOptional = mappedFields.filter(field => 
    optionalFields.some(opt => opt.path === field)
  );

  // Required fields are weighted more heavily
  const requiredScore = (mappedRequired.length / requiredFields.length) * 100;
  const optionalScore = (mappedOptional.length / optionalFields.length) * 100;

  // Weighted average: 70% required, 30% optional
  const coverageScore = (requiredScore * 0.7) + (optionalScore * 0.3);
  
  return Math.round(Math.min(coverageScore, 100));
};

// Calculate Rules Score (30% weight)
const calculateRulesScore = (ruleResults) => {
  if (!ruleResults || !ruleResults.ruleResults) return 0;

  const rules = ruleResults.ruleResults;
  const ruleWeights = {
    'REQUIRED_FIELD': 0.25,
    'DATE_FORMAT': 0.15,
    'CURRENCY_VALID': 0.20,
    'VAT_CALCULATION': 0.20,
    'LINE_MATH': 0.10,
    'TRN_PRESENT': 0.10
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(rules).forEach(([ruleName, result]) => {
    if (ruleWeights[ruleName]) {
      const total = result.passed + result.failed;
      const successRate = total > 0 ? (result.passed / total) * 100 : 100;
      totalScore += successRate * ruleWeights[ruleName];
      totalWeight += ruleWeights[ruleName];
    }
  });

  return Math.round(totalWeight > 0 ? (totalScore / totalWeight) : 100);
};

// Calculate Posture Score (10% weight)
const calculatePostureScore = (questionnaire) => {
  if (!questionnaire || typeof questionnaire !== 'object') return 50; // Default neutral score

  let score = 0;
  let maxScore = 0;

  // Webhooks support (25% of posture score)
  if (questionnaire.webhooks === true) {
    score += 25;
  } else if (questionnaire.webhooks === false) {
    score += 0;
  } else {
    score += 12.5; // Unknown
  }
  maxScore += 25;

  // Sandbox environment (25% of posture score)
  if (questionnaire.sandbox_env === true) {
    score += 25;
  } else if (questionnaire.sandbox_env === false) {
    score += 10; // Production is good but sandbox is better for testing
  } else {
    score += 17.5; // Unknown
  }
  maxScore += 25;

  // Retry mechanism (25% of posture score)
  if (questionnaire.retries === true) {
    score += 25;
  } else if (questionnaire.retries === false) {
    score += 5; // No retries is problematic
  } else {
    score += 15; // Unknown
  }
  maxScore += 25;

  // Error handling (25% of posture score)
  if (questionnaire.error_handling === true) {
    score += 25;
  } else if (questionnaire.error_handling === false) {
    score += 5;
  } else {
    score += 15; // Unknown
  }
  maxScore += 25;

  return Math.round(maxScore > 0 ? (score / maxScore) * 100 : 50);
};

// Calculate Overall Weighted Score
const calculateOverallScore = (categoryScores) => {
  const weights = {
    data: 0.25,      // 25%
    coverage: 0.35,  // 35%
    rules: 0.30,     // 30%
    posture: 0.10    // 10%
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([category, weight]) => {
    if (categoryScores[category] !== undefined) {
      totalScore += categoryScores[category] * weight;
      totalWeight += weight;
    }
  });

  return Math.round(totalWeight > 0 ? (totalScore / totalWeight) : 0);
};

// Helper functions for data quality assessment
const calculateCompletenessScore = (data) => {
  if (!data || data.length === 0) return 0;

  let totalFields = 0;
  let filledFields = 0;

  data.forEach(row => {
    Object.values(row).forEach(value => {
      totalFields++;
      if (value !== null && value !== undefined && value !== '') {
        filledFields++;
      }
    });
  });

  return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
};

const calculateConsistencyScore = (data) => {
  if (!data || data.length === 0) return 100;

  let consistencyIssues = 0;
  let totalChecks = 0;

  // Check for consistent data types in columns
  const columns = Object.keys(data[0] || {});
  
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length > 1) {
      totalChecks++;
      
      // Check if all values are of the same type
      const firstType = typeof values[0];
      const inconsistentTypes = values.filter(v => typeof v !== firstType).length;
      
      if (inconsistentTypes > 0) {
        consistencyIssues += inconsistentTypes / values.length;
      }
    }
  });

  return totalChecks > 0 ? Math.max(0, 100 - (consistencyIssues / totalChecks) * 100) : 100;
};

const calculateFormatScore = (data) => {
  if (!data || data.length === 0) return 100;

  let formatIssues = 0;
  let totalChecks = 0;

  data.forEach(row => {
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        totalChecks++;
        
        // Check for common format issues
        if (typeof value === 'string') {
          // Check for excessive whitespace
          if (value !== value.trim()) {
            formatIssues += 0.1;
          }
          
          // Check for mixed case inconsistencies
          if (key.toLowerCase().includes('name') && value !== value.trim()) {
            formatIssues += 0.1;
          }
        }
      }
    });
  });

  return totalChecks > 0 ? Math.max(0, 100 - (formatIssues / totalChecks) * 100) : 100;
};

module.exports = {
  calculateDataScore,
  calculateCoverageScore,
  calculateRulesScore,
  calculatePostureScore,
  calculateOverallScore
};