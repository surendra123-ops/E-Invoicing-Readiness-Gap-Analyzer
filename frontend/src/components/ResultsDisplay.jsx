


import React from 'react'

const ResultsDisplay = ({ reportData, onDownload, onShare }) => {
  if (!reportData) return null

  const { summary, scoring, fieldMapping, validationResults, issues, recommendations } = reportData

  const getScoreColor = (score) => {
    if (score >= 90) return '#28a745'
    if (score >= 70) return '#ffc107'
    if (score >= 50) return '#fd7e14'
    return '#dc3545'
  }

  const getReadinessBadgeClass = (level) => {
    const levelMap = {
      'HIGH READINESS': 'badge-success',
      'MEDIUM READINESS': 'badge-warning',
      'LOW READINESS': 'badge-danger',
      'NEEDS ATTENTION': 'badge-danger'
    }
    return levelMap[level] || 'badge-secondary'
  }

  return (
    <div className="results-display">
      {/* Overall Score Section */}
      <div className="overall-score-section">
        <div className="score-circle">
          <div 
            className="score-number" 
            style={{ color: getScoreColor(summary.overallScore) }}
          >
            {summary.overallScore}%
          </div>
          <div className="score-label">Overall Readiness</div>
        </div>
        <div className="readiness-badge">
          <span className={`badge ${getReadinessBadgeClass(summary.readinessLevel)}`}>
            {summary.readinessLevel}
          </span>
        </div>
      </div>

      {/* Four Category Scores */}
      <div className="category-scores">
        <h3>Category Breakdown</h3>
        <div className="score-bars">
          <div className="score-bar">
            <div className="score-label">Data Quality</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ 
                  width: `${scoring.data}%`, 
                  backgroundColor: getScoreColor(scoring.data) 
                }}
              />
              <span className="score-value">{scoring.data}%</span>
            </div>
            <div className="score-weight">Weight: {scoring.breakdown.dataWeight}%</div>
          </div>

          <div className="score-bar">
            <div className="score-label">Field Coverage</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ 
                  width: `${scoring.coverage}%`, 
                  backgroundColor: getScoreColor(scoring.coverage) 
                }}
              />
              <span className="score-value">{scoring.coverage}%</span>
            </div>
            <div className="score-weight">Weight: {scoring.breakdown.coverageWeight}%</div>
          </div>

          <div className="score-bar">
            <div className="score-label">Rule Compliance</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ 
                  width: `${scoring.rules}%`, 
                  backgroundColor: getScoreColor(scoring.rules) 
                }}
              />
              <span className="score-value">{scoring.rules}%</span>
            </div>
            <div className="score-weight">Weight: {scoring.breakdown.rulesWeight}%</div>
          </div>

          <div className="score-bar">
            <div className="score-label">Data Posture</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ 
                  width: `${scoring.posture}%`, 
                  backgroundColor: getScoreColor(scoring.posture) 
                }}
              />
              <span className="score-value">{scoring.posture}%</span>
            </div>
            <div className="score-weight">Weight: {scoring.breakdown.postureWeight}%</div>
          </div>
        </div>
      </div>

      {/* Field Coverage Analysis */}
      <div className="coverage-section">
        <h3>Field Coverage Analysis</h3>
        <div className="coverage-summary">
          <div className="coverage-stat">
            <span className="stat-number">{fieldMapping.coverage.summary.mapped}</span>
            <span className="stat-label">Matched Fields</span>
          </div>
          <div className="coverage-stat">
            <span className="stat-number">{fieldMapping.coverage.summary.missing}</span>
            <span className="stat-label">Missing Fields</span>
          </div>
          <div className="coverage-stat">
            <span className="stat-number">{fieldMapping.coverage.summary.coverage}%</span>
            <span className="stat-label">Coverage</span>
          </div>
        </div>

        <div className="coverage-details">
          <div className="coverage-category">
            <h4>✅ Matched Fields</h4>
            <div className="field-list">
              {fieldMapping.coverage.matched.map((field, index) => (
                <div key={index} className="field-item matched">
                  <span className="source-field">{field.source}</span>
                  <span className="arrow">→</span>
                  <span className="target-field">{field.target}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="coverage-category">
            <h4>❌ Missing Fields</h4>
            <div className="field-list">
              {fieldMapping.coverage.missing.slice(0, 10).map((field, index) => (
                <div key={index} className="field-item missing">
                  <span className="field-name">{field.field}</span>
                  <span className={`field-type ${field.required ? 'required' : 'optional'}`}>
                    {field.type} {field.required ? '(Required)' : '(Optional)'}
                  </span>
                </div>
              ))}
              {fieldMapping.coverage.missing.length > 10 && (
                <div className="more-fields">
                  +{fieldMapping.coverage.missing.length - 10} more missing fields
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rule Findings */}
      <div className="rule-findings">
        <h3>Rule Validation Results</h3>
        <div className="rule-summary">
          <div className="rule-stat">
            <span className="stat-number">{validationResults.passed}</span>
            <span className="stat-label">Passed Rows</span>
          </div>
          <div className="rule-stat">
            <span className="stat-number">{validationResults.failed}</span>
            <span className="stat-label">Failed Rows</span>
          </div>
          <div className="rule-stat">
            <span className="stat-number">{issues.length}</span>
            <span className="stat-label">Total Issues</span>
          </div>
        </div>

        {issues.length > 0 && (
          <div className="issues-preview">
            <h4>Top Issues</h4>
            <div className="issues-list">
              {issues.slice(0, 5).map((issue, index) => (
                <div key={index} className="issue-item">
                  <span className="issue-row">Row {issue.row}</span>
                  <span className="issue-field">{issue.field}</span>
                  <span className="issue-rule">{issue.rule}</span>
                  <span className="issue-error">{issue.error}</span>
                </div>
              ))}
              {issues.length > 5 && (
                <div className="more-issues">
                  +{issues.length - 5} more issues found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h3>Recommendations</h3>
        <div className="recommendations-list">
          {recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="recommendation-icon">💡</span>
              <span className="recommendation-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button onClick={() => onDownload('json')} className="btn btn-primary">
          📄 Download JSON Report
        </button>
        <button onClick={() => onDownload('csv')} className="btn btn-primary">
          📊 Download CSV Report
        </button>
        <button onClick={() => onDownload('pdf')} className="btn btn-primary">
          📋 Download PDF Report
        </button>
        <button onClick={() => onShare(reportData.reportId)} className="btn btn-secondary">
          🔗 Copy Shareable Link
        </button>
      </div>
    </div>
  )
}

export default ResultsDisplay