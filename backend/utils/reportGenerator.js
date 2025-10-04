const { Parser } = require('json2csv');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Generate JSON report
  async generateJSONReport(uploadData, fieldMapping, validationResults) {
    const report = {
      reportId: `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      metadata: {
        uploadId: uploadData.uploadId,
        rowsParsed: uploadData.rowsParsed,
        mappingId: fieldMapping?.mappingId,
        validationId: validationResults?.validationId
      },
      summary: {
        totalRows: validationResults?.rowsChecked || 0,
        passedRows: validationResults?.passed || 0,
        failedRows: validationResults?.failed || 0,
        overallScore: validationResults?.score || 0,
        readinessLevel: this.getReadinessLevel(validationResults?.score || 0)
      },
      fieldMapping: fieldMapping?.mappings || {},
      validationResults: validationResults || {},
      issues: validationResults?.issues || [],
      ruleBreakdown: validationResults?.ruleResults || {},
      recommendations: this.generateRecommendations(validationResults)
    };

    return JSON.stringify(report, null, 2);
  }

  // Generate CSV report
  async generateCSVReport(uploadData, fieldMapping, validationResults) {
    const csvData = [];

    // Add summary section
    csvData.push({
      section: 'SUMMARY',
      field: 'Total Rows',
      value: validationResults?.rowsChecked || 0,
      details: ''
    });
    csvData.push({
      section: 'SUMMARY',
      field: 'Passed Rows',
      value: validationResults?.passed || 0,
      details: ''
    });
    csvData.push({
      section: 'SUMMARY',
      field: 'Failed Rows',
      value: validationResults?.failed || 0,
      details: ''
    });
    csvData.push({
      section: 'SUMMARY',
      field: 'Overall Score',
      value: `${validationResults?.score || 0}%`,
      details: this.getReadinessLevel(validationResults?.score || 0)
    });

    // Add empty row for separation
    csvData.push({ section: '', field: '', value: '', details: '' });

    // Add field mapping section
    csvData.push({
      section: 'FIELD_MAPPING',
      field: 'Upload Field',
      value: 'GETS Field',
      details: 'Mapping Status'
    });

    if (fieldMapping?.mappings) {
      Object.entries(fieldMapping.mappings).forEach(([sourceField, targetField]) => {
        csvData.push({
          section: 'FIELD_MAPPING',
          field: sourceField,
          value: targetField,
          details: targetField ? 'Mapped' : 'Unmapped'
        });
      });
    }

    // Add empty row for separation
    csvData.push({ section: '', field: '', value: '', details: '' });

    // Add rule breakdown section
    csvData.push({
      section: 'RULE_BREAKDOWN',
      field: 'Rule',
      value: 'Passed',
      details: 'Failed'
    });

    if (validationResults?.ruleResults) {
      Object.entries(validationResults.ruleResults).forEach(([ruleName, result]) => {
        csvData.push({
          section: 'RULE_BREAKDOWN',
          field: ruleName,
          value: result.passed,
          details: result.failed
        });
      });
    }

    // Add empty row for separation
    csvData.push({ section: '', field: '', value: '', details: '' });

    // Add issues section
    csvData.push({
      section: 'ISSUES',
      field: 'Row',
      value: 'Field',
      details: 'Error Message'
    });

    if (validationResults?.issues) {
      validationResults.issues.forEach(issue => {
        csvData.push({
          section: 'ISSUES',
          field: issue.row,
          value: issue.field,
          details: issue.error
        });
      });
    }

    const parser = new Parser();
    return parser.parse(csvData);
  }

  // Generate PDF report
  async generatePDFReport(uploadData, fieldMapping, validationResults) {
    const html = this.generateHTMLReport(uploadData, fieldMapping, validationResults);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    return pdf;
  }

  // Generate HTML template for PDF
  generateHTMLReport(uploadData, fieldMapping, validationResults) {
    const score = validationResults?.score || 0;
    const readinessLevel = this.getReadinessLevel(score);
    const scoreColor = this.getScoreColor(score);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>E-Invoicing Readiness Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 10px 0 0;
          opacity: 0.9;
        }
        .summary {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .summary-card {
          flex: 1;
          min-width: 200px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .summary-card h3 {
          margin: 0 0 15px;
          color: #2c3e50;
          font-size: 18px;
        }
        .score-circle {
          text-align: center;
          margin: 20px 0;
        }
        .score-number {
          font-size: 48px;
          font-weight: bold;
          color: ${scoreColor};
          line-height: 1;
        }
        .score-label {
          font-size: 14px;
          color: #6c757d;
          margin-top: 5px;
        }
        .readiness-level {
          text-align: center;
          margin: 15px 0;
        }
        .readiness-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 16px;
          background: ${scoreColor};
          color: white;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #2c3e50;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }
        .issues-table {
          font-size: 12px;
        }
        .issues-table th,
        .issues-table td {
          padding: 8px;
        }
        .severity-high {
          border-left: 4px solid #dc3545;
        }
        .severity-medium {
          border-left: 4px solid #ffc107;
        }
        .severity-low {
          border-left: 4px solid #28a745;
        }
        .footer {
          margin-top: 50px;
          padding: 20px;
          background: #f8f9fa;
          text-align: center;
          color: #6c757d;
          font-size: 12px;
        }
        .recommendations {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }
        .recommendations h3 {
          margin: 0 0 15px;
          color: #1976d2;
        }
        .recommendations ul {
          margin: 0;
          padding-left: 20px;
        }
        .recommendations li {
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>E-Invoicing Readiness Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Upload Information</h3>
          <p><strong>Upload ID:</strong> ${uploadData?.uploadId || 'N/A'}</p>
          <p><strong>Rows Parsed:</strong> ${uploadData?.rowsParsed || 0}</p>
          <p><strong>Mapping ID:</strong> ${fieldMapping?.mappingId || 'N/A'}</p>
        </div>
        
        <div class="summary-card">
          <h3>Validation Summary</h3>
          <div class="score-circle">
            <div class="score-number">${score}%</div>
            <div class="score-label">Overall Score</div>
          </div>
          <div class="readiness-level">
            <span class="readiness-badge">${readinessLevel}</span>
          </div>
        </div>

        <div class="summary-card">
          <h3>Results Breakdown</h3>
          <p><strong>Total Rows:</strong> ${validationResults?.rowsChecked || 0}</p>
          <p><strong>Passed:</strong> ${validationResults?.passed || 0}</p>
          <p><strong>Failed:</strong> ${validationResults?.failed || 0}</p>
          <p><strong>Issues Found:</strong> ${validationResults?.issues?.length || 0}</p>
        </div>
      </div>

      <div class="section">
        <h2>Field Mapping</h2>
        <table>
          <thead>
            <tr>
              <th>Your Field</th>
              <th>GETS Standard Field</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${fieldMapping?.mappings ? Object.entries(fieldMapping.mappings).map(([source, target]) => `
              <tr>
                <td>${source}</td>
                <td>${target || 'Unmapped'}</td>
                <td>${target ? '✅ Mapped' : '❌ Unmapped'}</td>
              </tr>
            `).join('') : '<tr><td colspan="3">No mappings available</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Rule Validation Results</h2>
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            ${validationResults?.ruleResults ? Object.entries(validationResults.ruleResults).map(([rule, result]) => {
              const total = result.passed + result.failed;
              const successRate = total > 0 ? Math.round((result.passed / total) * 100) : 0;
              return `
                <tr>
                  <td>${rule.replace(/_/g, ' ').toUpperCase()}</td>
                  <td>${result.passed}</td>
                  <td>${result.failed}</td>
                  <td>${successRate}%</td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="4">No rule results available</td></tr>'}
          </tbody>
        </table>
      </div>

      ${validationResults?.issues && validationResults.issues.length > 0 ? `
      <div class="section">
        <h2>Validation Issues (Top 20)</h2>
        <table class="issues-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Field</th>
              <th>Rule</th>
              <th>Error Message</th>
            </tr>
          </thead>
          <tbody>
            ${validationResults.issues.slice(0, 20).map(issue => `
              <tr class="severity-${this.getSeverityClass(issue.rule)}">
                <td>${issue.row}</td>
                <td>${issue.field}</td>
                <td>${issue.rule}</td>
                <td>${issue.error}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${validationResults.issues.length > 20 ? `<p><em>Showing top 20 issues out of ${validationResults.issues.length} total</em></p>` : ''}
      </div>
      ` : ''}

      <div class="section">
        <h2>Recommendations</h2>
        <div class="recommendations">
          <h3>Next Steps to Improve E-Invoicing Readiness</h3>
          <ul>
            ${this.generateRecommendations(validationResults).map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Report generated by E-Invoicing Readiness Analyzer</p>
        <p>For technical support, please contact your system administrator</p>
      </div>
    </body>
    </html>
    `;
  }

  // Helper methods
  getReadinessLevel(score) {
    if (score >= 90) return 'HIGH READINESS';
    if (score >= 70) return 'MEDIUM READINESS';
    if (score >= 50) return 'LOW READINESS';
    return 'NEEDS ATTENTION';
  }

  getScoreColor(score) {
    if (score >= 90) return '#28a745';
    if (score >= 70) return '#ffc107';
    if (score >= 50) return '#fd7e14';
    return '#dc3545';
  }

  getSeverityClass(rule) {
    const severityMap = {
      'REQUIRED_FIELD': 'high',
      'DATE_FORMAT': 'medium',
      'CURRENCY_VALID': 'high',
      'VAT_CALCULATION': 'high',
      'LINE_MATH': 'medium',
      'TRN_PRESENT': 'high',
      'DATA_TYPE': 'medium'
    };
    return severityMap[rule] || 'low';
  }

  generateRecommendations(validationResults) {
    const recommendations = [];
    
    if (!validationResults) {
      return ['Complete data validation to get specific recommendations.'];
    }

    const score = validationResults.score || 0;
    const issues = validationResults.issues || [];

    // General score-based recommendations
    if (score < 50) {
      recommendations.push('Urgent action required: Data quality is critically low');
    } else if (score < 70) {
      recommendations.push('Significant improvements needed before e-invoicing implementation');
    } else if (score < 90) {
      recommendations.push('Good foundation, minor improvements recommended');
    } else {
      recommendations.push('Excellent data quality, ready for e-invoicing implementation');
    }

    // Issue-specific recommendations
    const issueTypes = new Set(issues.map(issue => issue.rule));
    
    if (issueTypes.has('REQUIRED_FIELD')) {
      recommendations.push('Ensure all required fields are populated before submission');
    }
    
    if (issueTypes.has('DATE_FORMAT')) {
      recommendations.push('Standardize date formats to YYYY-MM-DD across all records');
    }
    
    if (issueTypes.has('CURRENCY_VALID')) {
      recommendations.push('Update currency codes to valid ISO standards (AED, SAR, MYR, USD)');
    }
    
    if (issueTypes.has('VAT_CALCULATION')) {
      recommendations.push('Review and correct VAT calculation formulas');
    }
    
    if (issueTypes.has('LINE_MATH')) {
      recommendations.push('Verify line item calculations (qty × unit_price = line_total)');
    }
    
    if (issueTypes.has('TRN_PRESENT')) {
      recommendations.push('Ensure TRN numbers are provided for both buyer and seller');
    }
    
    if (issueTypes.has('DATA_TYPE')) {
      recommendations.push('Validate data types match GETS schema requirements');
    }

    if (recommendations.length === 1) {
      recommendations.push('Consider implementing automated validation checks in your ERP system');
    }

    return recommendations;
  }

  // Save report to file
  async saveReport(reportId, format, content) {
    const filename = `${reportId}_report.${format}`;
    const filepath = path.join(this.reportsDir, filename);
    
    if (format === 'pdf') {
      fs.writeFileSync(filepath, content);
    } else {
      fs.writeFileSync(filepath, content, 'utf8');
    }
    
    return { filename, filepath };
  }

  // Clean up old reports (older than 7 days)
  cleanupOldReports() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    if (fs.existsSync(this.reportsDir)) {
      const files = fs.readdirSync(this.reportsDir);
      
      files.forEach(file => {
        const filepath = path.join(this.reportsDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlinkSync(filepath);
          console.log(`Cleaned up old report: ${file}`);
        }
      });
    }
  }
}

module.exports = ReportGenerator;
