# UAT Testing Guide - Spot Incentive Reward System

## 🎯 Overview
This guide helps you test the Spot Incentive Reward system where canvassers submit sales reports and administrators send rewards via Benepik API.

---

## 🔐 UAT Environment Credentials

### 1. Canvasser Login
- **Phone Number:** `7408108617`
- **Login URL:** `/login/canvasser`

### 2. Administrator Login
- **Username:** `uat-admin`
- **Password:** `uat-password-123`
- **Login URL:** `/login/role`

### 3.Credentials
```
UAT_TOKEN_SECRET=Kf7A9mQ2ZrB6xD5P
UAT_CLIENT_ID=ZOPPER4321
```

---

## 📋 Complete User Flow

### Step 1: Canvasser Submits Report
1. Go to `/login/canvasser`
2. Enter phone: `UAT CANVASSER PHONE`
3. Enter OTP (check Whatsapp)
4. Navigate to **Incentive Form**
5. Fill in sale details:
   - Select Store
   - Select Device (Godrej SKU)
   - Select Plan (1 Year / 2 Year / 3 Year / 4 Year)
   - Enter Serial Number (IMEI)
   - Enter Customer Details
6. Submit the form
7. View submitted report in **Passbook**

### Step 2: Administrator Views Reports
1. Go to `/login/role`
2. Login as `uat-admin` / `uat-password-123`
3. Navigate to **Spot Incentive Report**
4. View all submitted reports with filters:
   - Search by canvasser phone, store, device, serial number
   - Filter by store, plan type, payment status
   - Filter by date
5. See report details:
   - Canvasser name and phone
   - Store name and city
   - Device model and category
   - Plan type and price
   - Incentive amount
   - Payment status (Paid/Pending)

### Step 3: Administrator Sends Rewards
1. Click **"Send Rewards"** button
2. Select reports using checkboxes (only unpaid reports)
3. Click **"Send (X)"** button (X = number of selected reports)
4. **OTP is sent** - Check Whatsapp for OTP code:
5. Enter the 6-digit OTP in the modal
6. Click **"Verify OTP"**
7. System processes rewards via Benepik API
8. View success summary:
   - Number of successful rewards
   - Number of failed rewards
   - Total processed
9. Reports are marked as **"Paid"**

### Step 4: Canvasser Views Paid Rewards
1. Login as canvasser (`UAT CANVASSER PHONE`)
2. Navigate to **Passbook**
3. View updated transactions:
   - Paid status
   - Payment date
   - Voucher code (if applicable)
4. Check summary statistics:
   - Total earned
   - Total paid
   - Total pending

---

## 🧪 API Test Cases

### Test Case 1: Successful Reward Sending (Single Report)

**Request:**
```json
{
  "reportId": "valid-report-id"
}
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "message": "Reward sent successfully",
  "data": {
    "reportId": "valid-report-id",
    "canvasserPhone": "7408108617",
    "rewardAmount": "150",
    "benepikResponse": {
      "code": 1000,
      "success": 1,
      "message": "Success"
    }
  }
}
```

---

### Test Case 3: Unauthorized Access (No Auth Token)

**Request:** No authentication cookie

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Unauthorized"
}
```

---

### Test Case 4: Duplicate Reward Prevention

**Scenario:** Report already has `transactionId` (already paid)

**Expected Response:** `409 Conflict`
```json
{
  "error": "Reward already sent for this report",
  "message": "This report has already been processed",
  "transactionId": "TXN-1234567890"
}
```

---

### Test Case 5: Report Not Found

**Request:** Invalid or non-existent report ID

**Expected Response:** `404 Not Found`
```json
{
  "error": "Report not found"
}
```

---

### Test Case 6: Missing Canvasser Details

**Scenario:** Report exists but canvasser user is deleted/missing

**Expected Response:** `404 Not Found`
```json
{
  "error": "Canvasser not found for this report"
}
```

---


### Test Case 9: Invalid OTP

**Request:**
```json
{
  "otp": "999999"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Invalid OTP"
}
```

---

### Test Case 10: Expired OTP

**Scenario:** OTP created more than 5 minutes ago

**Expected Response:** `400 Bad Request`
```json
{
  "error": "OTP expired. Please request a new OTP."
}
```

---

### Test Case 12: Missing OTP in Request

**Request:**
```json
{}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "OTP is required"
}
```

---

### Test Case 13: Benepik API Authentication Failure

**Scenario:** Invalid `UAT_TOKEN_SECRET` or `UAT_CLIENT_ID`

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Benepik API error",
  "code": 1005,
  "message": "Authentication Failed",
  "httpStatus": 401
}
```

---

### Test Case 14: Benepik API Insufficient Balance

**Scenario:** Benepik account has insufficient balance

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Benepik API error",
  "code": 1012,
  "message": "Insufficient Balance",
  "httpStatus": 400
}
```

---

### Test Case 15: Benepik API Service Unavailable

**Scenario:** Benepik service is down

**Expected Response:** `503 Service Unavailable`
```json
{
  "error": "Benepik API error",
  "code": 503,
  "message": "Benepik Service Temporarily Unavailable",
  "httpStatus": 503
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "reportIds must be a non-empty array"
}
```

---

### Test Case 18: Partial Success in Bulk Operation

**Scenario:** Some reports already processed, some pending

**Expected Response:** `409 Conflict`
```json
{
  "error": "Some reports already processed",
  "message": "2 report(s) have already been processed",
  "alreadyProcessedIds": ["report-1", "report-2"],
  "pendingIds": ["report-3", "report-4"]
}
```

---

### Test Case 19: Missing UAT Configuration

**Scenario:** `UAT_TOKEN_SECRET` not set in environment

**Expected Response:** `500 Internal Server Error`
```json
{
  "error": "UAT_TOKEN_SECRET not configured"
}
```

---

### Test Case 20: Admin Phone Not Configured

**Scenario:** ZopperAdmin record has no phone number

**Expected Response:** `500 Internal Server Error`
```json
{
  "error": "Admin phone number not configured"
}
```

---


