import React, { useState } from 'react'
import { uploadFile, uploadJsonPayload } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

const UploadSection = ({ onUploadSuccess, onUploadError, onLoading, loading, error }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [country, setCountry] = useState('')
  const [erp, setErp] = useState('')
  const [jsonPayload, setJsonPayload] = useState('')
  const [uploadMode, setUploadMode] = useState('file') // 'file' or 'json'

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (uploadMode === 'file' && !selectedFile) {
      onUploadError('Please select a file to upload.')
      return
    }

    if (uploadMode === 'json' && !jsonPayload.trim()) {
      onUploadError('Please provide JSON data.')
      return
    }

    onLoading(true)
    onUploadError(null)

    try {
      let result
      
      if (uploadMode === 'file') {
        const formData = new FormData()
        formData.append('file', selectedFile)
        if (country) formData.append('country', country)
        if (erp) formData.append('erp', erp)
        
        result = await uploadFile(formData)
      } else {
        result = await uploadJsonPayload({
          text: jsonPayload,
          country: country || undefined,
          erp: erp || undefined
        })
      }

      onUploadSuccess(result)
    } catch (error) {
      onUploadError(error.response?.data?.message || error.message || 'Upload failed')
    } finally {
      onLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setCountry('')
    setErp('')
    setJsonPayload('')
    onUploadError(null)
  }

  return (
    <section className="upload-section">
      <div className="section-header">
        <h2>Upload Invoice Data</h2>
        <div className="upload-mode-toggle">
          <button 
            className={`toggle-btn ${uploadMode === 'file' ? 'active' : ''}`}
            onClick={() => setUploadMode('file')}
          >
            File Upload
          </button>
          <button 
            className={`toggle-btn ${uploadMode === 'json' ? 'active' : ''}`}
            onClick={() => setUploadMode('json')}
          >
            JSON Payload
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="country">Country (Optional)</label>
            <select 
              id="country" 
              value={country} 
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select Country</option>
              <option value="UAE">UAE</option>
              <option value="KSA">KSA</option>
              <option value="MY">Malaysia</option>
              <option value="US">United States</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="erp">ERP System (Optional)</label>
            <input 
              type="text" 
              id="erp" 
              value={erp}
              onChange={(e) => setErp(e.target.value)}
              placeholder="e.g., SAP, Oracle, NetSuite"
            />
          </div>
        </div>

        {uploadMode === 'file' ? (
          <div className="form-group">
            <label htmlFor="file">Choose File (CSV/JSON)</label>
            <div className="file-input-wrapper">
              <input 
                type="file" 
                id="file" 
                accept=".csv,.json"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="file" className="file-label">
                {selectedFile ? selectedFile.name : 'Choose File'}
              </label>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="jsonPayload">JSON Data</label>
            <textarea 
              id="jsonPayload"
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
              placeholder="Paste your JSON data here..."
              rows="6"
              className="json-textarea"
            />
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={resetForm} className="btn btn-secondary">
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Upload & Preview'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="loading-overlay">
          <LoadingSpinner />
          <p>Processing your file...</p>
        </div>
      )}
    </section>
  )
}

export default UploadSection
