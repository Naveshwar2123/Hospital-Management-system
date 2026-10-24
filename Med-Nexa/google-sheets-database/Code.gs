/**
 * ═════════════════════════════════════════════════════════════════════════
 *   MED-NEXA HOSPITAL MANAGEMENT SYSTEM — GOOGLE SHEETS DATABASE (v1.0)
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Click "Extensions" > "Apps Script"
 * 3. Delete any default code, paste this entire file, and click Save (Ctrl+S)
 * 4. From the toolbar function dropdown, select "setupDatabase" and click "Run"
 *    (Accept Google's permission prompt if asked)
 * 5. Click "Deploy" (top right) > "New deployment"
 * 6. Click the gear icon next to "Select type" > choose "Web app"
 * 7. Set Description: "Med-Nexa DB"
 * 8. Execute as: "Me"
 * 9. Who has access: "Anyone" (Required so your Med-Nexa backend can write to it)
 * 10. Click "Deploy", copy the Web App URL, and paste it into your backend .env file:
 *     GOOGLE_SHEET_WEBAPP_URL=https://script.google.com/macros/s/.../exec
 */

const COLLECTIONS = {
  Users: [
    '_id', 'name', 'email', 'passwordHash', 'role', 'phone', 'createdAt'
  ],
  DoctorProfiles: [
    '_id', 'userId', 'doctorName', 'specialization', 'experience', 'roomNumber', 
    'consultationFee', 'bio', 'isAvailable', 'rating', 'totalReviews', 'createdAt'
  ],
  Appointments: [
    '_id', 'patientId', 'doctorId', 'doctorName', 'patientName', 'date', 
    'slotTime', 'tokenNumber', 'status', 'symptoms', 'consultationFee', 'createdAt'
  ],
  Queues: [
    '_id', 'doctorId', 'doctorName', 'roomNumber', 'currentToken', 
    'servingPatientName', 'waitingCount', 'date', 'status', 'updatedAt'
  ],
  Consultations: [
    '_id', 'appointmentId', 'doctorId', 'patientId', 'diagnosis', 
    'symptoms', 'vitals', 'prescription', 'notes', 'createdAt'
  ]
};

/**
 * Run this function once to set up all sheet tabs, headers, formatting, and sample doctors!
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or format each collection sheet
  Object.keys(COLLECTIONS).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    const headers = COLLECTIONS[sheetName];
    // Write headers if row 1 is empty or missing headers
    const currentFirstRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    const needsHeaders = !currentFirstRow[0] || currentFirstRow[0] !== headers[0];
    
    if (needsHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Beautiful Emerald & White Hospital Styling
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#00a651');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setFontFamily('Arial');
      headerRange.setFontSize(10);
      sheet.setFrozenRows(1);
    }
  });
  
  // Remove default "Sheet1" if empty and other sheets exist
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1 && sheet1.getLastRow() === 0) {
    ss.deleteSheet(sheet1);
  }
  
  // Seed sample specialist doctors if DoctorProfiles is empty
  seedSampleDoctors(ss);
  
  SpreadsheetApp.flush();
  Logger.log('✅ Med-Nexa Google Sheets Database Initialized Successfully!');
}

/**
 * Seeds sample clinical doctors into Users and DoctorProfiles
 */
function seedSampleDoctors(ss) {
  const docSheet = ss.getSheetByName('DoctorProfiles');
  const userSheet = ss.getSheetByName('Users');
  if (!docSheet || !userSheet) return;
  
  if (docSheet.getLastRow() > 1) {
    Logger.log('DoctorProfiles already has data, skipping seed.');
    return;
  }
  
  const sampleDoctors = [
    {
      id: 'doc_priya_01',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@mednexa.com',
      spec: 'Cardiology',
      exp: 14,
      room: '104',
      fee: 800,
      bio: 'Senior Consultant Cardiologist specializing in preventive cardiology and clinical heart health.'
    },
    {
      id: 'doc_vikram_02',
      name: 'Dr. Vikram Seth',
      email: 'vikram.seth@mednexa.com',
      spec: 'Pediatrics',
      exp: 10,
      room: '102',
      fee: 700,
      bio: 'Pediatric specialist focused on newborn health, infant nutrition, and child wellness.'
    },
    {
      id: 'doc_rajesh_03',
      name: 'Dr. Rajesh Iyer',
      email: 'rajesh.iyer@mednexa.com',
      spec: 'Orthopedics',
      exp: 16,
      room: '106',
      fee: 900,
      bio: 'Senior Orthopedic Surgeon specializing in joint replacement, sports trauma, and spine care.'
    },
    {
      id: 'doc_sunita_04',
      name: 'Dr. Sunita Patel',
      email: 'sunita.patel@mednexa.com',
      spec: 'Neurology',
      exp: 12,
      room: '101',
      fee: 1000,
      bio: 'Consultant Neurologist with extensive expertise in stroke management and neurological disorders.'
    },
    {
      id: 'doc_amit_05',
      name: 'Dr. Amit Verma',
      email: 'amit.verma@mednexa.com',
      spec: 'General Medicine',
      exp: 15,
      room: '103',
      fee: 600,
      bio: 'Internal Medicine specialist treating chronic lifestyle disorders, hypertension, and diabetes.'
    }
  ];
  
  const now = new Date().toISOString();
  
  sampleDoctors.forEach(doc => {
    // Add User row: ['_id', 'name', 'email', 'passwordHash', 'role', 'phone', 'createdAt']
    userSheet.appendRow([
      doc.id, doc.name, doc.email, 'demo123_hash', 'doctor', '+91 98765 43210', now
    ]);
    
    // Add DoctorProfile row
    docSheet.appendRow([
      'prof_' + doc.id,
      doc.id,
      doc.name,
      doc.spec,
      doc.exp,
      doc.room,
      doc.fee,
      doc.bio,
      true,
      4.9,
      48,
      now
    ]);
  });
  
  Logger.log('✅ Seeded 5 specialist doctors into Google Sheets.');
}

/**
 * GET Handler - Health checks and read queries
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'ping';
    
    if (action === 'ping') {
      return jsonResponse({
        success: true,
        message: 'Med-Nexa Google Sheets DB is Live and Ready',
        timestamp: new Date().toISOString(),
        collections: Object.keys(COLLECTIONS)
      });
    }
    
    if (action === 'find') {
      const collection = params.collection;
      const data = getCollectionRows(collection);
      return jsonResponse({ success: true, collection: collection, data: data });
    }
    
    return jsonResponse({ success: false, message: 'Unknown GET action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * POST Handler - CRUD Operations from Node.js Backend
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, message: 'Empty POST body' });
    }
    
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const collection = body.collection;
    
    if (action === 'ping') {
      return jsonResponse({ success: true, message: 'Google Sheets DB connection active' });
    }
    
    if (action === 'setup') {
      setupDatabase();
      return jsonResponse({ success: true, message: 'Database setup completed' });
    }
    
    if (!COLLECTIONS[collection]) {
      return jsonResponse({ success: false, message: 'Invalid collection: ' + collection });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(collection);
    if (!sheet) {
      return jsonResponse({ success: false, message: 'Sheet not found: ' + collection });
    }
    
    // 1. FIND ALL OR BY FILTER
    if (action === 'find') {
      const rows = getCollectionRows(collection);
      const filtered = filterRows(rows, body.filter || {});
      return jsonResponse({ success: true, count: filtered.length, data: filtered });
    }
    
    // 2. FIND ONE
    if (action === 'findOne') {
      const rows = getCollectionRows(collection);
      const filtered = filterRows(rows, body.filter || {});
      return jsonResponse({ success: true, data: filtered.length > 0 ? filtered[0] : null });
    }
    
    // 3. FIND BY ID
    if (action === 'findById') {
      const rows = getCollectionRows(collection);
      const item = rows.find(r => String(r._id) === String(body.id));
      return jsonResponse({ success: true, data: item || null });
    }
    
    // 4. INSERT ONE
    if (action === 'insertOne') {
      const doc = body.doc || {};
      if (!doc._id) {
        doc._id = Utilities.getUuid();
      }
      if (!doc.createdAt) {
        doc.createdAt = new Date().toISOString();
      }
      
      const headers = COLLECTIONS[collection];
      const rowValues = headers.map(h => formatCellValue(doc[h]));
      sheet.appendRow(rowValues);
      
      return jsonResponse({ success: true, message: 'Row inserted', data: doc });
    }
    
    // 5. UPDATE ONE
    if (action === 'updateOne') {
      const id = body.id;
      const updateData = body.update || {};
      const headers = COLLECTIONS[collection];
      const data = sheet.getDataRange().getValues();
      
      let foundRow = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          foundRow = i + 1; // 1-indexed
          break;
        }
      }
      
      if (foundRow === -1) {
        return jsonResponse({ success: false, message: 'Record with _id ' + id + ' not found' });
      }
      
      headers.forEach((header, colIdx) => {
        if (updateData[header] !== undefined) {
          sheet.getRange(foundRow, colIdx + 1).setValue(formatCellValue(updateData[header]));
        }
      });
      
      return jsonResponse({ success: true, message: 'Row updated', id: id });
    }
    
    // 6. DELETE ONE
    if (action === 'deleteOne') {
      const id = body.id;
      const data = sheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.deleteRow(foundRow);
        return jsonResponse({ success: true, message: 'Row deleted', id: id });
      }
      return jsonResponse({ success: false, message: 'Record not found to delete' });
    }
    
    return jsonResponse({ success: false, message: 'Unrecognized action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Helper: Reads all data rows from a collection sheet as objects
 */
function getCollectionRows(collection) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(collection);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers or empty
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    headers.forEach((header, idx) => {
      let val = data[i][idx];
      // Try to parse stringified JSON objects
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      rowObj[header] = val;
    });
    rows.push(rowObj);
  }
  
  return rows;
}

/**
 * Helper: Filter rows by match query
 */
function filterRows(rows, filter) {
  return rows.filter(item => {
    for (const key of Object.keys(filter)) {
      if (String(item[key]) !== String(filter[key])) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Helper: Formats object/array values to JSON strings for cell storage
 */
function formatCellValue(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

/**
 * Helper: Standard JSON response
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
