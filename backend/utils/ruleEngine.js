const getsSchema = require('../../gets_v0_1_schema.json');

class RuleEngine {
  constructor() {
    // Don't assign methods in constructor - they'll be called directly
  }

  // Run all applicable rules on the data
  async runValidation(uploadData, fieldMappings) {
    const results = {
      uploadId: uploadData.uploadId,
      rowsChecked: uploadData.rawData.length,
      passed: 0,
      failed: 0,
      issues: [],
      ruleResults: {},
      score: 0
    };

    // Initialize rule results
    const ruleNames = ['REQUIRED_FIELD', 'DATE_FORMAT', 'CURRENCY_VALID', 'VAT_CALCULATION', 'LINE_MATH', 'TRN_PRESENT', 'DATA_TYPE'];
    ruleNames.forEach(ruleName => {
      results.ruleResults[ruleName] = {
        passed: 0,
        failed: 0,
        issues: []
      };
    });

    // Process each row
    uploadData.rawData.forEach((row, rowIndex) => {
      const rowIssues = [];
      let rowPassed = true;

      // Check each rule
      const rules = [
        { name: 'REQUIRED_FIELD', fn: this.checkRequiredField },
        { name: 'DATE_FORMAT', fn: this.checkDateFormat },
        { name: 'CURRENCY_VALID', fn: this.checkCurrencyValid },
        { name: 'VAT_CALCULATION', fn: this.checkVatCalculation },
        { name: 'LINE_MATH', fn: this.checkLineMath },
        { name: 'TRN_PRESENT', fn: this.checkTrnPresent },
        { name: 'DATA_TYPE', fn: this.checkDataType }
      ];

      rules.forEach(({ name, fn }) => {
        try {
          const ruleResult = fn.call(this, row, fieldMappings, rowIndex);
          
          if (ruleResult.passed) {
            results.ruleResults[name].passed++;
          } else {
            results.ruleResults[name].failed++;
            results.ruleResults[name].issues.push(...ruleResult.issues);
            rowIssues.push(...ruleResult.issues);
            rowPassed = false;
          }
        } catch (error) {
          console.error(`Error in rule ${name}:`, error);
          rowPassed = false;
          const issue = {
            row: rowIndex + 1,
            rule: name,
            error: `Rule validation error: ${error.message}`
          };
          rowIssues.push(issue);
          results.ruleResults[name].failed++;
          results.ruleResults[name].issues.push(issue);
        }
      });

      if (rowPassed) {
        results.passed++;
      } else {
        results.failed++;
        results.issues.push(...rowIssues);
      }
    });

    // Calculate overall score
    results.score = Math.round((results.passed / results.rowsChecked) * 100);

    return results;
  }

  // Rule: Required fields must not be empty
  checkRequiredField(row, fieldMappings, rowIndex) {
    const issues = [];
    const requiredFields = getsSchema.fields.filter(f => f.required);
    
    requiredFields.forEach(field => {
      const mappedField = this.findMappedField(field.path, fieldMappings);
      if (mappedField && row[mappedField]) {
        const value = row[mappedField];
        if (value === null || value === undefined || value === '' || 
            (typeof value === 'string' && value.trim() === '')) {
          issues.push({
            row: rowIndex + 1,
            field: field.path,
            sourceField: mappedField,
            rule: 'REQUIRED_FIELD',
            error: 'Required field is empty',
            value: value
          });
        }
      } else if (mappedField) {
        issues.push({
          row: rowIndex + 1,
          field: field.path,
          sourceField: mappedField,
          rule: 'REQUIRED_FIELD',
          error: 'Required field is missing',
          value: null
        });
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule: Date must be in YYYY-MM-DD format
  checkDateFormat(row, fieldMappings, rowIndex) {
    const issues = [];
    const dateFields = getsSchema.fields.filter(f => f.type === 'date');
    
    dateFields.forEach(field => {
      const mappedField = this.findMappedField(field.path, fieldMappings);
      if (mappedField && row[mappedField]) {
        const dateValue = row[mappedField];
        if (!this.isValidDateFormat(dateValue)) {
          issues.push({
            row: rowIndex + 1,
            field: field.path,
            sourceField: mappedField,
            rule: 'DATE_FORMAT',
            error: 'Invalid date format. Expected YYYY-MM-DD',
            value: dateValue
          });
        }
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule: Currency must be valid ISO code
  checkCurrencyValid(row, fieldMappings, rowIndex) {
    const issues = [];
    const currencyField = getsSchema.fields.find(f => f.path === 'invoice.currency');
    
    if (currencyField) {
      const mappedField = this.findMappedField(currencyField.path, fieldMappings);
      if (mappedField && row[mappedField]) {
        const currency = row[mappedField];
        if (!currencyField.enum.includes(currency)) {
          issues.push({
            row: rowIndex + 1,
            field: currencyField.path,
            sourceField: mappedField,
            rule: 'CURRENCY_VALID',
            error: `Invalid currency. Must be one of: ${currencyField.enum.join(', ')}`,
            value: currency
          });
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule: VAT calculation validation
  checkVatCalculation(row, fieldMappings, rowIndex) {
    const issues = [];
    const tolerance = 0.01; // Allow small rounding differences
    
    const totalExclVatField = this.findMappedField('invoice.total_excl_vat', fieldMappings);
    const vatAmountField = this.findMappedField('invoice.vat_amount', fieldMappings);
    const totalInclVatField = this.findMappedField('invoice.total_incl_vat', fieldMappings);
    
    if (totalExclVatField && vatAmountField && totalInclVatField) {
      const totalExclVat = parseFloat(row[totalExclVatField]);
      const vatAmount = parseFloat(row[vatAmountField]);
      const totalInclVat = parseFloat(row[totalInclVatField]);
      
      if (!isNaN(totalExclVat) && !isNaN(vatAmount) && !isNaN(totalInclVat)) {
        const expectedTotal = totalExclVat + vatAmount;
        if (Math.abs(totalInclVat - expectedTotal) > tolerance) {
          issues.push({
            row: rowIndex + 1,
            field: 'invoice.total_incl_vat',
            sourceField: totalInclVatField,
            rule: 'VAT_CALCULATION',
            error: `VAT calculation error. Expected ${expectedTotal}, got ${totalInclVat}`,
            value: totalInclVat,
            expected: expectedTotal
          });
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule: Line item math validation
  checkLineMath(row, fieldMappings, rowIndex) {
    const issues = [];
    const tolerance = 0.01;
    
    // Check if this row has line items
    const lineItems = this.extractLineItems(row, fieldMappings);
    
    lineItems.forEach((lineItem, lineIndex) => {
      const qty = parseFloat(lineItem.qty);
      const unitPrice = parseFloat(lineItem.unit_price);
      const lineTotal = parseFloat(lineItem.line_total);
      
      if (!isNaN(qty) && !isNaN(unitPrice) && !isNaN(lineTotal)) {
        const expectedTotal = qty * unitPrice;
        if (Math.abs(lineTotal - expectedTotal) > tolerance) {
          issues.push({
            row: rowIndex + 1,
            field: 'lines[].line_total',
            sourceField: lineItem.sourceFields.line_total,
            rule: 'LINE_MATH',
            error: `Line calculation error. Expected ${expectedTotal}, got ${lineTotal}`,
            value: lineTotal,
            expected: expectedTotal,
            lineIndex: lineIndex + 1
          });
        }
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule: TRN must be present for buyer and seller
  checkTrnPresent(row, fieldMappings, rowIndex) {
    const issues = [];
    const trnFields = [
      { path: 'seller.trn', label: 'Seller TRN' },
      { path: 'buyer.trn', label: 'Buyer TRN' }
    ];
    
    trnFields.forEach(trnField => {
      const mappedField = this.findMappedField(trnField.path, fieldMappings);
      if (mappedField && row[mappedField]) {
        const trn = row[mappedField];
        if (!trn || (typeof trn === 'string' && trn.trim() === '')) {
          issues.push({
            row: rowIndex + 1,
            field: trnField.path,
            sourceField: mappedField,
            rule: 'TRN_PRESENT',
            error: `${trnField.label} is empty`,
            value: trn
          });
        }
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule: Data type validation
  checkDataType(row, fieldMappings, rowIndex) {
    const issues = [];
    
    getsSchema.fields.forEach(field => {
      const mappedField = this.findMappedField(field.path, fieldMappings);
      if (mappedField && row[mappedField] !== null && row[mappedField] !== undefined) {
        const value = row[mappedField];
        
        if (field.type === 'number' && isNaN(parseFloat(value))) {
          issues.push({
            row: rowIndex + 1,
            field: field.path,
            sourceField: mappedField,
            rule: 'DATA_TYPE',
            error: `Expected number, got ${typeof value}`,
            value: value
          });
        }
        
        if (field.pattern && typeof value === 'string') {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            issues.push({
              row: rowIndex + 1,
              field: field.path,
              sourceField: mappedField,
              rule: 'DATA_TYPE',
              error: `Value does not match pattern ${field.pattern}`,
              value: value
            });
          }
        }
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Helper methods
  findMappedField(getsFieldPath, fieldMappings) {
    return Object.keys(fieldMappings).find(sourceField => 
      fieldMappings[sourceField] === getsFieldPath
    );
  }

  isValidDateFormat(dateString) {
    if (typeof dateString !== 'string') return false;
    
    // Check YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    // Check if it's a valid date
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
  }

  extractLineItems(row, fieldMappings) {
    const lineItems = [];
    
    // Try to find line item arrays in the data
    Object.keys(row).forEach(key => {
      if (Array.isArray(row[key])) {
        row[key].forEach((item, index) => {
          if (typeof item === 'object') {
            const lineItem = {
              qty: item.qty || item.quantity,
              unit_price: item.unit_price || item.price,
              line_total: item.line_total || item.total,
              sourceFields: {
                qty: 'qty',
                unit_price: 'unit_price',
                line_total: 'line_total'
              }
            };
            lineItems.push(lineItem);
          }
        });
      }
    });
    
    return lineItems;
  }
}

module.exports = RuleEngine;