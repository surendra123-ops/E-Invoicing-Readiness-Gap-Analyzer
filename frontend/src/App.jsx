import React, { useState } from 'react'
import UploadSection from './components/UploadSection'
import PreviewSection from './components/PreviewSection'
import FieldMapping from './components/FieldMapping'
import Header from './components/Header'
import './App.css'

function App() {
  const [uploadData, setUploadData] = useState(null)
  const [fieldMapping, setFieldMapping] = useState(null)
  const [currentStep, setCurrentStep] = useState('upload') // 'upload', 'preview', 'mapping', 'complete'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleUploadSuccess = (data) => {
    setUploadData(data)
    setFieldMapping(null)
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
    setCurrentStep('complete')
  }

  const handleCancelMapping = () => {
    setCurrentStep('preview')
  }

  const handleReset = () => {
    setUploadData(null)
    setFieldMapping(null)
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
          />
        )
      
      case 'preview':
        return (
          <>
            <PreviewSection 
              uploadData={uploadData}
              onReset={handleReset}
              onStartMapping={handleStartMapping}
            />
          </>
        )
      
      case 'mapping':
        return (
          <FieldMapping
            uploadData={uploadData}
            onMappingComplete={handleMappingComplete}
            onCancel={handleCancelMapping}
          />
        )
      
      case 'complete':
        return (
          <div className="completion-section">
            <div className="completion-header">
              <div className="success-icon">🎉</div>
              <h2>Field Mapping Complete!</h2>
              <p>Your invoice data has been successfully uploaded and mapped to GETS standards.</p>
            </div>
            
            <div className="completion-summary">
              <div className="summary-card">
                <h4>Upload Summary</h4>
                <p><strong>Upload ID:</strong> {uploadData?.uploadId}</p>
                <p><strong>Rows Parsed:</strong> {uploadData?.rowsParsed}</p>
              </div>
              
              <div className="summary-card">
                <h4>Mapping Summary</h4>
                <p><strong>Mapped Fields:</strong> {fieldMapping?.mappedFields}</p>
                <p><strong>Mapping ID:</strong> {fieldMapping?.mappingId}</p>
              </div>
            </div>

            <div className="completion-actions">
              <button onClick={handleReset} className="btn btn-secondary">
                Start Over
              </button>
              <button className="btn btn-primary" disabled>
                Run Analysis (Coming in Stage 4)
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
          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className={`progress-step ${currentStep === 'upload' ? 'active' : currentStep === 'preview' || currentStep === 'mapping' || currentStep === 'complete' ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Upload</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentStep === 'preview' ? 'active' : currentStep === 'mapping' || currentStep === 'complete' ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Preview</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentStep === 'mapping' ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Map Fields</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentStep === 'complete' ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Analyze</div>
            </div>
          </div>

          {renderCurrentStep()}
        </div>
      </main>
    </div>
  )
}

export default App
