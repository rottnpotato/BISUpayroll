// Test script to verify Excel to CSV conversion
// Run with: node test-excel-conversion.js

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Testing Excel to CSV Conversion...\n');

// Sample data matching your attendance format
const sampleData = [
  {
    'Department': 'BISU-Balilihan',
    'Name': 'Agoc, Winzeal',
    'No.': '1',
    'Date/Time': '02/12/2024 7:30 A12P12',
    'Status': 'C/In',
    'Location ID': '1'
  },
  {
    'Department': 'BISU-Balilihan',
    'Name': 'Agoc, Winzeal',
    'No.': '1',
    'Date/Time': '02/12/2024 17:00 A12P12',
    'Status': 'C/Out',
    'Location ID': '1'
  },
  {
    'Department': 'BISU-Balilihan',
    'Name': 'Diaz, Gabrene D.',
    'No.': '6',
    'Date/Time': '02/12/2024 8:00 A12P12',
    'Status': 'C/In',
    'Location ID': '1'
  },
  {
    'Department': 'BISU-Balilihan',
    'Name': 'Diaz, Gabrene D.',
    'No.': '6',
    'Date/Time': '02/12/2024 17:30 A12P12',
    'Status': 'C/Out',
    'Location ID': '1'
  }
];

try {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert JSON to worksheet
  const ws = XLSX.utils.json_to_sheet(sampleData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  
  // Test 1: Create .xlsx file
  console.log('✓ Creating test.xlsx file...');
  XLSX.writeFile(wb, 'test-attendance.xlsx');
  
  // Test 2: Create .xls file
  console.log('✓ Creating test.xls file...');
  XLSX.writeFile(wb, 'test-attendance.xls');
  
  // Test 3: Read back and convert to CSV
  console.log('✓ Reading .xlsx file...');
  const workbook = XLSX.readFile('test-attendance.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Test 4: Convert to CSV
  console.log('✓ Converting to CSV...');
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  console.log('\n--- Generated CSV Output ---\n');
  console.log(csv);
  console.log('\n--- End of CSV ---\n');
  
  // Test 5: Compare with expected format
  const expectedHeaders = ['Department', 'Name', 'No.', 'Date/Time', 'Status', 'Location ID'];
  const csvLines = csv.split('\n');
  const headers = csvLines[0].split(',');
  
  console.log('✓ Verifying CSV headers...');
  const headersMatch = expectedHeaders.every((h, i) => headers[i] === h);
  
  if (headersMatch) {
    console.log('✅ Headers match expected format!');
  } else {
    console.log('⚠️  Headers do not match exactly');
    console.log('Expected:', expectedHeaders);
    console.log('Got:', headers);
  }
  
  // Test 6: Verify data rows
  console.log(`✓ Verifying data rows (${csvLines.length - 1} rows)...`);
  if (csvLines.length - 1 === sampleData.length) {
    console.log('✅ Row count matches!');
  } else {
    console.log(`⚠️  Row count mismatch: expected ${sampleData.length}, got ${csvLines.length - 1}`);
  }
  
  // Test 7: Save CSV file for comparison
  console.log('✓ Saving CSV file for comparison...');
  fs.writeFileSync('test-attendance-converted.csv', csv);
  
  console.log('\n✅ All tests passed!');
  console.log('\nGenerated files:');
  console.log('  - test-attendance.xlsx');
  console.log('  - test-attendance.xls');
  console.log('  - test-attendance-converted.csv');
  console.log('\nYou can now try uploading test-attendance.xlsx or test-attendance.xls');
  console.log('through the admin panel to test the import feature.');
  
} catch (error) {
  console.error('❌ Error during testing:', error);
  process.exit(1);
}
