import React from 'react'

const PreviewSection = ({ uploadData, onReset, onStartMapping }) => {
  if (!uploadData || !uploadData.preview) {
    return null
  }

  const { uploadId, rowsParsed, preview } = uploadData

  const getColumnType = (columnName, data) => {
    const sampleValues = data.slice(0, 5).map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '')
    
    if (sampleValues.length === 0) return 'text'
    
    // Check for date pattern (YYYY-MM-DD)
    const isDate = sampleValues.every(val => /^\d{4}-\d{2}-\d{2}$/.test(val))
    if (isDate) return 'date'
    
    // Check for number
    const isNumber = sampleValues.every(val => !isNaN(Number(val)) && !isNaN(parseFloat(val)))
    if (isNumber) return 'number'
    
    return 'text'
  }

  const formatValue = (value, type) => {
    if (value === null || value === undefined || value === '') {
      return <span className="empty-value">empty</span>
    }
    
    if (type === 'number') {
      return typeof value === 'number' ? value.toLocaleString() : value
    }
    
    return value
  }

  const columns = preview.length > 0 ? Object.keys(preview[0]) : []

  return (
    <section className="preview-section">
      <div className="section-header">
        <h3>Data Preview</h3>
        <div className="header-actions">
          <span className="upload-id">ID: {uploadId}</span>
          <div className="action-buttons">
            <button onClick={onReset} className="btn btn-secondary btn-sm">
              Upload New File
            </button>
            <button onClick={onStartMapping} className="btn btn-primary btn-sm">
              Map Fields →
            </button>
          </div>
        </div>
      </div>

      <div className="upload-info">
        <div className="info-grid">
          <div className="info-item">
            <strong>Upload ID:</strong> {uploadId}
          </div>
          <div className="info-item">
            <strong>Rows Parsed:</strong> {rowsParsed}
          </div>
          <div className="info-item">
            <strong>Preview:</strong> First {preview.length} rows
          </div>
          <div className="info-item">
            <strong>Columns:</strong> {columns.length} detected
          </div>
        </div>
      </div>

      <div className="preview-note">
        <p><strong>Next Step:</strong> Click "Map Fields" to match your columns to GETS standard fields.</p>
      </div>

      <div className="table-container">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>
                  <div className="column-header">
                    <span className="column-name">{column}</span>
                    <span className={`type-badge type-${getColumnType(column, preview)}`}>
                      {getColumnType(column, preview)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td 
                    key={column}
                    className={`cell-${getColumnType(column, preview)}`}
                  >
                    {formatValue(row[column], getColumnType(column, preview))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default PreviewSection
