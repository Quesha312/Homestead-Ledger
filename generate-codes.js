#!/usr/bin/env node
// ============================================================
// Homestead Ledger — redeem code generator
//
// Generates a batch of one-time Academy unlock codes for gifts,
// bulk/club sales, or promos — anything sold outside the in-app
// PayPal purchase.
//
// Usage:
//   node generate-codes.js <count> <batch-label>
//
// Example:
//   node generate-codes.js 25 "4-H Springfield Chapter"
//
// Output:
//   codes-<timestamp>.csv   — for your own records / handing out
//   codes-<timestamp>.sql   — paste into the Supabase SQL Editor to insert them
// ============================================================

const fs = require('fs');

const count = parseInt(process.argv[2], 10);
const batchLabel = process.argv[3] || 'Unlabeled batch';

if(!count || count < 1 || count > 5000){
  console.error('Usage: node generate-codes.js <count 1-5000> "<batch label>"');
  process.exit(1);
}

function randomSegment(len){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let out = '';
  for(let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}
function generateCode(){
  return `HL-${randomSegment(4)}-${randomSegment(4)}`;
}

const codes = new Set();
while(codes.size < count){
  codes.add(generateCode());
}
const codeList = Array.from(codes);

const stamp = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
const csvPath = `codes-${stamp}.csv`;
const sqlPath = `codes-${stamp}.sql`;

// CSV — for your own records, or to hand/email out
const csvLines = ['code,batch_label', ...codeList.map(c => `${c},"${batchLabel.replace(/"/g,'""')}"`)];
fs.writeFileSync(csvPath, csvLines.join('\n') + '\n');

// SQL — paste into Supabase SQL Editor to actually insert them
const sqlValues = codeList.map(c => `  ('${c}', '${batchLabel.replace(/'/g,"''")}')`).join(',\n');
const sql = `insert into redeem_codes (code, batch_label) values\n${sqlValues};\n`;
fs.writeFileSync(sqlPath, sql);

console.log(`Generated ${codeList.length} codes for batch "${batchLabel}"`);
console.log(`  ${csvPath}  (your records)`);
console.log(`  ${sqlPath}  (run this in the Supabase SQL Editor to activate them)`);
