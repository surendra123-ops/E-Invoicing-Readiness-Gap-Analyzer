import React, { useState } from 'react'
import UploadSection from './components/UploadSection'
import PreviewSection from './components/PreviewSection'
import FieldMapping from './components/FieldMapping'
import RuleValidation from './components/RuleValidation'
import ReportDownload from './components/ReportDownload'
import History from './components/History'
import Header from './components/Header'
import './App.css'

function App() {
  const [uploadData, setUploadData] = useState(null)
  const [fieldMapping, setFieldMapping] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [currentStep, setCurrentStep] = useState('upload') // 'upload', 'preview', 'mapping', 'validation', 'report', 'history', 'complete'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleUploadSuccess = (data) => {
    setUploadData(data)
    setFieldMapping(null)
    setValidationResults(null)
    setCurrentStep('preview')
    setError(null)
  }

  const handleUploadError = (errorMessage) => {
    setError(errorMessage)
    setUploadData(null)
    setCurrentStep('upload')
  }

  const handleLoading = (isLoading) => {
    setLoading(isLoading)
  }

  const handleStartMapping = () => {
    setCurrentStep('mapping')
  }

  const handleMappingComplete = (mappingResult) => {
    setFieldMapping(mappingResult)
    setCurrentStep('validation')
  }

  const handleCancelMapping = () => {
    setCurrentStep('preview')
  }

  const handleValidationComplete = (validationResult) => {
    setValidationResults(validationResult)
    setCurrentStep('report')
  }

  const handleCancelValidation = () => {
    setCurrentStep('mapping')
  }

  const handleReportComplete = () => {
    setCurrentStep('complete')
  }

  const handleCancelReport = () => {
    setCurrentStep('validation')
  }

  const handleShowHistory = () => {
    setCurrentStep('history')
  }

  const handleBackFromHistory = () => {
    setCurrentStep('upload')
  }

  const handleSelectUpload = (upload) => {
    // Load the selected upload and navigate to appropriate step
    setUploadData({
      uploadId: upload.uploadId,
      rowsParsed: upload.rowsParsed,
      preview: [] // Will be loaded from API if needed
    })
    
    // Navigate to appropriate step based on status
    switch (upload.status) {
      case 'uploaded':
        setCurrentStep('preview')
        break
      case 'mapped':
        setCurrentStep('validation')
        break
      case 'validated':
        setCurrentStep('report')
        break
      case 'completed':
        setCurrentStep('report')
        break
      default:
        setCurrentStep('preview')
    }
  }

  const handleReset = () => {
    setUploadData(null)
    setFieldMapping(null)
    setValidationResults(null)
    setCurrentStep('upload')
    setError(null)
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <UploadSection 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            onLoading={handleLoading}
            loading={loading}
            error={error}
            onShowHistory={handleShowHistory}
          />
        )
      
      case 'preview':
        return (
          <PreviewSection 
            uploadData={uploadData}
            onReset={handleReset}
            onStartMapping={handleStartMapping}
          />
        )
      
      case 'mapping':
        return (
          <FieldMapping
            uploadData={uploadData}
            onMappingComplete={handleMappingComplete}
            onCancel={handleCancelMapping}
          />
        )
      
      case 'validation':
        return (
          <RuleValidation
            uploadData={uploadData}
            fieldMapping={fieldMapping}
            onValidationComplete={handleValidationComplete}
            onCancel={handleCancelValidation}
          />
        )
      
      case 'report':
        return (
          <ReportDownload
            uploadData={uploadData}
            fieldMapping={fieldMapping}
            validationResults={validationResults}
            onComplete={handleReportComplete}
            onCancel={handleCancelReport}
          />
        )
      
      case 'history':
        return (
          <History
            onSelectUpload={handleSelectUpload}
            onBack={handleBackFromHistory}
          />
        )
      
      case 'complete':
        return (
          <div className="completion-section">
            <div className="completion-header">
              <div className="success-icon">🎉</div>
              <h2>Analysis Complete!</h2>
              <p>Your e-invoicing readiness analysis has been completed successfully.</p>
            </div>
            
            <div className="completion-summary">
              <div className="summary-card">
                <h4>Upload Summary</h4>
                <p><strong>Upload ID:</strong> {uploadData?.uploadId}</p>
                <p><strong>Rows Parsed:</strong> {uploadData?.rowsParsed}</p>
                <p><strong>Mapping ID:</strong> {fieldMapping?.mappingId}</p>
              </div>
              
              <div className="summary-card">
                <h4>Validation Results</h4>
                <p><strong>Score:</strong> {validationResults?.score}%</p>
                <p><strong>Passed:</strong> {validationResults?.passed} rows</p>
                <p><strong>Failed:</strong> {validationResults?.failed} rows</p>
                <p><strong>Issues:</strong> {validationResults?.issues?.length || 0}</p>
              </div>

              <div className="summary-card">
                <h4>Next Steps</h4>
                <ul>
                  <li>Review downloaded reports</li>
                  <li>Address identified issues</li>
                  <li>Re-run analysis after fixes</li>
                  <li>Implement e-invoicing solution</li>
                </ul>
              </div>
            </div>

            <div className="completion-actions">
              <button onClick={handleReset} className="btn btn-secondary">
                Analyze New Data
              </button>
              <button 
                onClick={() => setCurrentStep('report')} 
                className="btn btn-primary"
              >
                Download More Reports
              </button>
              <button 
                onClick={handleShowHistory} 
                className="btn btn-info"
              >
                View History
              </button>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          {/* Progress Indicator - Hide for history */}
          {currentStep !== 'history' && (
            <div className="progress-indicator">
              <div className={`progress-step ${['preview', 'mapping', 'validation', 'report', 'complete'].includes(currentStep) ? 'completed' : currentStep === 'upload' ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Upload</div>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${['mapping', 'validation', 'report', 'complete'].includes(currentStep) ? 'completed' : currentStep === 'preview' ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Preview</div>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${['validation', 'report', 'complete'].includes(currentStep) ? 'completed' : currentStep === 'mapping' ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Map Fields</div>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${['report', 'complete'].includes(currentStep) ? 'completed' : currentStep === 'validation' ? 'active' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-label">Validate</div>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${currentStep === 'complete' ? 'completed' : currentStep === 'report' ? 'active' : ''}`}>
                <div className="step-number">5</div>
                <div className="step-label">Report</div>
              </div>
            </div>
          )}

          {renderCurrentStep()}
        </div>
      </main>
    </div>
  )
}

export default App