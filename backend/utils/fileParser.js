const csv = require('csv-parser');
const { Readable } = require('stream');

class FileParser {
  static async parseFile(fileBuffer, filename) {
    const fileExt = filename.toLowerCase().split('.').pop();
    
    if (fileExt === 'csv') {
      return await this.parseCSV(fileBuffer);
    } else if (fileExt === 'json') {
      return await this.parseJSON(fileBuffer);
    } else {
      throw new Error('Unsupported file format. Only CSV and JSON are allowed.');
    }
  }

  static async parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          if (results.length < 200) { // Limit to 200 rows
            results.push(row);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static async parseJSON(buffer) {
    try {
      const text = buffer.toString('utf-8');
      const data = JSON.parse(text);
      
      // Handle both array and single object
      const arrayData = Array.isArray(data) ? data : [data];
      
      // Limit to 200 rows
      return arrayData.slice(0, 200);
    } catch (error) {
      throw new Error('Invalid JSON format: ' + error.message);
    }
  }

  static detectColumnTypes(data) {
    if (!data || data.length === 0) return {};
    
    const types = {};
    const sampleSize = Math.min(10, data.length); // Sample first 10 rows
    
    // Get all unique column names
    const columns = new Set();
    for (let i = 0; i < sampleSize; i++) {
      Object.keys(data[i]).forEach(col => columns.add(col));
    }
    
    columns.forEach(column => {
      const values = data.slice(0, sampleSize).map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
      
      if (values.length === 0) {
        types[column] = 'text';
        return;
      }
      
      // Check for date pattern (YYYY-MM-DD)
      const isDate = values.every(val => /^\d{4}-\d{2}-\d{2}$/.test(val));
      if (isDate) {
        types[column] = 'date';
        return;
      }
      
      // Check for number
      const isNumber = values.every(val => !isNaN(Number(val)) && !isNaN(parseFloat(val)));
      if (isNumber) {
        types[column] = 'number';
        return;
      }
      
      // Default to text
      types[column] = 'text';
    });
    
    return types;
  }

  static generatePreview(data, limit = 20) {
    return data.slice(0, limit);
  }
}

module.exports = FileParser;
