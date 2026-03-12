# BunnyCare Quick Reference Guide

**Last Updated:** March 10, 2026  
**Version:** 2.0

---

## ⚡ 5-Minute Setup

### Frontend Only (No Backend)
```bash
# Option 1: Python
cd /Users/exquis/Downloads/BunnyCare
python -m http.server 8000

# Option 2: Node
npx http-server

# Then visit: http://localhost:8000/bunnycare.html
```

### Full Stack (Frontend + Backend)
```bash
# Terminal 1: Backend
cd backend
npm install
cp .env.example .env
npm run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend
# Open bunnycare.html or use http-server
python -m http.server 8000
# Visit http://localhost:8000/bunnycare.html
```

---

## 📁 File Reference

### Main Files
| File | Purpose | Lines |
|------|---------|-------|
| `bunnycare.html` | Main application | 1,360 |
| `styles.css` | Styling | 2,500+ |
| `form-handler.js` | Form logic v2.0 | 800+ |
| `admin-dashboard.html` | Admin interface | 650 |

### Backend Files
| File | Purpose | Lines |
|------|---------|-------|
| `backend/server.js` | Express API | 450+ |
| `backend/package.json` | Dependencies | 30 |
| `backend/.env.example` | Config template | 25 |

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `COMPLETE_IMPLEMENTATION_GUIDE.md` | Technical deep dive |
| `FORM_FEATURES.md` | Form specifications |
| `PROJECT_DELIVERY_SUMMARY.md` | Delivery report |

---

## 🔧 Configuration

### Frontend (form-handler.js)
```javascript
FormHandler.config = {
  apiEndpoint: 'http://localhost:3001/api',
  enableAnalytics: true,
  enableCaptcha: false, // Set true in production
  paymentGateway: 'paystack' // or 'flutterwave'
};
```

### Backend (.env)
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bunnycare
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password
PAYSTACK_SECRET_KEY=pk_test_xxxxx
JWT_SECRET=your_secret_key_here
```

---

## 🚀 Common Tasks

### Add New Form
1. Add form HTML to bunnycare.html:
```html
<div id="panel-newform" class="tab-content">
  <!-- Form content -->
</div>
```
2. Update button to link to form
3. FormHandler auto-detects and validates

### Change Validation Rules
In `form-handler.js`:
```javascript
validators: {
  customRule: (value) => value.length > 5,
  // Add your validators here
}
```

### Add New API Endpoint
In `backend/server.js`:
```javascript
app.post('/api/your-endpoint', async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Customize Email Template
In `backend/server.js`, update `emailService.sendApplicationConfirmation()`:
```javascript
const html = `
  <!-- Your custom HTML template -->
`;
```

### Change Color Scheme
In `styles.css`:
```css
--mint: #3A8C6E;      /* Primary */
--green: #2D6B55;     /* Dark */
--gold: #D4AF37;      /* Accent */
```

---

## 🎯 Form Handler API

### Initialize
```javascript
FormHandler.init(); // Called automatically on DOM ready
```

### Validate
```javascript
const errors = FormHandler.validateForm(formElement);
```

### Get Data
```javascript
const data = FormHandler.getFormData(formElement);
// Returns: { field1: value1, ..., timestamp, referenceNumber }
```

### Show Success
```javascript
FormHandler.showSuccessModal(data);
```

### Show Alert
```javascript
FormHandler.showAlert('Message', 'success'); // or 'error', 'info'
```

### Start Multi-Step
```javascript
FormHandler.nextStep(wizard);
FormHandler.prevStep(wizard);
```

---

## 📡 API Quick Reference

### Submit Form
```bash
curl -X POST http://localhost:3001/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","formType":"enquiry"}'
```

### Check Status
```bash
curl http://localhost:3001/api/applications/BCAB12XY
```

### Get Analytics
```bash
curl http://localhost:3001/api/admin/analytics
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

---

## 🧪 Testing

### Test Form Submission
1. Open bunnycare.html
2. Fill care enquiry form
3. Submit to test locally
4. Check localStorage: `form_enquiry`

### Test Backend
```bash
node backend/server.js
# Should output: BunnyCare Backend Server running on port 3001
```

### Test Email (Gmail)
1. Enable "Less secure app access"
2. Use app-specific password
3. Check spam folder

### Test Payment (Paystack)
1. Use test API keys
2. Use test card: 4084084084084081
3. Check payment logs

---

## 🐛 Debugging

### Browser Console Errors
1. Open DevTools (F12)
2. Check Console tab
3. Check Network tab for API calls
4. Look for FormHandler initialization message

### Backend Issues
```bash
# Check if running
curl http://localhost:3001/api/health

# View logs
# Check terminal where npm run dev was executed

# Stop server
# Ctrl+C in terminal
```

### Database Issues
```bash
# Test MongoDB connection
mongo "your_connection_string"

# Check collections
use bunnycare
show collections
```

### Email Issues
```javascript
// Test SMTP in backend/server.js:
emailService.transporter.verify((error, success) => {
  if (error) console.error('SMTP Error:', error);
  else console.log('SMTP OK:', success);
});
```

---

## 📊 Admin Dashboard

### Access
```
http://localhost:8000/admin-dashboard.html
```

### Main Views
1. **Dashboard** - Statistics & charts
2. **Applications** - Manage submissions
3. **Analytics** - Form metrics
4. **Payments** - Transaction history

### Common Actions
- Filter by status/type
- Update application status
- Add notes
- Export CSV
- View application details

---

## 🔐 Security Checklist

- [ ] Never commit .env to git
- [ ] Use strong JWT_SECRET (32+ chars)
- [ ] Enable HTTPS in production
- [ ] Set CORS_ORIGIN to your domain
- [ ] Use strong password for MongoDB
- [ ] Enable database backups
- [ ] Keep dependencies updated: `npm update`
- [ ] Review rate limiting settings
- [ ] Enable CAPTCHA in production
- [ ] Use environment variables

---

## 📈 Performance Tips

### Frontend
- Minify CSS/JS in production
- Enable gzip compression
- Use localStorage for form caching
- Lazy load images
- Minimize external dependencies

### Backend
- Enable query indexing on MongoDB
- Use connection pooling
- Cache frequent queries
- Enable compression middleware
- Monitor response times

### Database
- Index heavily-queried fields
- Archive old applications
- Use TTL for temporary data
- Monitor collection size

---

## 🚀 Deployment Checklist

### Before Going Live
- [ ] Update .env with production values
- [ ] Set NODE_ENV=production
- [ ] Enable SSL/HTTPS
- [ ] Configure MongoDB backup
- [ ] Test all email notifications
- [ ] Test payment processing
- [ ] Enable CAPTCHA
- [ ] Setup monitoring
- [ ] Configure custom domain
- [ ] Enable admin authentication

### Hosting Platforms
- **Frontend:** Netlify, Vercel, GitHub Pages
- **Backend:** Heroku, AWS, DigitalOcean
- **Database:** MongoDB Atlas
- **Email:** SendGrid
- **Domain:** Namecheap, GoDaddy, Route53

---

## 🔄 Update & Maintenance

### Check for Updates
```bash
cd backend
npm outdated
npm update
```

### Regular Maintenance
- Monthly: Check logs for errors
- Weekly: Verify backups
- Daily: Monitor form submissions
- Quarterly: Security audit
- Annually: Dependency review

### Backup Strategy
```bash
# Backup MongoDB
mongodump --uri "your_connection_string" --out backup/

# Backup .env
cp backend/.env backup/.env.backup

# Backup codes
# Use git: git push origin main
```

---

## 📚 Documentation Map

```
README.md
├─ Project Overview
├─ Quick Start
├─ Features
└─ Troubleshooting

COMPLETE_IMPLEMENTATION_GUIDE.md
├─ Backend Setup
├─ API Reference
├─ Multi-Step Forms
├─ Payment Integration
├─ Email Service
└─ Deployment

FORM_FEATURES.md
├─ Form Validation
├─ Field Requirements
├─ Testing Checklist
└─ Form-by-Form Guide

PROJECT_DELIVERY_SUMMARY.md
└─ Project Status & Final Report
```

---

## 💡 Pro Tips

### Development
- Use `npm run dev` for auto-restart on changes
- Check `FormHandler.analytics` in console
- Use Chrome DevTools for mobile testing
- Paste test data quickly with auto-save

### Testing
- Test on mobile first
- Use browser's accessibility audit
- Check Lighthouse performance
- Verify email delivery to spam folder too

### Performance
- Use `localStorage.clear()` to reset testing
- Monitor network tab for slow requests
- Check Lighthouse reports
- Profile JavaScript with DevTools

### Debugging
- `FormHandler.analytics` shows form interactions
- Check `localStorage` for saved form data
- Review API response in Network tab
- Enable console logging in form-handler.js

---

## 🎓 Learning Path

1. **Hour 1:** Open in browser, explore forms
2. **Hour 2:** Read README.md & FORM_FEATURES.md
3. **Hour 3:** Review form-handler.js code
4. **Hour 4:** Start backend, review server.js
5. **Hour 5:** Try admin dashboard
6. **Hour 6+:** Read COMPLETE_IMPLEMENTATION_GUIDE.md
7. **Day 2:** Deploy locally, test everything
8. **Day 3:** Deploy to production

---

## 🆘 Quick Help

| Problem | Solution |
|---------|----------|
| Forms not working | Open console (F12), check for errors |
| Backend not responding | Check `http://localhost:3001/api/health` |
| Emails not sending | Verify SMTP in .env, check spam folder |
| Payments failing | Use Paystack/Flutterwave test keys |
| Admin dashboard empty | Check backend is running and has data |
| CORS errors | Update FRONTEND_URL in .env |
| Database not found | Check MONGODB_URI connection string |

---

## 📞 Quick Links

- **GitHub:** [Project Repository]
- **Documentation:** [See README.md]
- **API Docs:** [See COMPLETE_IMPLEMENTATION_GUIDE.md]
- **Issues:** [GitHub Issues]
- **Support:** support@bunnycare.com

---

**Keep this guide handy!** 🚀

**Last Updated:** March 10, 2026  
**Status:** Production Ready v2.0
