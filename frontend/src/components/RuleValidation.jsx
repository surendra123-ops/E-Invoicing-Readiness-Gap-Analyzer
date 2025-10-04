import React, { useState } from 'react'
import { checkRules } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

const RuleValidation = ({ uploadData, fieldMapping, onValidationComplete, onCancel }) => {
  const [validationResults, setValidationResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRunValidation = async () => {
    try {
      setLoading(true)
      setError(null)

      const results = await checkRules(uploadData.uploadId)
      setValidationResults(results)
      
      // Call callback with validation results
      setTimeout(() => {
        onValidationComplete(results)
      }, 2000)

    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to run validation')
    } finally {
      setLoading(false)
    }
  }

  const getRuleDisplayName = (rule) => {
    const ruleNames = {
      'REQUIRED_FIELD': 'Required Field',
      'DATE_FORMAT': 'Date Format',
      'CURRENCY_VALID': 'Currency Validation',
      'VAT_CALCULATION': 'VAT Calculation',
      'LINE_MATH': 'Line Item Math',
      'TRN_PRESENT': 'TRN Presence',
      'DATA_TYPE': 'Data Type'
    }
    return ruleNames[rule] || rule
  }

  const getSeverityClass = (rule) => {
    const severityMap = {
      'REQUIRED_FIELD': 'high',
      'DATE_FORMAT': 'medium',
      'CURRENCY_VALID': 'high',
      'VAT_CALCULATION': 'high',
      'LINE_MATH': 'medium',
      'TRN_PRESENT': 'high',
      'DATA_TYPE': 'medium'
    }
    return severityMap[rule] || 'low'
  }

  if (loading) {
    return (
      <div className="validation-loading">
        <LoadingSpinner size="large" />
        <h3>Running Rule Validation...</h3>
        <p>Analyzing {uploadData?.rowsParsed} rows against e-invoicing rules</p>
      </div>
    )
  }

  if (validationResults) {
    return (
      <div className="validation-results">
        <div className="results-header">
          <div className="results-summary">
            <div className="score-circle">
              <div className="score-number">{validationResults.score}</div>
              <div className="score-label">Score</div>
            </div>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-number">{validationResults.rowsChecked}</span>
                <span className="stat-label">Total Rows</span>
              </div>
              <div className="stat success">
                <span className="stat-number">{validationResults.passed}</span>
                <span className="stat-label">Passed</span>
              </div>
              <div className="stat error">
                <span className="stat-number">{validationResults.failed}</span>
                <span className="stat-label">Failed</span>
              </div>
            </div>
          </div>
        </div>

        {validationResults.issues.length > 0 ? (
          <div className="issues-section">
            <h4>Validation Issues</h4>
            <div className="issues-table-container">
              <table className="issues-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Field</th>
                    <th>Rule</th>
                    <th>Error</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResults.issues.slice(0, 50).map((issue, index) => (
                    <tr key={index} className={`issue-row severity-${getSeverityClass(issue.rule)}`}>
                      <td className="row-number">{issue.row}</td>
                      <td className="field-name">{issue.field}</td>
                      <td className="rule-name">
                        <span className={`rule-badge ${getSeverityClass(issue.rule)}`}>
                          {getRuleDisplayName(issue.rule)}
                        </span>
                      </td>
                      <td className="error-message">{issue.error}</td>
                      <td className="error-value">
                        {issue.value !== null && issue.value !== undefined ? 
                          String(issue.value).substring(0, 50) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validationResults.issues.length > 50 && (
                <div className="issues-footer">
                  <p>Showing first 50 issues out of {validationResults.issues.length} total</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-issues">
            <div className="success-icon">✅</div>
            <h4>All Rules Passed!</h4>
            <p>Your data successfully passed all validation rules.</p>
          </div>
        )}

        <div className="validation-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Back to Mapping
          </button>
          <button 
            onClick={() => onValidationComplete(validationResults)} 
            className="btn btn-primary"
          >
            Continue to Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rule-validation">
      <div className="validation-header">
        <h3>Run Rule Validation</h3>
        <p>Validate your mapped data against e-invoicing rules and get a compliance score.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="validation-info">
        <div className="info-card">
          <h4>What will be validated?</h4>
          <ul>
            <li>Required fields are present and not empty</li>
            <li>Date fields are in correct YYYY-MM-DD format</li>
            <li>Currency codes are valid ISO codes</li>
            <li>VAT calculations are correct</li>
            <li>Line item math is accurate</li>
            <li>TRN numbers are present</li>
            <li>Data types match schema requirements</li>
          </ul>
        </div>

        <div className="info-card">
          <h4>Mapping Summary</h4>
          <p><strong>Upload ID:</strong> {uploadData?.uploadId}</p>
          <p><strong>Rows to validate:</strong> {uploadData?.rowsParsed}</p>
          <p><strong>Mapped fields:</strong> {fieldMapping?.mappedFields}</p>
          <p><strong>Mapping ID:</strong> {fieldMapping?.mappingId}</p>
        </div>
      </div>

      <div className="validation-actions">
        <button onClick={onCancel} className="btn btn-secondary">
          Back to Mapping
        </button>
        <button onClick={handleRunValidation} className="btn btn-primary">
          Run Validation
        </button>
      </div>
    </div>
  )
}

export default RuleValidation
