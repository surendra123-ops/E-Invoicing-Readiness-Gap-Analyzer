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

    // Initialize rule results for the 5 PRD-required rules
    const ruleNames = ['TOTALS_BALANCE', 'LINE_MATH', 'DATE_ISO', 'CURRENCY_ALLOWED', 'TRN_PRESENT'];
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

      // Check each rule according to PRD requirements
      const rules = [
        { name: 'TOTALS_BALANCE', fn: this.checkTotalsBalance },
        { name: 'LINE_MATH', fn: this.checkLineMath },
        { name: 'DATE_ISO', fn: this.checkDateIso },
        { name: 'CURRENCY_ALLOWED', fn: this.checkCurrencyAllowed },
        { name: 'TRN_PRESENT', fn: this.checkTrnPresent }
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

  // Rule 1: TOTALS_BALANCE — total_excl_vat + vat_amount == total_incl_vat (±0.01)
  checkTotalsBalance(row, fieldMappings, rowIndex) {
    const issues = [];
    const tolerance = 0.01;
    
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
            rule: 'TOTALS_BALANCE',
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

  // Rule 2: LINE_MATH — line_total == qty * unit_price (±0.01); include exampleLine when false
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
            exampleLine: lineIndex + 1
          });
        }
      }
    });

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule 3: DATE_ISO — invoice.issue_date matches YYYY-MM-DD
  checkDateIso(row, fieldMappings, rowIndex) {
    const issues = [];
    const dateField = this.findMappedField('invoice.issue_date', fieldMappings);
    
    if (dateField && row[dateField]) {
      const dateValue = row[dateField];
      if (!this.isValidDateFormat(dateValue)) {
        issues.push({
          row: rowIndex + 1,
          field: 'invoice.issue_date',
          sourceField: dateField,
          rule: 'DATE_ISO',
          error: 'Invalid date format. Expected YYYY-MM-DD',
          value: dateValue
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule 4: CURRENCY_ALLOWED — currency ∈ [AED, SAR, MYR, USD]; include bad value when false
  checkCurrencyAllowed(row, fieldMappings, rowIndex) {
    const issues = [];
    const allowedCurrencies = ['AED', 'SAR', 'MYR', 'USD'];
    const currencyField = this.findMappedField('invoice.currency', fieldMappings);
    
    if (currencyField && row[currencyField]) {
      const currency = row[currencyField];
      if (!allowedCurrencies.includes(currency)) {
        issues.push({
          row: rowIndex + 1,
          field: 'invoice.currency',
          sourceField: currencyField,
          rule: 'CURRENCY_ALLOWED',
          error: `Invalid currency. Must be one of: ${allowedCurrencies.join(', ')}`,
          value: currency
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  // Rule 5: TRN_PRESENT — buyer.trn and seller.trn non-empty
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