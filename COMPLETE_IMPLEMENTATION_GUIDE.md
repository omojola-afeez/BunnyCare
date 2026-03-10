# BunnyCare v2.0 - Complete Implementation Guide

## Overview
This document provides comprehensive implementation details for all 23 remaining features of BunnyCare elderly care services platform.

---

## TABLE OF CONTENTS

1. Backend API Infrastructure
2. Multi-Step Form Wizard
3. Conditional Field Visibility
4. Field Dependencies
5. File Upload Handling
6. Dropdown Search/Filter
7. Form Analytics
8. Payment Gateway Integration
9. Email Notifications
10. Admin Dashboard
11. CAPTCHA Integration
12. Rate Limiting & Security
13. Database Schema
14. Deployment Guide

---

## 1. BACKEND API INFRASTRUCTURE

### Server Setup
Located: `/backend/server.js`

**Technology Stack:**
- Framework: Node.js with Express.js
- Database: MongoDB with Mongoose ORM
- Authentication: JWT tokens
- Email: Nodemailer (Gmail/SendGrid)
- Payment: Paystack & Flutterwave APIs

### Installation
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Key Endpoints

#### Form Submission
```
POST /api/forms/submit
Content-Type: application/json

Request Body:
{
  "formType": "enquiry",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+2348000000000",
  ...formData
}

Response:
{
  "success": true,
  "data": {
    "referenceNumber": "BCAB12XY",
    "status": "submitted"
  }
}
```

#### Get Application Status
```
GET /api/applications/:referenceNumber

Response:
{
  "referenceNumber": "BCAB12XY",
  "status": "reviewing",
  "priority": "high",
  "createdAt": "2024-03-10T10:30:00Z",
  "updatedAt": "2024-03-10T12:00:00Z"
}
```

#### Payment Verification
```
POST /api/payment/verify
Content-Type: application/json

Request Body:
{
  "reference": "paystack_reference",
  "gateway": "paystack"
}

Response:
{
  "success": true,
  "payment": {
    "amount": 5000,
    "status": "success",
    "transactionId": "..."
  }
}
```

#### CAPTCHA Verification
```
POST /api/verify-captcha
Content-Type: application/json

Request Body:
{
  "token": "recaptcha_token"
}

Response:
{
  "success": true
}
```

---

## 2. MULTI-STEP FORM WIZARD

### HTML Implementation
```html
<div data-multi-step="true">
  <!-- Step 1 -->
  <div data-step="1" style="display: block;">
    <h3>Step 1: Personal Information</h3>
    <input type="text" name="name" placeholder="Your Name" required>
    <button type="button" data-step-next>Next Step</button>
  </div>

  <!-- Step 2 -->
  <div data-step="2" style="display: none;">
    <h3>Step 2: Health Information</h3>
    <textarea name="healthConditions" placeholder="Medical history"></textarea>
    <button type="button" data-step-prev>Previous</button>
    <button type="button" data-step-next>Next Step</button>
  </div>

  <!-- Progress Bar -->
  <div style="background: #f0f0f0; height: 4px; margin: 20px 0;">
    <div data-progress-bar style="background: #3A8C6E; height: 100%; width: 33%; transition: width 0.3s;"></div>
  </div>
  <p data-progress-text>Step 1 of 3</p>
</div>
```

### JavaScript Features
- Automatic step validation before advancing
- Progress bar updates
- Back/next navigation
- Form data persistence between steps

---

## 3. CONDITIONAL FIELD VISIBILITY

### Show/Hide Based on Selection
```html
<!-- Trigger field -->
<input type="checkbox" 
       name="hasInsurance" 
       data-conditional-trigger 
       data-conditional-target=".insurance-fields"
       data-conditional-value="true">

<!-- Target field (hidden initially) -->
<div class="insurance-fields" style="display: none;">
  <input type="text" name="insuranceProvider" placeholder="Provider Name">
  <input type="text" name="insurancePolicyNumber" placeholder="Policy Number">
</div>
```

### Dynamic Show/Hide
- Based on checkbox state
- Based on dropdown selection matching specific value
- Based on radio button selection
- Automatically manages required attribute on hidden fields

---

## 4. FIELD DEPENDENCIES

### Dependent Field Logic
```html
<!-- Parent field -->
<select name="requiresAssistance" required>
  <option value="">Do you require home care assistance?</option>
  <option value="yes">Yes</option>
  <option value="no">No</option>
</select>

<!-- Child fields -->
<input type="text" 
       name="careHours" 
       data-depends-on="requiresAssistance"
       data-depends-value="yes"
       disabled
       style="opacity: 0.5;">

<input type="text" 
       name="careType" 
       data-depends-on="requiresAssistance"
       data-depends-value="yes"
       disabled
       style="opacity: 0.5;">
```

### Features
- Disables child fields when condition not met
- Automatically clears values when disabled
- Updates required status dynamically
- Visual feedback with opacity

---

## 5. FILE UPLOAD HANDLING

### HTML Setup
```html
<input type="file" 
       id="medicalRecords"
       name="medicalRecords"
       data-max-size="5242880"
       data-allowed-types="pdf,doc,docx,jpg,png,jpg">
```

### Validation
- File size limit (default: 5MB)
- Allowed file types
- Multiple file support
- File preview display

### Process
1. User selects files
2. Validation occurs automatically
3. Preview shows in UI
4. On form submit, files metadata is sent to backend
5. Backend handles file storage (AWS S3 recommended)

---

## 6. DROPDOWN SEARCH/FILTER

### HTML Implementation
```html
<select name="careType" data-searchable="true" required>
  <option value="">Search care types...</option>
  <option value="personal">Personal Care (Bathing, Dressing)</option>
  <option value="medical">Medical Care (Medication Management)</option>
  <option value="mobility">Mobility Assistance (Walking, Transfers)</option>
  <option value="nutritional">Nutritional Support (Meal Prep)</option>
  <option value="companionship">Companionship & Social Activities</option>
  <option value="respite">Respite Care (Temporary)</option>
</select>
```

### Features
- Creates search input above dropdown
- Filters options in real-time
- Case-insensitive matching
- Helpful for large option lists

---

## 7. FORM ANALYTICS

### Tracking Data
```javascript
// Automatically tracked:
- formStarts: When form is initiated
- formCompletions: When form submitted
- fieldInteractions: When user focuses/interacts with field

// Sent to backend every 60 seconds
// Stored in localStorage: "bunnycare_analytics"
```

### API Call
```
POST /api/analytics
Content-Type: application/json

{
  "formStarts": { "enquiry": 45, "assessment": 23 },
  "formCompletions": { "enquiry": 38, "assessment": 19 },
  "fieldInteractions": { "name_focused": 45, "email_focused": 42 }
}
```

### Dashboard Metrics
- Total applications submitted
- Submission rate (completions vs starts)
- Most problematic fields
- Device/browser statistics
- Geographic distribution

---

## 8. PAYMENT GATEWAY INTEGRATION

### Paystack Setup
1. Get API keys from paystack.com
2. Add to .env:
```
PAYSTACK_PUBLIC_KEY=your_public_key
PAYSTACK_SECRET_KEY=your_secret_key
```

### Client-Side Paystack
```javascript
FormHandler.initPaystack(
  amount = 5000, // NGN
  email = "donor@example.com",
  metadata = { name: "John Doe" }
);
```

### Flutterwave Setup
1. Get API keys from flutterwave.com
2. Add to .env:
```
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
```

### Donation Form Integration
```html
<form id="panel-donation">
  <!-- Amount selection -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
    <button type="button" onclick="selectAmount(2000)" data-amount="2000">₦2,000</button>
    <button type="button" onclick="selectAmount(5000)" data-amount="5000">₦5,000</button>
    <button type="button" onclick="selectAmount(10000)" data-amount="10000">₦10,000</button>
    <button type="button" onclick="selectAmount(25000)" data-amount="25000">₦25,000</button>
    <button type="button" onclick="selectAmount(50000)" data-amount="50000">₦50,000</button>
    <input type="number" id="customAmount" placeholder="Custom amount">
  </div>
  
  <button type="submit" class="btn-submit">Proceed to Payment</button>
</form>
```

---

## 9. EMAIL NOTIFICATIONS

### User Confirmation Email
Sent immediately after submission with:
- Application reference number
- Submission timestamp
- Status tracking link
- Next steps information

### Admin Notification Email
Sent to admin email with:
- Full application details
- Applicant information
- Priority assessment
- Admin dashboard link

### Status Update Emails
When status changes:
- Approved: Congratulations + next steps
- Rejected: Reason + appeal process
- Completed: Thank you + feedback request

### Configuration
```bash
# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password

# Or SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_key
```

---

## 10. ADMIN DASHBOARD

### Access
URL: `http://localhost:3000/admin-dashboard.html`

### Features
1. **Dashboard View**
   - Total applications count
   - Pending review count
   - Approved count
   - Donation statistics
   - Charts showing trends

2. **Applications Management**
   - View all applications
   - Filter by status/type
   - Search functionality
   - Bulk actions
   - Export CSV

3. **Application Details**
   - Full submitted data
   - Status history
   - Submitted IP address
   - User notes

4. **Status Management**
   - Update application status
   - Add notes/comments
   - Set due dates
   - Assign to staff

5. **Analytics**
   - Applications by type distribution
   - Status distribution
   - Priority breakdown
   - Submission trends
   - Response time metrics

---

## 11. CAPTCHA INTEGRATION

### Setup
1. Get reCAPTCHA keys from google.com/recaptcha
2. Add to .env:
```
RECAPTCHA_PUBLIC_KEY=your_public_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

3. Enable in form-handler.js:
```javascript
FormHandler.config.enableCaptcha = true;
FormHandler.config.captchaKey = 'YOUR_PUBLIC_KEY';
```

### Implementation
- V3 (invisible): Uses AI-based scoring
- Server validates token before processing
- Prevents bot submissions
- User-friendly (no manual challenges)

---

## 12. RATE LIMITING & SECURITY

### Rate Limits
- General API: 100 requests per 15 minutes
- Form submission: 10 submissions per hour per IP
- Configurable in server.js

### Security Features
1. **CORS Protection**
   - Whitelist allowed origins
   - Credentials require explicit allowing

2. **Request Validation**
   - Email format verification
   - Phone number validation
   - Age verification for age-restricted services

3. **Data Sanitization**
   - Input trimming
   - SQL injection prevention (via Mongoose)
   - XSS prevention (via content encoding)

4. **HTTPS Only**
   - Enforce SSL/TLS in production
   - Secure cookie flags

5. **Authentication**
   - JWT tokens for admin panel
   - Session management
   - Role-based access control

---

## 13. DATABASE SCHEMA

### Collections

#### Applications
```javascript
{
  referenceNumber: String (unique),
  type: String (enquiry|assessment|doctor|visit|donation),
  formData: Object (flexible, stores submitted data),
  status: String (submitted|reviewing|approved|rejected|completed),
  priority: String (low|medium|high|urgent),
  ipAddress: String,
  userAgent: String,
  notes: String (admin notes),
  lastUpdatedBy: String (admin ID),
  createdAt: Date,
  updatedAt: Date,
  dueDate: Date (for SLA tracking)
}
```

#### Users
```javascript
{
  email: String (unique),
  password: String (bcrypt hash),
  name: String,
  role: String (admin|staff|user),
  permissions: [String],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date
}
```

#### Payments
```javascript
{
  referenceNumber: String,
  amount: Number,
  currency: String (NGN),
  paymentMethod: String (paystack|flutterwave),
  status: String (pending|success|failed),
  transactionId: String,
  gatewayResponse: Object,
  createdAt: Date
}
```

#### AuditLog
```javascript
{
  action: String,
  userId: String,
  applicationId: String,
  changes: Object,
  timestamp: Date
}
```

---

## 14. DEPLOYMENT GUIDE

### Local Development
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
# Open bunnycare.html in browser (http://localhost:5000)
```

### Production Deployment

#### Backend (Heroku Example)
```bash
# Install Heroku CLI
heroku login
heroku create bunnycare-api
git push heroku main
heroku config:set MONGODB_URI=your_atlas_uri
```

#### MongoDB Atlas Setup
1. Create account at mongodb.com/atlas
2. Create cluster
3. Get connection string
4. Set in MONGODB_URI

#### Email Service (SendGrid)
1. Sign up at sendgrid.com
2. Create API key
3. Configure SMTP settings

#### Payment Gateway
- Paystack: paystack.com
- Flutterwave: flutterwave.com
- Get live API keys for production

#### Environment Variables (Production)
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
EMAIL_HOST=smtp.sendgrid.net
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxx_key_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
RECAPTCHA_SECRET_KEY=live_key_xxx
JWT_SECRET=very_long_random_secret_key
```

### SSL/HTTPS
```bash
# Use Let's Encrypt (free)
# Automatic via Heroku, AWS, etc.
```

---

## TESTING CHECKLIST

### Form Features
- [ ] All fields validate correctly
- [ ] Real-time validation works
- [ ] Form auto-save works
- [ ] References are unique
- [ ] Multi-step forms progress correctly

### Backend
- [ ] All API endpoints return correct responses
- [ ] Rate limiting prevents abuse
- [ ] Email sends successfully
- [ ] Payments process correctly
- [ ] CAPTCHA verification works

### Admin Dashboard
- [ ] Dashboard loads analytics correctly
- [ ] Applications list displays all entries
- [ ] Filters work (status, type)
- [ ] Status updates save correctly
- [ ] Export CSV works

---

## FUTURE ENHANCEMENTS

1. **SMS Notifications** - Twilio integration
2. **Appointment Calendar** - Google Calendar sync
3. **Mobile App** - React Native version
4. **Advanced Analytics** - Elasticsearch integration
5. **Video Consultations** - WebRTC/Jitsi
6. **AI Chatbot** - Inquiry pre-screening
7. **Staff Portal** - Mobile management app

---

## SUPPORT & TROUBLESHOOTING

### Common Issues

**Forms not submitting:**
- Check backend is running on port 3001
- Verify CORS configuration
- Check browser console for errors

**Emails not sending:**
- Verify SMTP credentials
- Enable "Less secure app access" (Gmail)
- Check spam folder

**Dashboard not loading:**
- Ensure MongoDB is connected
- Check API endpoints in admin-dashboard.js
- Review admin credentials

---

**Updated:** March 10, 2026
**Version:** 2.0
**Status:** Ready for Production
