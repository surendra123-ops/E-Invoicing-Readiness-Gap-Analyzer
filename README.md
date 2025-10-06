# E-Invoicing Readiness & Gap Analyzer

A comprehensive web application that analyzes invoice data against the GETS v0.1 standard to assess e-invoicing readiness. The tool provides detailed field mapping, rule validation, scoring, and generates professional reports in multiple formats.

Deploy Link : https://e-invoicing-readiness-gap-analyzer-1t39.onrender.com

## 🚀 Features

### Core Functionality
- **Multi-format Data Upload**: Support for CSV and JSON file uploads or direct JSON payload input
- **Smart Field Mapping**: Automatic field detection and mapping to GETS v0.1 standard schema
- **Comprehensive Rule Validation**: 5 critical business rules validation
- **Multi-dimensional Scoring**: Data quality, coverage, rules compliance, and posture assessment
- **Professional Reports**: JSON, CSV, and PDF report generation with shareable URLs
- **Interactive UI**: Step-by-step wizard interface with real-time progress tracking

### Technical Features
- **Database Persistence**: MongoDB storage with 7-day report retention
- **RESTful API**: Complete API with comprehensive error handling
- **Responsive Design**: Mobile and desktop optimized interface
- **Real-time Validation**: Live field mapping suggestions and validation feedback
- **Report Sharing**: Persistent report URLs for collaboration

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with MongoDB (Mongoose)
- **File Processing**: CSV parser and JSON validation
- **Report Generation**: Puppeteer for PDF generation, json2csv for CSV export
- **Security**: Helmet, CORS, input validation middleware
- **Database**: MongoDB with connection pooling and graceful shutdown

### Frontend (React/Vite)
- **Framework**: React 18 with Vite build system
- **State Management**: React hooks for component state
- **HTTP Client**: Axios for API communication
- **Styling**: CSS modules with responsive design
- **Components**: Modular, reusable component architecture

## 📊 Scoring System

The application uses a weighted scoring system across four categories:

- **Data Quality (25%)**: Completeness, consistency, and format quality
- **Coverage (35%)**: Field mapping coverage against GETS standard (70% required, 30% optional)
- **Rules Compliance (30%)**: Validation against 5 business rules
- **Posture (10%)**: Technical readiness assessment

### Business Rules Validation
1. **TOTALS_BALANCE**: `total_excl_vat + vat_amount == total_incl_vat` (±0.01)
2. **LINE_MATH**: `line_total == qty * unit_price` (±0.01)
3. **DATE_ISO**: Date format validation (YYYY-MM-DD)
4. **CURRENCY_ALLOWED**: Currency code validation (AED, SAR, MYR, USD)
5. **TRN_PRESENT**: Tax Registration Number presence validation

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd e-invoicing-analyzer

# Install dependencies
npm install

# Start development servers
npm run dev
```

### Environment Configuration
Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/e-invoicing-analyzer
FRONTEND_URL=http://localhost:3001
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Database Setup
```bash
# Start MongoDB (if using local instance)
mongod

# The application will automatically create the database and collections
```

## 🚀 Usage

### 1. Upload Data
- Navigate to the application
- Choose between file upload or JSON payload
- Select country and ERP system (optional)
- Upload CSV or JSON file

### 2. Preview & Map Fields
- Review uploaded data preview
- Map your fields to GETS standard fields
- System provides intelligent suggestions
- Save mappings to proceed

### 3. Run Analysis
- Complete questionnaire (optional)
- System validates against business rules
- Generates comprehensive scoring

### 4. Download Reports
- Choose report format (JSON, CSV, PDF)
- Download or share report URL
- Reports persist for 7 days

## 📡 API Endpoints

### Core Endpoints
- `POST /upload` - Upload CSV/JSON data
- `POST /analyze` - Run comprehensive analysis
- `GET /report/:reportId` - Retrieve report by ID

### Field Management
- `GET /fields` - Get GETS standard fields
- `POST /fields/map` - Save field mappings
- `GET /fields/mappings/:uploadId` - Get field mappings

### Report Management
- `GET /reports/:uploadId?format=json|csv|pdf` - Download reports
- `GET /reports/:uploadId/summary` - Get report summary
- `GET /reports?limit=10` - List recent reports

### System
- `GET /health` - Health check endpoint
- `GET /api` - API documentation

## 📁 Project Structure

```
e-invoicing-analyzer/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── analyzeController.js # Main analysis logic
│   │   ├── fieldsController.js  # Field mapping
│   │   ├── reportController.js  # Report generation
│   │   ├── uploadController.js  # File upload handling
│   │   └── ...
│   ├── middleware/
│   │   ├── upload.js           # File upload middleware
│   │   └── validation.js       # Input validation
│   ├── models/
│   │   ├── upload.js           # Upload data model
│   │   ├── fieldMapping.js     # Field mapping model
│   │   ├── validation.js       # Validation results model
│   │   └── report.js           # Report model
│   ├── routes/
│   │   ├── analyze.js          # Analysis routes
│   │   ├── fields.js           # Field mapping routes
│   │   ├── reports.js          # Report routes
│   │   └── ...
│   ├── utils/
│   │   ├── ruleEngine.js       # Business rules validation
│   │   ├── reportGenerator.js  # Multi-format report generation
│   │   ├── scoring.js          # Scoring algorithms
│   │   └── fieldMapper.js      # Field mapping utilities
│   └── server.js               # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadSection.jsx    # File upload interface
│   │   │   ├── FieldMapping.jsx     # Field mapping interface
│   │   │   ├── RuleValidation.jsx   # Validation interface
│   │   │   ├── ReportDownload.jsx   # Report download interface
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js               # API service layer
│   │   └── App.jsx                  # Main application component
│   └── dist/                        # Built frontend assets
├── gets_v0_1_schema.json            # GETS standard schema
├── sample_clean.json                # Sample clean data
├── sample_flawed.csv                # Sample flawed data
└── package.json                     # Root package configuration
```

## 🧪 Testing

### Sample Data
The project includes two sample datasets:
- `sample_clean.json`: Clean data that should pass most validations
- `sample_flawed.csv`: Data with intentional issues for testing

### Manual Testing
```bash
# Test file upload
curl -X POST http://localhost:3000/upload \
  -F "file=@sample_flawed.csv" \
  -F "country=UAE"

# Test analysis
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"uploadId":"u_xxx","questionnaire":{"webhooks":true}}'
```

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev          # Start both frontend and backend
npm run build        # Build for production
npm start           # Start production server

# Backend only
cd backend && npm run dev    # Start with nodemon
cd backend && npm start      # Start production

# Frontend only  
cd frontend && npm run dev   # Start Vite dev server
cd frontend && npm run build # Build frontend
```

### Code Structure
- **Controllers**: Handle HTTP requests and business logic
- **Models**: Define database schemas and validation
- **Utils**: Reusable utility functions and algorithms
- **Middleware**: Request processing and validation
- **Components**: React components with clear separation of concerns

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend && npm run build

# Start production server
cd backend && npm start
```

### Environment Variables
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-mongodb-uri
FRONTEND_URL=https://your-frontend-url
```

### Docker Support
```dockerfile
# Example Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance

- **File Processing**: Limited to 200 rows for optimal performance
- **Analysis Time**: <5 seconds for provided samples
- **Report Generation**: <10 seconds for PDF reports
- **Database**: Optimized queries with proper indexing
- **Caching**: Report caching for 7 days

## 🔒 Security

- **Input Validation**: Comprehensive validation middleware
- **File Upload Security**: File type and size restrictions
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet**: Security headers and protection
- **Error Handling**: Secure error messages without data leakage







## 🎯 Roadmap

### Planned Features
- [ ] Advanced field mapping with AI suggestions
- [ ] Bulk analysis capabilities
- [ ] Custom rule definition
- [ ] Integration with popular ERP systems
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard

---


