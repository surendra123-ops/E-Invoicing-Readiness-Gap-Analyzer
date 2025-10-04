# E-Invoicing Readiness Analyzer - Frontend

React frontend for the E-Invoicing Readiness & Gap Analyzer using Vite and Axios.

## Setup Instructions

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The frontend will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- File upload (CSV/JSON)
- JSON payload upload
- Data preview with type detection
- Responsive design
- Loading states and error handling
- Axios for API communication

## API Integration

The frontend communicates with the backend API running on `http://localhost:3000` through Vite's proxy configuration.
