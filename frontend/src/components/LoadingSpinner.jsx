import React from 'react'

const LoadingSpinner = ({ size = 'small' }) => {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner"></div>
    </div>
  )
}

export default LoadingSpinner
