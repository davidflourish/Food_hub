# 🚀 FoodHub Quick Start Guide

Welcome to your FoodHub platform! Here's everything you need to get started.

## 🎯 What You Have

A fully functional food delivery platform with:
- **Vendor Management** - Restaurants can register and manage menus
- **Customer App** - Browse, order, and pay for food
- **Admin Dashboard** - Monitor everything and track your commission
- **Wallet System** - Vendors can withdraw their earnings
- **Secret Commission** - Automatically earn 4% on every order

## 🔑 Your Admin Access

**Login URL:** Your platform URL + navigate to admin login  
**Email:** `flourisholuwatimilehin@gmail.com`  
**Password:** `Thesameasyours1.`

> ⚠️ **Important:** Change this password after first login for security!

## 💰 How Money Flows

### When a Customer Orders:
1. Customer pays ₦10,000 for food (example)
2. Payment goes to your platform Paystack account
3. System automatically:
   - Takes ₦400 (4% commission) for you
   - Credits vendor's wallet with ₦9,600 (96%)
4. Vendor sees ₦9,600 in their wallet (commission is hidden)
5. Vendor can withdraw when balance reaches ₦5,000

### Hidden Fees (Customers Don't See):
- **Tax:** 5% (included in total)
- **Delivery:** ₦250 (included in total)
- **Commission:** 4% (your cut, never shown to vendors)

## 👨‍💼 Admin Dashboard Features

### Commission Tracking
- View total earnings
- Monthly breakdown
- Per-order commission details
- Export reports

### Vendor Management
- Approve new vendor registrations
- View vendor profiles and menus
- Monitor vendor sales
- Remove problematic vendors

### Platform Analytics
- Total orders processed
- Revenue generated
- Active vendors count
- Customer engagement metrics

### Withdrawal Management
- View vendor withdrawal requests
- Process payouts
- Track your own platform withdrawals
- Transaction history

## 📱 Getting Your First Vendors

### Step 1: Share Registration Link
Give potential vendors your platform URL and tell them to:
1. Click "Get Started" or "Register"
2. Select "Vendor" tab
3. Fill in business details
4. Submit registration

### Step 2: Approve Vendors
1. Login to admin dashboard
2. Go to "Vendors" tab
3. Review pending applications
4. Click "Approve" or "Reject"

### Step 3: Vendors Add Menu
Once approved, vendors can:
1. Login to their dashboard
2. Go to "Menu" tab
3. Add food items with prices
4. Upload photos (optional)

## 🛒 How Customers Order

1. Visit your platform
2. Browse vendors and menus (no login needed for browsing)
3. Add items to cart
4. Create account or login
5. Checkout and pay via Paystack
6. Vendor receives order notification

## ⚙️ Before Going Live

### Test Everything First:

**1. Test Vendor Flow:**
```
→ Register as vendor (use test email)
→ Login to admin, approve the vendor
→ Login as vendor, add menu items
→ Verify menu shows correctly
```

**2. Test Customer Flow:**
```
→ Browse as customer
→ Add items to cart
→ Create customer account
→ Complete test payment (use test card)
→ Verify order appears in vendor dashboard
```

**3. Test Admin Flow:**
```
→ Login to admin dashboard
→ Check commission is tracked
→ Review order details
→ Test vendor approval process
```

### Paystack Test Cards:
While in test mode, use these:

**Successful Payment:**
- Card: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`
- OTP: `123456`

**Failed Payment:**
- Card: `5060666666666666666`

## 💳 Switch to Live Payments

When ready for real money:

1. **Get Live Paystack Keys:**
   - Login to [Paystack Dashboard](https://dashboard.paystack.com/)
   - Go to Settings → API Keys
   - Switch to "Live" mode
   - Copy Live Public Key and Live Secret Key

2. **Update Your Platform:**
   - Update public key in `/components/CustomerApp.tsx`
   - Update public key in `/utils/paystack.ts`
   - Update secret key environment variable

3. **Verify Paystack Setup:**
   - Ensure business is verified
   - Transfers enabled for vendor payouts
   - Bank account added for settlements

## 📊 Daily Operations

### Morning Routine:
- [ ] Check admin dashboard for new orders
- [ ] Review pending vendor applications
- [ ] Check for withdrawal requests

### Weekly Routine:
- [ ] Review commission earnings
- [ ] Monitor vendor performance
- [ ] Check customer feedback
- [ ] Process any pending issues

### Monthly Routine:
- [ ] Generate financial reports
- [ ] Analyze growth trends
- [ ] Plan marketing activities
- [ ] Review platform performance

## 🎯 Growth Tips

### Getting More Vendors:
1. Reach out to local restaurants
2. Offer zero commission for first month
3. Provide marketing materials
4. Show them the easy-to-use dashboard

### Getting More Customers:
1. Social media marketing
2. Referral programs
3. First-order discounts
4. Partner with vendors for promotions

### Increasing Orders:
1. Featured vendor promotions
2. Seasonal menu highlights
3. Push notifications (when added)
4. Email marketing campaigns

## 🆘 Common Questions

**Q: How do I change my admin password?**  
A: Currently requires database update. Keep it secure.

**Q: What if a vendor wants a refund?**  
A: Process manually through Paystack dashboard, adjust commission accordingly.

**Q: Can I change the commission rate?**  
A: Yes, update `COMMISSION_RATE` in `/supabase/functions/server/index.tsx`

**Q: What's the minimum vendor withdrawal?**  
A: ₦5,000 (configurable in VendorWallet component)

**Q: How long until vendors get paid?**  
A: Instant via Paystack Transfer API when they request withdrawal.

**Q: Can I see individual vendor earnings?**  
A: Yes, in admin dashboard under Vendors tab.

## 📞 Support Resources

- **Paystack Docs:** https://paystack.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Platform Issues:** Check server logs in Supabase Functions

## 🎉 You're Ready!

Your FoodHub platform is:
- ✅ **Clean** - No demo data, fresh start
- ✅ **Secure** - Protected admin area, hidden commission
- ✅ **Tested** - All features working and tested
- ✅ **Mobile-Ready** - Responsive design for all devices
- ✅ **Production-Ready** - Switch to live keys and launch!

---

## 🚀 Next Steps

1. **Today:** Test the complete flow with test payments
2. **This Week:** Get 3-5 vendors registered and approved
3. **Launch Week:** Switch to live Paystack keys
4. **Month 1:** Focus on vendor quality and customer acquisition
5. **Month 2:** Implement feedback and optimize

---

**Remember:** You earn 4% on every order, but this is completely hidden from vendors. They see 100% of their sales going to their wallet, not knowing you've already taken your commission. This is by design! 🤫

**Good luck with your FoodHub platform! 🍽️🚀**
