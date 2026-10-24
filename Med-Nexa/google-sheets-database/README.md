# Med-Nexa Hospital Management — Google Sheets Database Integration

This setup turns any standard Google Spreadsheet into a cloud database for Med-Nexa without requiring any Google Cloud Console service account credentials, billing, or complex OAuth setup.

---

## ⚡ 4-Step Quick Setup Guide

### Step 1: Create a New Google Sheet
1. Open your browser and navigate to: **[https://sheets.new](https://sheets.new)**
2. Name your sheet at the top left: **`Med-Nexa Hospital Database`**

---

### Step 2: Paste the Apps Script
1. In the Google Sheets top menu bar, click:
   **`Extensions`** > **`Apps Script`**
2. A new tab will open showing an editor.
3. Delete any default code inside the editor.
4. Open [`google-sheets-database/Code.gs`](file:///c:/Users/snehal%20kushwah/Downloads/Navi%20hospital/google-sheets-database/Code.gs), copy the entire code, and paste it into the Apps Script editor.
5. Click the **Save** icon (floppy disk) or press `Ctrl + S`.

---

### Step 3: Run Database Initialization (Creates Tabs & Doctor Data)
1. On the Apps Script toolbar, find the function dropdown (it might say `myFunction`).
2. Select **`setupDatabase`** from the dropdown list.
3. Click **`Run`** (the play button).
4. Google will display a popup: *"Authorization required"*:
   - Click **Review permissions**
   - Choose your Google Account
   - Click **Advanced** (bottom left of popup)
   - Click **Go to Untitled project (unsafe)**
   - Click **Allow**
5. In the Execution log below, you will see:
   ```
   ✅ Med-Nexa Google Sheets Database Initialized Successfully!
   ✅ Seeded 5 specialist doctors into Google Sheets.
   ```
6. Switch back to your Google Sheet tab — you will see 5 green-header tabs created automatically:
   - 🟢 `Users`
   - 🟢 `DoctorProfiles`
   - 🟢 `Appointments`
   - 🟢 `Queues`
   - 🟢 `Consultations`

---

### Step 4: Deploy as a Web App & Copy URL
1. In the Apps Script tab, click the blue **`Deploy`** button at the top right.
2. Select **`New deployment`**.
3. In the modal that opens, click the gear icon (⚙️) next to *Select type* and choose **`Web app`**.
4. Configure these fields:
   - **Description**: `Med-Nexa Live DB`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: **`Anyone`** *(Essential so the backend can read and write data)*
5. Click **`Deploy`**.
6. Google will generate a **Web app URL** that looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
7. Click **`Copy`** next to the Web app URL.

---

### Step 5: Paste URL in Med-Nexa Backend `.env`
Open [`backend/.env`](file:///c:/Users/snehal%20kushwah/Downloads/Navi%20hospital/backend/.env) and set:
```env
GOOGLE_SHEET_WEBAPP_URL=https://script.google.com/macros/s/AKfycbx.../exec
```

Now every new patient registration, specialist appointment booking, OPD token calling, and digital prescription will immediately synchronize with your Google Sheet!
