# E-Invoicing Readiness & Gap Analyzer

A web tool that analyzes invoice data against the GETS v0.1 schema to assess e-invoicing readiness and identify gaps.

## 🎯 Project Overview

This tool helps organizations:
- Ingest CSV/JSON invoice data
- Map fields against GETS v0.1 schema
- Run validation rules
- Compute readiness scores (0-100)
- Generate shareable analysis reports

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **File Processing**: CSV-parser, Multer
- **Security**: Helmet, CORS
- **Monitoring**: Morgan logging

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repo-url>
   cd e-invoicing-analyzer
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and settings
   ```

3. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

4. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify setup**
   ```bash
   curl http://localhost:3000/health
   ```

## 📁 Project Structure
├── config/          # Database and app configuration
├── controllers/     # Route handlers and business logic
├── routes/          # API endpoint definitions
├── models/          # Database schemas (MongoDB/Mongoose)
├── middleware/      # Custom middleware functions
├── utils/           # Helper functions and utilities
├── uploads/         # Temporary file storage
└── public/          # Frontend static files


   mongodI Endpoints

### Current (Stage 1)
- `GET /health` - Health check and system status

### Upcoming (Stage 2+)
- `POST /upload` - File upload and parsing
- `POST /analyze` - Run analysis and scoring
- `GET /report/:id` - Retrieve analysis report

## 🎯 Development Stages

### ✅ Stage 1: Project Setup
- [x] Express.js server with health endpoint
- [x] MongoDB connection and configuration
- [x] Project structure and scaffolding
- [x] Environment configuration
- [x] Basic middleware and error handling

### 🔄 Stage 2: File Upload & Parsing
- [ ] CSV/JSON file upload endpoint
- [ ] File parsing and validation
- [ ] Data structure normalization

### 🔄 Stage 3: Field Mapping & Analysis
- [ ] GETS v0.1 schema mapping
- [ ] Field similarity detection
- [ ] Coverage analysis

### 🔄 Stage 4: Rule Engine & Scoring
- [ ] 5 validation rules implementation
- [ ] Scoring algorithm (4 categories)
- [ ] Report generation

### 🔄 Stage 5: Frontend & UI
- [ ] 3-step wizard interface
- [ ] Results visualization
- [ ] Shareable report URLs

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-31T10:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "database": {
    "status": "connected",
    "name": "e-invoicing-analyzer",
    "type": "mongodb"
  },
  "version": "1.0.0"
}
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/e-invoicing-analyzer` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5MB) |
| `MAX_ROWS_PROCESS` | Max rows to process | `200` |

## 🤝 Contributing

This is a staged development project. Each stage builds upon the previous one with specific deliverables and acceptance criteria.

## 📄 License

ISC