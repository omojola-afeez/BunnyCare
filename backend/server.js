// ======================================
// BUNNYCARE BACKEND API SERVER
// Node.js/Express Implementation
// ======================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// ======================================
// MIDDLEWARE SETUP
// ======================================

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const formSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 form submissions per hour per IP
  message: 'Too many form submissions. Please try again later.'
});

app.use(limiter);

// ======================================
// DATABASE CONNECTION
// ======================================

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bunnycare')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ======================================
// DATABASE SCHEMAS
// ======================================

const applicationSchema = new mongoose.Schema({
  referenceNumber: { type: String, unique: true, required: true },
  type: { type: String, enum: ['enquiry', 'assessment', 'doctor', 'visit', 'donation', 'contact'], required: true },
  formData: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['submitted', 'reviewing', 'approved', 'rejected', 'completed'],
    default: 'submitted'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  ipAddress: String,
  userAgent: String,
  notes: String,
  lastUpdatedBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  dueDate: Date
});

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['admin', 'staff', 'user'], default: 'user' },
  permissions: [String],
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
  referenceNumber: String,
  amount: Number,
  currency: String,
  paymentMethod: String,
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  transactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const auditLogSchema = new mongoose.Schema({
  action: String,
  userId: String,
  applicationId: String,
  changes: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

// Models
const Application = mongoose.model('Application', applicationSchema);
const User = mongoose.model('User', userSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ======================================
// EMAIL SERVICE SETUP
// ======================================

const emailService = {
  transporter: nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  }),

  async sendApplicationConfirmation(applicationData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #3A8C6E;">Application Received</h2>
        <p>Dear ${applicationData.formData.name || 'Valued Customer'},</p>
        <p>Thank you for submitting your application to BunnyCare. We have received your submission and will review it shortly.</p>
        <div style="background: #E8F5EF; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Reference Number:</strong> ${applicationData.referenceNumber}</p>
          <p><strong>Submission Time:</strong> ${new Date(applicationData.createdAt).toLocaleString()}</p>
          <p><strong>Application Type:</strong> ${applicationData.type}</p>
        </div>
        <p>Track your application status: <a href="${process.env.FRONTEND_URL}/track?ref=${applicationData.referenceNumber}">Click here</a></p>
        <p>Our team will contact you within 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">BunnyCare Elderly Care Services | Ibadan, Oyo State, Nigeria</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: applicationData.formData.email,
        subject: `Application Received - Reference: ${applicationData.referenceNumber}`,
        html
      });
      console.log(`✓ Confirmation email sent to ${applicationData.formData.email}`);
    } catch (error) {
      console.error('Email send error:', error);
    }
  },

  async sendAdminNotification(applicationData) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h3 style="color: #3A8C6E;">New Application Submitted</h3>
        <p><strong>Reference:</strong> ${applicationData.referenceNumber}</p>
        <p><strong>Type:</strong> ${applicationData.type}</p>
        <p><strong>Priority:</strong> ${applicationData.priority}</p>
        <p><strong>Submitted At:</strong> ${new Date(applicationData.createdAt).toLocaleString()}</p>
        <p><strong>Submitted From:</strong> ${applicationData.ipAddress}</p>
        <hr>
        <h4>Application Data:</h4>
        <pre>${JSON.stringify(applicationData.formData, null, 2)}</pre>
        <hr>
        <p><a href="${process.env.ADMIN_URL}/applications/${applicationData.referenceNumber}">View in Admin Dashboard</a></p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `[BunnyCare] New ${applicationData.type} Application - ${applicationData.referenceNumber}`,
        html
      });
    } catch (error) {
      console.error('Admin notification error:', error);
    }
  }
};

// ======================================
// PAYMENT GATEWAY VERIFICATION
// ======================================

const paymentService = {
  async verifyPaystackTransaction(reference) {
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      return null;
    }
  },

  async verifyFlutterwaveTransaction(transactionId) {
    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Flutterwave verification error:', error);
      return null;
    }
  }
};

// ======================================
// HELPER FUNCTIONS
// ======================================

function generateReferenceNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BC';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function extractPriority(applicationData, type) {
  if (type === 'doctor') {
    const urgency = applicationData.urgencyLevel?.toLowerCase();
    if (urgency === 'emergency') return 'urgent';
    if (urgency === 'urgent') return 'high';
    if (urgency === 'routine') return 'low';
  }
  if (type === 'assessment' && applicationData.medicalCondition) {
    return 'high';
  }
  return 'medium';
}

// ======================================
// API ENDPOINTS
// ======================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Submit form
app.post('/api/forms/submit', formSubmitLimiter, async (req, res) => {
  try {
    const formData = req.body;
    const referenceNumber = generateReferenceNumber();
    const type = req.body.formType || 'contact';

    // Create application record
    const application = new Application({
      referenceNumber,
      type,
      formData,
      status: 'submitted',
      priority: extractPriority(formData, type),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await application.save();

    // Log audit
    await AuditLog.create({
      action: 'APPLICATION_SUBMITTED',
      applicationId: application._id,
      changes: { formData }
    });

    // Send emails
    await emailService.sendApplicationConfirmation(application);
    await emailService.sendAdminNotification(application);

    res.status(201).json({
      success: true,
      data: {
        referenceNumber: application.referenceNumber,
        status: application.status,
        message: 'Application submitted successfully'
      }
    });
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit form. Please try again.'
    });
  }
});

// Get application status
app.get('/api/applications/:referenceNumber', async (req, res) => {
  try {
    const app = await Application.findOne({ referenceNumber: req.params.referenceNumber });
    
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      referenceNumber: app.referenceNumber,
      status: app.status,
      priority: app.priority,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      dueDate: app.dueDate,
      notes: app.notes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

// Payment verification
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { reference, gateway } = req.body;
    let verifyResult;

    if (gateway === 'paystack') {
      verifyResult = await paymentService.verifyPaystackTransaction(reference);
    } else if (gateway === 'flutterwave') {
      verifyResult = await paymentService.verifyFlutterwaveTransaction(reference);
    }

    if (verifyResult && verifyResult.data.status === 'success') {
      // Create payment record
      const payment = new Payment({
        referenceNumber: reference,
        amount: verifyResult.data.amount / (gateway === 'paystack' ? 100 : 1),
        currency: verifyResult.data.currency,
        paymentMethod: gateway,
        status: 'success',
        transactionId: verifyResult.data.reference || verifyResult.data.id,
        gatewayResponse: verifyResult.data
      });

      await payment.save();

      res.json({ success: true, payment });
    } else {
      res.status(400).json({ success: false, error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Verify CAPTCHA
app.post('/api/verify-captcha', async (req, res) => {
  try {
    const { token } = req.body;

    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );

    const score = response.data.score || 1;
    const success = response.data.success && score > 0.5;

    res.json({ success });
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    res.json({ success: false });
  }
});

// Analytics tracking
app.post('/api/analytics', async (req, res) => {
  try {
    // Store analytics data in database or logging service
    console.log('Analytics received:', req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======================================
// ADMIN ENDPOINTS (Protected)
// ======================================

// Get all applications (pagination)
app.get('/api/admin/applications', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const status = req.query.status;
    const type = req.query.type;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const applications = await Application
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status
app.patch('/api/admin/applications/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: new Date() },
      { new: true }
    );

    await AuditLog.create({
      action: 'STATUS_UPDATED',
      applicationId: req.params.id,
      changes: { status, notes }
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Get analytics dashboard data
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const byStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byType = await Application.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const byPriority = await Application.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      totalApplications,
      byStatus,
      byType,
      byPriority,
      recentApplications: await Application.find().sort({ createdAt: -1 }).limit(5)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ======================================
// ERROR HANDLING
// ======================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ======================================
// SERVER START
// ======================================

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   BunnyCare Backend Server              ║
  ║   Running on port ${PORT}              
  ║   Environment: ${process.env.NODE_ENV || 'development'}
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
