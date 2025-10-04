import React, { useState, useEffect } from 'react'
import { getReportSummary, downloadReport } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

const ReportDownload = ({ uploadData, fieldMapping, validationResults, onComplete, onCancel }) => {
  const [reportSummary, setReportSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReportSummary()
  }, [])

  const loadReportSummary = async () => {
    try {
      setLoading(true)
      const summary = await getReportSummary(uploadData.uploadId)
      setReportSummary(summary)
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load report summary')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format) => {
    try {
      setDownloading(prev => ({ ...prev, [format]: true }))
      setError(null)

      await downloadReport(uploadData.uploadId, format)
      
      // Show success message briefly
      setTimeout(() => {
        setDownloading(prev => ({ ...prev, [format]: false }))
      }, 1000)

    } catch (error) {
      setError(error.response?.data?.message || error.message || `Failed to download ${format.toUpperCase()} report`)
      setDownloading(prev => ({ ...prev, [format]: false }))
    }
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

  if (loading) {
    return (
      <div className="report-loading">
        <LoadingSpinner size="large" />
        <h3>Preparing Your Report...</h3>
        <p>Generating comprehensive e-invoicing readiness analysis</p>
      </div>
    )
  }

  return (
    <div className="report-download">
      <div className="report-header">
        <div className="success-icon">📊</div>
        <h3>Your E-Invoicing Readiness Report is Ready!</h3>
        <p>Download your comprehensive analysis in your preferred format.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {reportSummary && (
        <div className="report-summary">
          <div className="summary-grid">
            <div className="summary-card">
              <h4>Upload Summary</h4>
              <div className="summary-details">
                <p><strong>Upload ID:</strong> {reportSummary.uploadId}</p>
                <p><strong>File:</strong> {reportSummary.uploadSummary.originalFilename}</p>
                <p><strong>Rows:</strong> {reportSummary.uploadSummary.rowsParsed}</p>
                <p><strong>Uploaded:</strong> {new Date(reportSummary.uploadSummary.uploadedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="summary-card">
              <h4>Validation Results</h4>
              <div className="summary-details">
                <div className="score-display">
                  <span className="score-number">{reportSummary.validationSummary.score}%</span>
                  <span className={`readiness-badge ${getReadinessBadgeClass(reportSummary.validationSummary.readinessLevel)}`}>
                    {reportSummary.validationSummary.readinessLevel}
                  </span>
                </div>
                <p><strong>Passed:</strong> {reportSummary.validationSummary.passed} rows</p>
                <p><strong>Failed:</strong> {reportSummary.validationSummary.failed} rows</p>
                <p><strong>Issues:</strong> {reportSummary.validationSummary.issuesCount}</p>
              </div>
            </div>

            <div className="summary-card">
              <h4>Field Mapping</h4>
              <div className="summary-details">
                <p><strong>Mapping ID:</strong> {reportSummary.mappingSummary?.mappingId || 'N/A'}</p>
                <p><strong>Mapped Fields:</strong> {reportSummary.mappingSummary?.mappedFields || 0}</p>
                <p><strong>Coverage:</strong> {reportSummary.mappingSummary ? 
                  Math.round((reportSummary.mappingSummary.mappedFields / 20) * 100) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportSummary?.coverageAnalysis && (
        <div className="coverage-section">
          <h4>Field Coverage Analysis</h4>
          <div className="coverage-grid">
            <div className="coverage-card matched">
              <div className="coverage-header">
                <span className="coverage-icon">✅</span>
                <h5>Matched Fields</h5>
              </div>
              <div className="coverage-count">{reportSummary.coverageAnalysis.summary.mappedFields}</div>
              <div className="coverage-details">
                {reportSummary.coverageAnalysis.matched.slice(0, 5).map((field, index) => (
                  <div key={index} className="field-item">
                    <span className="field-name">{field.source}</span>
                    <span className="field-arrow">→</span>
                    <span className="field-target">{field.target}</span>
                  </div>
                ))}
                {reportSummary.coverageAnalysis.matched.length > 5 && (
                  <div className="more-fields">+{reportSummary.coverageAnalysis.matched.length - 5} more</div>
                )}
              </div>
            </div>

            <div className="coverage-card close">
              <div className="coverage-header">
                <span className="coverage-icon">🔍</span>
                <h5>Close Matches</h5>
              </div>
              <div className="coverage-count">{reportSummary.coverageAnalysis.summary.closeMatches}</div>
              <div className="coverage-details">
                {reportSummary.coverageAnalysis.close.slice(0, 3).map((field, index) => (
                  <div key={index} className="field-item">
                    <span className="field-name">{field.source}</span>
                    <span className="field-suggestions">
                      {field.suggestions.map(s => s.field).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="coverage-card missing">
              <div className="coverage-header">
                <span className="coverage-icon">❌</span>
                <h5>Missing Fields</h5>
              </div>
              <div className="coverage-count">{reportSummary.coverageAnalysis.summary.missingFields}</div>
              <div className="coverage-details">
                {reportSummary.coverageAnalysis.missing.slice(0, 5).map((field, index) => (
                  <div key={index} className="field-item">
                    <span className="field-name">{field.field}</span>
                    <span className="field-required">{field.required ? 'Required' : 'Optional'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="score-breakdown">
        <h4>Score Breakdown</h4>
        <div className="score-bars">
          <div className="score-bar">
            <div className="score-label">Data Quality</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ width: `${reportSummary.categoryScores?.data || 0}%` }}
              ></div>
              <span className="score-value">{reportSummary.categoryScores?.data || 0}%</span>
            </div>
          </div>
          
          <div className="score-bar">
            <div className="score-label">Field Coverage</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ width: `${reportSummary.categoryScores?.coverage || 0}%` }}
              ></div>
              <span className="score-value">{reportSummary.categoryScores?.coverage || 0}%</span>
            </div>
          </div>
          
          <div className="score-bar">
            <div className="score-label">Rule Compliance</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ width: `${reportSummary.categoryScores?.rules || 0}%` }}
              ></div>
              <span className="score-value">{reportSummary.categoryScores?.rules || 0}%</span>
            </div>
          </div>
          
          <div className="score-bar">
            <div className="score-label">Technical Posture</div>
            <div className="score-bar-container">
              <div 
                className="score-bar-fill" 
                style={{ width: `${reportSummary.categoryScores?.posture || 0}%` }}
              ></div>
              <span className="score-value">{reportSummary.categoryScores?.posture || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="download-section">
        <h4>Download Report</h4>
        <p>Choose your preferred format for detailed analysis and sharing:</p>
        
        <div className="download-options">
          <div className="download-option">
            <div className="format-info">
              <div className="format-icon">📄</div>
              <div className="format-details">
                <h5>JSON Report</h5>
                <p>Structured data format for technical analysis and integration</p>
                <ul>
                  <li>Complete validation results</li>
                  <li>Field mapping details</li>
                  <li>Machine-readable format</li>
                </ul>
              </div>
            </div>
            <button 
              className={`btn btn-primary ${downloading.json ? 'downloading' : ''}`}
              onClick={() => handleDownload('json')}
              disabled={downloading.json}
            >
              {downloading.json ? <LoadingSpinner size="small" /> : 'Download JSON'}
            </button>
          </div>

          <div className="download-option">
            <div className="format-info">
              <div className="format-icon">📊</div>
              <div className="format-details">
                <h5>CSV Report</h5>
                <p>Spreadsheet format for data analysis and review</p>
                <ul>
                  <li>Tabular issue summary</li>
                  <li>Field mapping table</li>
                  <li>Excel-compatible format</li>
                </ul>
              </div>
            </div>
            <button 
              className={`btn btn-primary ${downloading.csv ? 'downloading' : ''}`}
              onClick={() => handleDownload('csv')}
              disabled={downloading.csv}
            >
              {downloading.csv ? <LoadingSpinner size="small" /> : 'Download CSV'}
            </button>
          </div>

          <div className="download-option">
            <div className="format-info">
              <div className="format-icon">📋</div>
              <div className="format-details">
                <h5>PDF Report</h5>
                <p>Professional document for presentation and archiving</p>
                <ul>
                  <li>Executive summary</li>
                  <li>Visual charts and tables</li>
                  <li>Print-ready format</li>
                </ul>
              </div>
            </div>
            <button 
              className={`btn btn-primary ${downloading.pdf ? 'downloading' : ''}`}
              onClick={() => handleDownload('pdf')}
              disabled={downloading.pdf}
            >
              {downloading.pdf ? <LoadingSpinner size="small" /> : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="report-actions">
        <button onClick={onCancel} className="btn btn-secondary">
          Back to Results
        </button>
        <button onClick={onComplete} className="btn btn-success">
          Complete Analysis
        </button>
      </div>
    </div>
  )
}

export default ReportDownload
