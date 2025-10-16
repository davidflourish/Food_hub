# FoodHub Production Deployment Guide

## 🚀 Production-Ready Status

This FoodHub platform is now **production-ready** with a clean database and no demo data. The system will start fresh and ready for real vendors and customers.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables (Already Configured)
The following environment variables are already set up:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_DB_URL`
- ✅ `PAYSTACK_PUBLIC_KEY`
- ✅ `PAYSTACK_SECRET_KEY`

### 2. Payment Gateway Configuration

#### Paystack (Currently in Test Mode)
**Current Keys (Test Mode):**
- Public Key: `pk_test_b04c1940d47ab1afdff2ec6ff599bcc5eb2c3f44`
- Secret Key: Configured in environment variables

**For Production Launch:**
1. Log into your [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to Settings → API Keys & Webhooks
3. Switch to "Live" mode
4. Copy your Live Public Key and Live Secret Key
5. Update the following files:

**Update Public Key in:**
- `/components/CustomerApp.tsx` (line ~1194)
- `/utils/paystack.ts` (line ~6)

**Update Secret Key:**
- Update the `PAYSTACK_SECRET_KEY` environment variable with your live secret key

## 🎯 Platform Configuration

### Admin Access
**Email:** `flourisholuwatimilehin@gmail.com`  
**Password:** `Thesameasyours1.`

The admin account is automatically created on first login attempt. Use this to:
- Monitor all vendors and orders
- Track platform commission (4% secret commission on all orders)
- Approve/reject vendor applications
- Manage platform withdrawals

### Platform Economics
- **Commission Rate:** 4% (hidden from vendors)
- **Vendor Receives:** 96% of order total
- **Tax:** 5% (hidden from customers, included in final total)
- **Delivery Fee:** ₦250 (hidden from customers, included in final total)

### Payment Flow
1. Customer places order and pays via Paystack
2. Payment goes to your platform account
3. System automatically:
   - Deducts 4% commission for platform
   - Credits vendor with 96%
   - Tracks commission in admin dashboard
4. Vendors can withdraw from their wallet using Paystack Transfer API

## 🗄️ Database Structure

The platform uses Supabase with a key-value store approach. All data is stored in the `kv_store_8966d869` table with these key patterns:

### Key Patterns
- `vendor:{vendorId}` - Vendor profile and business information
- `menu:{vendorId}:{itemId}` - Menu items for each vendor
- `order:{orderId}` - Customer orders
- `vendor_orders:{vendorId}:{orderId}` - Vendor-specific order index
- `wallet:{vendorId}` - Vendor wallet balance and transaction history
- `commission:{commissionId}` - Platform commission records
- `platform_earnings:{platformOwnerId}` - Total platform earnings
- `withdrawal:{withdrawalId}` - Withdrawal requests and history

### Fresh Start
- No demo data is pre-loaded
- First vendor registration will be your first real vendor
- Database will populate organically as users sign up

## 📱 User Roles & Features

### Vendors
- Register with business details
- Admin approval required (status: pending → verified)
- Create and manage menu items
- View and manage orders
- Track wallet balance
- Request withdrawals (min: ₦5,000)

### Customers
- Browse verified vendors and menus
- Add items to cart
- Checkout with Paystack payment
- Track order status
- View order history

### Admin
- Dashboard with platform analytics
- Commission tracking and reports
- Vendor management (approve/reject/delete)
- Platform wallet and withdrawals
- Order oversight

## 🔒 Security Features

1. **Secret Commission System**
   - 4% commission not visible to vendors
   - Automatic calculation on every order
   - Only admin can view commission data

2. **Hidden Fees**
   - 5% tax calculated but not shown separately
   - ₦250 delivery fee included in total
   - Customers see only final amount

3. **Admin Authentication**
   - Separate admin login system
   - Not part of regular user authentication
   - Access to sensitive commission data

4. **Secure Withdrawals**
   - Vendor withdrawals via Paystack Transfer API
   - Minimum withdrawal: ₦5,000
   - Transaction history tracking

## 🌐 Domain & Hosting

### Recommended Steps
1. Configure custom domain
2. Update CORS settings in server if needed
3. Enable HTTPS (should be automatic with most hosts)
4. Test payment flow with test keys first
5. Switch to live Paystack keys before public launch

## 📊 Post-Launch Monitoring

### Important Metrics to Track
1. **Vendor Metrics**
   - New vendor registrations
   - Pending approvals
   - Active vendors
   - Average menu items per vendor

2. **Order Metrics**
   - Total orders
   - Order success rate
   - Average order value
   - Payment success rate

3. **Financial Metrics**
   - Total revenue processed
   - Platform commission earned
   - Vendor payouts processed
   - Withdrawal requests

4. **Customer Metrics**
   - New customer registrations
   - Repeat order rate
   - Average cart value

### Access Admin Dashboard
- Navigate to admin login
- Use admin credentials
- View real-time analytics and commission reports

## 🐛 Troubleshooting

### Common Issues

**1. Payment Not Processing**
- Verify Paystack keys are correct
- Check if keys are live (not test)
- Ensure account is verified with Paystack

**2. Vendor Can't Withdraw**
- Minimum balance is ₦5,000
- Verify Paystack Transfer API is enabled
- Check secret key has transfer permissions

**3. Orders Not Appearing**
- Check server logs
- Verify Supabase connection
- Ensure service role key is set

## 📞 Support & Maintenance

### Regular Maintenance
- Monitor admin dashboard weekly
- Process vendor approvals promptly
- Review commission reports monthly
- Check for failed withdrawals
- Monitor payment success rates

### Server Logs
- Access via Supabase Functions logs
- Check for error patterns
- Monitor API response times

## 🎉 Launch Checklist

Before going live:

- [ ] Switch Paystack to live keys
- [ ] Test complete order flow
- [ ] Test vendor registration and approval
- [ ] Test vendor withdrawal process
- [ ] Verify admin dashboard access
- [ ] Check commission calculation
- [ ] Test customer payment flow
- [ ] Verify email notifications (if configured)
- [ ] Test on mobile devices
- [ ] Set up monitoring/analytics
- [ ] Prepare customer support process
- [ ] Have admin login details ready

## 💰 Financial Management

### Daily Tasks
- Check new orders
- Process vendor withdrawals
- Monitor payment success rate

### Weekly Tasks
- Review vendor applications
- Check commission earnings
- Analyze order trends

### Monthly Tasks
- Full financial reconciliation
- Platform commission report
- Vendor payout summary
- Customer growth analysis

---

## 🚀 Ready to Launch!

Your FoodHub platform is production-ready with:
- ✅ Clean database (no demo data)
- ✅ Secure payment processing
- ✅ Secret commission tracking
- ✅ Admin dashboard
- ✅ Vendor wallet system
- ✅ Customer checkout flow
- ✅ Mobile-responsive design

**Next Step:** Switch Paystack to live keys and start onboarding your first vendors!

---

**Platform Owner:** Flourish Oluwatimilehin  
**Platform:** FoodHub - Food Delivery Made Easy  
**Currency:** Nigerian Naira (₦)  
**Commission:** 4% (confidential)
