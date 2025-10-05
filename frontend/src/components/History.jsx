


import React, { useState, useEffect } from 'react'
import { getUploadHistory, downloadReport } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

const History = ({ onSelectUpload, onBack }) => {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadUploadHistory()
  }, [currentPage])

  const loadUploadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const limit = 10
      const offset = (currentPage - 1) * limit
      
      const response = await getUploadHistory(limit, offset)
      setUploads(response.uploads)
      setPagination(response.pagination)
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load upload history')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (uploadId, format = 'pdf') => {
    try {
      await downloadReport(uploadId, format)
    } catch (error) {
      setError(error.response?.data?.message || error.message || `Failed to download ${format.toUpperCase()} report`)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'uploaded': { class: 'badge-secondary', text: 'Uploaded' },
      'mapped': { class: 'badge-info', text: 'Mapped' },
      'validated': { class: 'badge-warning', text: 'Validated' },
      'completed': { class: 'badge-success', text: 'Completed' }
    }
    const statusInfo = statusMap[status] || { class: 'badge-secondary', text: status }
    
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
  }

  const getScoreBadge = (score) => {
    if (score === null || score === undefined) return <span className="score-badge no-score">No Score</span>
    
    let badgeClass = 'score-badge '
    if (score >= 90) badgeClass += 'score-high'
    else if (score >= 70) badgeClass += 'score-medium'
    else if (score >= 50) badgeClass += 'score-low'
    else badgeClass += 'score-critical'
    
    return <span className={badgeClass}>{score}%</span>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="history-loading">
        <LoadingSpinner size="large" />
        <h3>Loading Upload History...</h3>
        <p>Retrieving your past analyses</p>
      </div>
    )
  }

  return (
    <div className="history">
      <div className="history-header">
        <div className="header-content">
          <h2>Upload History</h2>
          <p>View and manage your past e-invoicing readiness analyses</p>
        </div>
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Upload
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {uploads.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">📊</div>
          <h3>No Upload History</h3>
          <p>You haven't analyzed any files yet. Start by uploading your first invoice data.</p>
          <button onClick={onBack} className="btn btn-primary">
            Upload New File
          </button>
        </div>
      ) : (
        <>
          <div className="uploads-table-container">
            <table className="uploads-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Rows</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.uploadId} className="upload-row">
                    <td className="file-name">
                      <div className="file-info">
                        <span className="file-icon">
                          {upload.fileName.toLowerCase().endsWith('.csv') ? '📊' : '📄'}
                        </span>
                        <span className="file-name-text">{upload.fileName}</span>
                      </div>
                    </td>
                    <td className="rows-count">
                      {upload.rowsParsed.toLocaleString()}
                    </td>
                    <td className="status">
                      {getStatusBadge(upload.status)}
                    </td>
                    <td className="score">
                      {getScoreBadge(upload.score)}
                    </td>
                    <td className="upload-date">
                      {formatDate(upload.createdAt)}
                    </td>
                    <td className="actions">
                      <div className="action-buttons">
                        {upload.status === 'completed' ? (
                          <>
                            <button
                              onClick={() => handleDownloadReport(upload.uploadId, 'pdf')}
                              className="btn btn-sm btn-primary"
                              title="Download PDF Report"
                            >
                              📋 PDF
                            </button>
                            <button
                              onClick={() => handleDownloadReport(upload.uploadId, 'csv')}
                              className="btn btn-sm btn-secondary"
                              title="Download CSV Report"
                            >
                              📊 CSV
                            </button>
                            <button
                              onClick={() => onSelectUpload(upload)}
                              className="btn btn-sm btn-info"
                              title="View Details"
                            >
                              👁️ View
                            </button>
                          </>
                        ) : upload.status === 'validated' ? (
                          <button
                            onClick={() => onSelectUpload(upload)}
                            className="btn btn-sm btn-warning"
                          >
                            Generate Report
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectUpload(upload)}
                            className="btn btn-sm btn-info"
                          >
                            Continue Analysis
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total > 10 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {Math.ceil(pagination.total / 10)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.hasMore}
                className="btn btn-secondary"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default History