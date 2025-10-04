import React, { useState, useEffect } from 'react'
import { getStandardFields, mapFields } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

const FieldMapping = ({ uploadData, onMappingComplete, onCancel }) => {
  const [standardFields, setStandardFields] = useState(null)
  const [mappings, setMappings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadStandardFields()
  }, [])

  useEffect(() => {
    if (uploadData && standardFields) {
      generateSuggestions()
    }
  }, [uploadData, standardFields])

  const loadStandardFields = async () => {
    try {
      setLoading(true)
      const response = await getStandardFields()
      setStandardFields(response)
    } catch (error) {
      setError('Failed to load standard fields: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestions = () => {
    if (!uploadData?.preview || !standardFields) return

    const uploadedColumns = Object.keys(uploadData.preview[0] || {})
    const suggestions = {}

    // Generate smart suggestions
    uploadedColumns.forEach(uploadedCol => {
      const normalizedUploaded = uploadedCol.toLowerCase()
        .replace(/[_\s-]/g, '')
        .replace(/id$/, '')
        .replace(/date$/, '')

      // Look for exact matches first
      let match = standardFields.fields.find(stdField => {
        const normalizedStd = stdField.path.toLowerCase()
          .replace(/[._\[\]]/g, '')
          .replace(/id$/, '')
          .replace(/date$/, '')
        
        return normalizedStd.includes(normalizedUploaded) || 
               normalizedUploaded.includes(normalizedStd)
      })

      // Look for partial matches
      if (!match) {
        match = standardFields.fields.find(stdField => {
          const normalizedStd = stdField.path.toLowerCase()
            .replace(/[._\[\]]/g, '')
          
          return normalizedStd.includes(normalizedUploaded.substring(0, 4)) ||
                 normalizedUploaded.includes(normalizedStd.substring(0, 4))
        })
      }

      if (match) {
        suggestions[uploadedCol] = match.path
      }
    })

    setMappings(suggestions)
  }

  const handleMappingChange = (sourceField, targetField) => {
    setMappings(prev => ({
      ...prev,
      [sourceField]: targetField
    }))
  }

  const handleSaveMappings = async () => {
    try {
      setSaving(true)
      setError(null)

      const mappingData = {
        uploadId: uploadData.uploadId,
        mappings,
        autoSuggest: true
      }

      const result = await mapFields(mappingData)
      setSuccess(true)
      
      // Call callback with mapping result
      setTimeout(() => {
        onMappingComplete(result)
      }, 1500)

    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save mappings')
    } finally {
      setSaving(false)
    }
  }

  const getFieldCategory = (fieldPath) => {
    if (fieldPath.startsWith('invoice.')) return 'Invoice'
    if (fieldPath.startsWith('seller.')) return 'Seller'
    if (fieldPath.startsWith('buyer.')) return 'Buyer'
    if (fieldPath.startsWith('lines[')) return 'Line Items'
    return 'Other'
  }

  const getFieldType = (fieldPath) => {
    const field = standardFields?.fields.find(f => f.path === fieldPath)
    return field?.type || 'string'
  }

  if (loading) {
    return (
      <div className="mapping-loading">
        <LoadingSpinner size="large" />
        <p>Loading standard fields...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mapping-success">
        <div className="success-icon">✅</div>
        <h3>Field Mappings Saved Successfully!</h3>
        <p>Your field mappings have been applied. Ready for analysis.</p>
      </div>
    )
  }

  return (
    <div className="field-mapping">
      <div className="mapping-header">
        <h3>Map Your Fields to GETS Standard</h3>
        <p>Match your uploaded columns to the standardized GETS v0.1 schema fields.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="mapping-content">
        <div className="mapping-table">
          <table>
            <thead>
              <tr>
                <th>Your Column</th>
                <th>Type</th>
                <th>Map To GETS Field</th>
                <th>Category</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              {uploadData?.preview && Object.keys(uploadData.preview[0] || {}).map(column => (
                <tr key={column}>
                  <td className="source-field">
                    <strong>{column}</strong>
                  </td>
                  <td className="field-type">
                    <span className="type-badge">
                      {getFieldType(mappings[column]) || 'unknown'}
                    </span>
                  </td>
                  <td className="mapping-dropdown">
                    <select
                      value={mappings[column] || ''}
                      onChange={(e) => handleMappingChange(column, e.target.value)}
                      className="field-select"
                    >
                      <option value="">-- Select GETS Field --</option>
                      {standardFields?.categories.invoice.map(field => (
                        <option key={field.path} value={field.path}>
                          {field.path} {field.required ? '*' : ''}
                        </option>
                      ))}
                      {standardFields?.categories.seller.map(field => (
                        <option key={field.path} value={field.path}>
                          {field.path} {field.required ? '*' : ''}
                        </option>
                      ))}
                      {standardFields?.categories.buyer.map(field => (
                        <option key={field.path} value={field.path}>
                          {field.path} {field.required ? '*' : ''}
                        </option>
                      ))}
                      {standardFields?.categories.lines.map(field => (
                        <option key={field.path} value={field.path}>
                          {field.path} {field.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="field-category">
                    {mappings[column] && getFieldCategory(mappings[column])}
                  </td>
                  <td className="field-required">
                    {mappings[column] && (
                      <span className={`required-badge ${standardFields?.fields.find(f => f.path === mappings[column])?.required ? 'required' : 'optional'}`}>
                        {standardFields?.fields.find(f => f.path === mappings[column])?.required ? 'Required' : 'Optional'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mapping-summary">
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-number">{Object.keys(mappings).filter(k => mappings[k]).length}</span>
              <span className="stat-label">Mapped</span>
            </div>
            <div className="stat">
              <span className="stat-number">{Object.keys(uploadData?.preview[0] || {}).length - Object.keys(mappings).filter(k => mappings[k]).length}</span>
              <span className="stat-label">Unmapped</span>
            </div>
            <div className="stat">
              <span className="stat-number">{standardFields?.fields.filter(f => f.required).length || 0}</span>
              <span className="stat-label">Required Fields</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mapping-actions">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button 
          onClick={handleSaveMappings} 
          className="btn btn-primary"
          disabled={saving || Object.keys(mappings).filter(k => mappings[k]).length === 0}
        >
          {saving ? <LoadingSpinner /> : 'Save Mappings & Continue'}
        </button>
      </div>
    </div>
  )
}

export default FieldMapping
