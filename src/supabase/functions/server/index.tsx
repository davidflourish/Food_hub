/**
 * FoodHub Server API
 * Production-ready food delivery platform backend
 * Ready for hosting with fresh database - no demo data
 */

import { createClient } from 'npm:@supabase/supabase-js@2.49.8';
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable CORS and logging
app.use("*", cors());
app.use("*", logger(console.log));

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Commission configuration
const COMMISSION_RATE = 0.04; // 4% commission on all orders (SECRET - not exposed to vendors)
const PLATFORM_OWNER_ID = 'platform_owner_flourish';
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || 'sk_test_your_secret_key_here';

// Commission calculation and tracking functions
async function calculateCommission(orderAmount: number) {
  return Math.round(orderAmount * COMMISSION_RATE);
}

async function trackCommission(orderId: string, vendorId: string, orderAmount: number, commissionAmount: number) {
  try {
    const commissionRecord = {
      id: `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      vendorId,
      orderAmount,
      commissionAmount,
      commissionRate: COMMISSION_RATE,
      platformOwnerId: PLATFORM_OWNER_ID,
      createdAt: new Date().toISOString(),
      status: 'earned',
      month: new Date().toISOString().substring(0, 7), // YYYY-MM format for monthly tracking
    };

    await kv.set(`commission:${commissionRecord.id}`, commissionRecord);
    
    // Update total platform earnings
    const currentEarnings = await kv.get(`platform_earnings:${PLATFORM_OWNER_ID}`) || {
      totalEarnings: 0,
      totalOrders: 0,
      monthlyEarnings: {},
    };
    
    const currentMonth = commissionRecord.month;
    const updatedEarnings = {
      ...currentEarnings,
      totalEarnings: (currentEarnings.totalEarnings || 0) + commissionAmount,
      totalOrders: (currentEarnings.totalOrders || 0) + 1,
      monthlyEarnings: {
        ...currentEarnings.monthlyEarnings,
        [currentMonth]: (currentEarnings.monthlyEarnings?.[currentMonth] || 0) + commissionAmount,
      },
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set(`platform_earnings:${PLATFORM_OWNER_ID}`, updatedEarnings);
    
    console.log(`Commission tracked: ₦${commissionAmount} on order ${orderId} (${(COMMISSION_RATE * 100).toFixed(1)}%)`);
    return commissionRecord;
  } catch (error) {
    console.error('Error tracking commission:', error);
    throw error;
  }
}

// Health check endpoint
app.get("/make-server-8966d869/health", (c) => {
  return c.json({ status: "ok" });
});

// Admin authentication endpoint (simplified approach)
app.post('/make-server-8966d869/admin/authenticate', async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log('Admin authentication request for:', email);
    
    // Verify admin credentials
    if (email !== 'flourisholuwatimilehin@gmail.com' || password !== 'Thesameasyours1.') {
      console.log('Invalid admin credentials');
      return c.json({ error: 'Invalid admin credentials' }, 401);
    }

    // Check if admin user exists, create if not
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('Error listing users:', listError);
      return c.json({ error: 'Authentication failed' }, 500);
    }

    let adminUser = existingUsers.users.find(user => user.email === email);

    if (!adminUser) {
      // Create admin user
      console.log('Creating admin user');
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { 
          role: 'admin',
          businessName: 'FoodHub Admin',
          isVerified: true
        },
        email_confirm: true
      });

      if (createError) {
        console.log('Admin creation error:', createError);
        return c.json({ error: 'Failed to create admin user' }, 400);
      }

      adminUser = createData.user;
    } else {
      // Update existing user to ensure admin role
      console.log('Updating existing admin user');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        {
          user_metadata: { 
            role: 'admin',
            businessName: 'FoodHub Admin',
            isVerified: true
          }
        }
      );

      if (updateError) {
        console.log('Admin update error:', updateError);
      }
    }

    // Generate a session for the admin user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.email!
    });

    if (sessionError) {
      console.log('Session generation error:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }

    return c.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        businessName: 'FoodHub Admin',
        isVerified: true
      },
      sessionUrl: sessionData.properties?.action_link
    });
  } catch (err) {
    console.log('Admin authentication error:', err);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Create admin user (legacy endpoint)
app.post('/make-server-8966d869/admin/create', async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log('Admin creation request for:', email);
    
    // Verify this is the admin email
    if (email !== 'flourisholuwatimilehin@gmail.com') {
      console.log('Invalid admin email attempted:', email);
      return c.json({ error: 'Invalid admin email' }, 403);
    }

    // Validate password
    if (!password || password.length < 6) {
      console.log('Invalid password for admin creation');
      return c.json({ error: 'Password must be at least 6 characters long' }, 400);
    }

    // Check if admin user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('Error listing users:', listError);
      return c.json({ error: 'Failed to check existing users' }, 500);
    }

    const existingAdmin = existingUsers.users.find(user => user.email === email);

    if (existingAdmin) {
      console.log('Admin user already exists, updating metadata');
      // Update existing user to ensure admin role
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
        {
          user_metadata: { 
            role: 'admin',
            businessName: 'FoodHub Admin',
            isVerified: true
          }
        }
      );

      if (updateError) {
        console.log('Admin update error:', updateError);
        return c.json({ error: `Failed to update admin user: ${updateError.message}` }, 400);
      }

      return c.json({ 
        success: true, 
        message: 'Admin user updated successfully',
        userId: existingAdmin.id,
        action: 'updated'
      });
    }

    // Create admin user with Supabase Admin API
    console.log('Creating new admin user');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        role: 'admin',
        businessName: 'FoodHub Admin',
        isVerified: true
      },
      email_confirm: true, // Auto-confirm admin email
      email_confirm_token: undefined // Bypass email confirmation
    });

    if (error) {
      console.log('Admin creation error:', error);
      return c.json({ error: `Failed to create admin user: ${error.message}` }, 400);
    }

    // Additional step: Set the user password explicitly using admin API
    if (data.user?.id) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        data.user.id,
        { password }
      );
      
      if (passwordError) {
        console.log('Password update error:', passwordError);
        // Continue anyway, the user might still be usable
      }
    }

    console.log('Admin user created successfully:', data.user?.id);
    return c.json({ 
      success: true, 
      message: 'Admin user created successfully',
      userId: data.user?.id,
      action: 'created'
    });
  } catch (err) {
    console.log('Admin creation error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// User registration for FoodHub (vendors, customers)
app.post('/make-server-8966d869/signup', async (c) => {
  try {
    const { email, password, businessName, location, phone, cuisine, role } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        businessName,
        location,
        phone,
        cuisine,
        role: role || 'vendor',
        isVerified: role === 'admin' ? true : false
      },
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      // Provide more specific error messages
      if (error.message.includes('already registered')) {
        return c.json({ error: 'An account with this email already exists. Please try logging in.' }, 400);
      } else if (error.message.includes('Password')) {
        return c.json({ error: 'Password must be at least 6 characters long.' }, 400);
      } else if (error.message.includes('Email')) {
        return c.json({ error: 'Please provide a valid email address.' }, 400);
      } else {
        return c.json({ error: `Registration failed: ${error.message}` }, 400);
      }
    }

    // Store additional vendor profile data with fresh start metrics
    if (role === 'vendor' && businessName) {
      const freshVendorProfile = {
        id: data.user.id,
        email,
        businessName,
        location,
        phone,
        cuisine,
        rating: 0.0,
        totalOrders: 0,
        revenue: 0,
        todaysOrders: 0,
        activeMenuItems: 0,
        status: 'active',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isVerified: false,
        // Fresh vendor metrics
        thisWeekOrders: 0,
        thisMonthOrders: 0,
        averageOrderValue: 0,
        completionRate: 0,
        responseTime: 0,
        // Analytics data
        orderHistory: [],
        revenueHistory: [],
        customerRetention: 0,
        peakHours: [],
        popularItems: []
      };
      
      await kv.set(`vendor:${data.user.id}`, freshVendorProfile);
      
      // Initialize vendor analytics with empty data
      await kv.set(`vendor_analytics:${data.user.id}`, {
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
        yearlyStats: {},
        lastUpdated: new Date().toISOString()
      });
    }

    return c.json({ user: data.user });
  } catch (err) {
    console.log('Signup error:', err);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Vendor profile management
app.post('/make-server-8966d869/vendor/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await c.req.json();
    await kv.set(`vendor:${user.id}`, {
      ...profileData,
      id: user.id,
      lastActive: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Vendor profile save error:', err);
    return c.json({ error: 'Failed to save vendor profile' }, 500);
  }
});

// Get vendor profile
app.get('/make-server-8966d869/vendor/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const vendor = await kv.get(`vendor:${user.id}`);
    return c.json({ vendor });
  } catch (err) {
    console.log('Vendor profile get error:', err);
    return c.json({ error: 'Failed to get vendor profile' }, 500);
  }
});

// Menu management
app.post('/make-server-8966d869/menu/items', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const menuItem = await c.req.json();
    const itemId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await kv.set(`menu:${user.id}:${itemId}`, {
      ...menuItem,
      id: itemId,
      vendorId: user.id,
      createdAt: new Date().toISOString()
    });
    
    // Update vendor's active menu items count
    await updateVendorStats(user.id, 'menuItemAdded');
    
    return c.json({ success: true, itemId });
  } catch (err) {
    console.log('Menu item save error:', err);
    return c.json({ error: 'Failed to save menu item' }, 500);
  }
});

// Get vendor menu items
app.get('/make-server-8966d869/menu/items', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const menuItems = await kv.getByPrefix(`menu:${user.id}:`);
    return c.json({ menuItems });
  } catch (err) {
    console.log('Menu items get error:', err);
    return c.json({ error: 'Failed to get menu items' }, 500);
  }
});

// Update menu item
app.put('/make-server-8966d869/menu/items/:itemId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemId = c.req.param('itemId');
    const updates = await c.req.json();
    
    const existing = await kv.get(`menu:${user.id}:${itemId}`);
    if (!existing) {
      return c.json({ error: 'Menu item not found' }, 404);
    }
    
    await kv.set(`menu:${user.id}:${itemId}`, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Menu item update error:', err);
    return c.json({ error: 'Failed to update menu item' }, 500);
  }
});

// Delete vendor (Admin only)
app.delete('/make-server-8966d869/admin/vendors/:vendorId', async (c) => {
  try {
    // Check for admin user header (for direct admin auth)
    const adminUserHeader = c.req.header('X-Admin-User');
    let isAuthorized = false;
    
    if (adminUserHeader) {
      try {
        const adminUser = JSON.parse(adminUserHeader);
        if (adminUser.role === 'admin' && adminUser.email === 'flourisholuwatimilehin@gmail.com') {
          console.log('Admin delete access granted via header for:', adminUser.email);
          isAuthorized = true;
        }
      } catch (parseError) {
        console.log('Invalid admin user header:', parseError);
      }
    }

    if (!isAuthorized) {
      // Fallback to Supabase auth
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      
      if (!user || authError) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      if (user.user_metadata?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }
    }

    const vendorId = c.req.param('vendorId');
    
    if (!vendorId) {
      return c.json({ error: 'Vendor ID is required' }, 400);
    }

    // Delete vendor and all related data
    await kv.del(`vendor:${vendorId}`);
    await kv.del(`vendor_analytics:${vendorId}`);
    
    // Delete all vendor's menu items
    const menuItems = await kv.getByPrefix(`menu:${vendorId}:`);
    for (const item of menuItems) {
      await kv.del(`menu:${vendorId}:${item.id}`);
    }
    
    // Delete all vendor's orders
    const orders = await kv.getByPrefix('order:');
    for (const order of orders) {
      if (order.vendorId === vendorId) {
        await kv.del(`order:${order.id}`);
      }
    }

    // Delete from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(vendorId);
    if (deleteError) {
      console.log('Supabase user deletion error:', deleteError);
      // Continue even if Supabase deletion fails
    }
    
    return c.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (err) {
    console.log('Delete vendor error:', err);
    return c.json({ error: 'Failed to delete vendor' }, 500);
  }
});

// Delete vendor account (Self-delete)
app.delete('/make-server-8966d869/vendor/account', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const vendorId = user.id;
    
    // Delete vendor and all related data
    await kv.del(`vendor:${vendorId}`);
    await kv.del(`vendor_analytics:${vendorId}`);
    
    // Delete all vendor's menu items
    const menuItems = await kv.getByPrefix(`menu:${vendorId}:`);
    for (const item of menuItems) {
      await kv.del(`menu:${vendorId}:${item.id}`);
    }
    
    // Delete all vendor's orders
    const orders = await kv.getByPrefix('order:');
    for (const order of orders) {
      if (order.vendorId === vendorId) {
        await kv.del(`order:${order.id}`);
      }
    }

    // Delete from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(vendorId);
    if (deleteError) {
      console.log('Supabase user deletion error:', deleteError);
      // Continue even if Supabase deletion fails
    }
    
    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.log('Delete vendor account error:', err);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

// Delete menu item
app.delete('/make-server-8966d869/menu/items/:itemId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemId = c.req.param('itemId');
    await kv.del(`menu:${user.id}:${itemId}`);
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Menu item delete error:', err);
    return c.json({ error: 'Failed to delete menu item' }, 500);
  }
});

// Order management
app.post('/make-server-8966d869/orders', async (c) => {
  try {
    const orderData = await c.req.json();
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate platform commission (secret from vendor/customer)
    const commissionAmount = await calculateCommission(orderData.amount);
    
    const order = {
      ...orderData,
      id: orderId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      // Store commission info but don't expose in customer/vendor APIs
      platformCommission: commissionAmount,
      commissionRate: COMMISSION_RATE
    };
    
    await kv.set(`order:${orderId}`, order);
    
    // Track platform commission earnings
    await trackCommission(orderId, orderData.vendorId, orderData.amount, commissionAmount);
    
    // Update vendor statistics when new order is placed
    if (orderData.vendorId) {
      await updateVendorStats(orderData.vendorId, 'newOrder', {
        amount: orderData.amount,
        orderId: orderId
      });
    }
    
    console.log(`New order created: ${orderId} - Amount: ₦${orderData.amount}, Commission: ₦${commissionAmount}`);
    
    return c.json({ success: true, orderId });
  } catch (err) {
    console.log('Order creation error:', err);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get orders for vendor
app.get('/make-server-8966d869/vendor/orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allOrders = await kv.getByPrefix('order:');
    const vendorOrders = allOrders.filter(order => order.vendorId === user.id);
    
    return c.json({ orders: vendorOrders });
  } catch (err) {
    console.log('Vendor orders get error:', err);
    return c.json({ error: 'Failed to get vendor orders' }, 500);
  }
});

// PAYSTACK PAYMENT ENDPOINTS

// Initialize Paystack payment
app.post('/make-server-8966d869/payment/initialize', async (c) => {
  try {
    const { orderId, email, amount } = await c.req.json();
    
    if (!orderId || !email || !amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Initialize payment with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects amount in kobo (smallest currency unit)
        reference: `${orderId}_${Date.now()}`,
        metadata: {
          orderId,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: orderId
            }
          ]
        },
        callback_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/payment/callback`
      })
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.log('Paystack initialization error:', paystackData);
      return c.json({ error: paystackData.message || 'Failed to initialize payment' }, 400);
    }

    // Store payment reference with order
    const order = await kv.get(`order:${orderId}`);
    if (order) {
      order.paymentReference = paystackData.data.reference;
      order.paymentStatus = 'initialized';
      await kv.set(`order:${orderId}`, order);
    }

    return c.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference
    });
  } catch (err) {
    console.log('Payment initialization error:', err);
    return c.json({ error: 'Failed to initialize payment' }, 500);
  }
});

// Verify Paystack payment
app.post('/make-server-8966d869/payment/verify', async (c) => {
  try {
    const { reference } = await c.req.json();
    
    if (!reference) {
      return c.json({ error: 'Payment reference is required' }, 400);
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.log('Paystack verification error:', paystackData);
      return c.json({ error: paystackData.message || 'Failed to verify payment' }, 400);
    }

    const transaction = paystackData.data;

    if (transaction.status !== 'success') {
      return c.json({ error: 'Payment was not successful', status: transaction.status }, 400);
    }

    // Extract order ID from metadata
    const orderId = transaction.metadata?.orderId || transaction.metadata?.custom_fields?.find((f: any) => f.variable_name === 'order_id')?.value;
    
    if (!orderId) {
      return c.json({ error: 'Order ID not found in transaction' }, 400);
    }

    // Get order details
    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Prevent double-processing
    if (order.paymentStatus === 'completed') {
      return c.json({ success: true, message: 'Payment already processed', orderId });
    }

    const totalAmount = transaction.amount / 100; // Convert from kobo to naira
    const commissionAmount = Math.round(totalAmount * COMMISSION_RATE);
    const vendorAmount = totalAmount - commissionAmount;

    // Create transaction record
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionRecord = {
      id: transactionId,
      orderId,
      vendorId: order.vendorId,
      customerId: order.customerId || 'guest',
      totalAmount,
      commissionAmount, // SECRET: 4% commission
      vendorAmount, // 96% goes to vendor
      status: 'completed',
      paymentReference: reference,
      paymentMethod: 'paystack',
      createdAt: new Date().toISOString()
    };

    await kv.set(`transaction:${transactionId}`, transactionRecord);

    // Update order status
    order.status = 'confirmed';
    order.paymentStatus = 'completed';
    order.paymentReference = reference;
    order.transactionId = transactionId;
    order.paidAt = new Date().toISOString();
    await kv.set(`order:${orderId}`, order);

    // Credit vendor wallet (96% of payment)
    const wallet = await kv.get(`wallet:${order.vendorId}`) || {
      vendorId: order.vendorId,
      walletBalance: 0,
      totalEarnings: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      lastUpdated: new Date().toISOString()
    };

    wallet.walletBalance += vendorAmount;
    wallet.totalEarnings += vendorAmount;
    wallet.lastUpdated = new Date().toISOString();
    await kv.set(`wallet:${order.vendorId}`, wallet);

    // Track commission for admin (SECRET)
    await trackCommission(orderId, order.vendorId, totalAmount, commissionAmount);

    // Update vendor statistics
    await updateVendorStats(order.vendorId, 'orderCompleted', {
      amount: vendorAmount, // Vendor only sees their 96%
      orderId: orderId
    });

    console.log(`Payment verified: ₦${totalAmount} | Vendor gets: ₦${vendorAmount} | Commission: ₦${commissionAmount}`);

    return c.json({
      success: true,
      message: 'Payment verified and wallet credited',
      orderId,
      transactionId,
      vendorCredited: vendorAmount // Vendor only sees their credited amount
    });
  } catch (err) {
    console.log('Payment verification error:', err);
    return c.json({ error: 'Failed to verify payment' }, 500);
  }
});

// Get menu items by vendor ID (for customers)
app.get('/make-server-8966d869/vendor/menu-items/:vendorId', async (c) => {
  try {
    const vendorId = c.req.param('vendorId');
    
    if (!vendorId) {
      return c.json({ error: 'Vendor ID is required' }, 400);
    }

    const menuItems = await kv.getByPrefix(`menu:${vendorId}:`);
    return c.json({ menuItems: menuItems || [] });
  } catch (err) {
    console.log('Get vendor menu items error:', err);
    return c.json({ error: 'Failed to get menu items' }, 500);
  }
});

// Update order status
app.put('/make-server-8966d869/orders/:orderId/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderId = c.req.param('orderId');
    const { status } = await c.req.json();
    
    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    const updatedOrder = {
      ...order,
      status,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`order:${orderId}`, updatedOrder);
    
    // Update vendor stats when order status changes
    if (status === 'delivered') {
      await updateVendorStats(user.id, 'orderCompleted', {
        amount: order.amount,
        orderId: orderId
      });
    }
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Order status update error:', err);
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

// Customer endpoints
app.get('/make-server-8966d869/vendors', async (c) => {
  try {
    const vendors = await kv.getByPrefix('vendor:');
    const activeVendors = vendors.filter(vendor => vendor.status === 'active');
    
    return c.json({ vendors: activeVendors });
  } catch (err) {
    console.log('Vendors get error:', err);
    return c.json({ error: 'Failed to get vendors' }, 500);
  }
});

app.get('/make-server-8966d869/vendors/:vendorId/menu', async (c) => {
  try {
    const vendorId = c.req.param('vendorId');
    const menuItems = await kv.getByPrefix(`menu:${vendorId}:`);
    const availableItems = menuItems.filter(item => item.isAvailable);
    
    return c.json({ menuItems: availableItems });
  } catch (err) {
    console.log('Vendor menu get error:', err);
    return c.json({ error: 'Failed to get vendor menu' }, 500);
  }
});

// Admin endpoints
app.get('/make-server-8966d869/admin/vendors', async (c) => {
  try {
    // Check for admin user header (for direct admin auth)
    const adminUserHeader = c.req.header('X-Admin-User');
    
    if (adminUserHeader) {
      try {
        const adminUser = JSON.parse(adminUserHeader);
        if (adminUser.role === 'admin' && adminUser.email === 'flourisholuwatimilehin@gmail.com') {
          console.log('Admin access granted via header for:', adminUser.email);
          const vendors = await kv.getByPrefix('vendor:');
          return c.json({ vendors: vendors || [] });
        }
      } catch (parseError) {
        console.log('Invalid admin user header:', parseError);
      }
    }

    // Fallback to Supabase auth
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('Admin vendors endpoint - Access token present:', !!accessToken);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('Admin vendors endpoint - User found:', !!user, 'Auth error:', authError?.message);
    console.log('Admin vendors endpoint - User role:', user?.user_metadata?.role);
    
    if (!user || authError) {
      console.log('Admin vendors endpoint - Unauthorized: No user or auth error');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      console.log('Admin vendors endpoint - Access denied: User role is not admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    const vendors = await kv.getByPrefix('vendor:');
    console.log('Admin vendors endpoint - Found vendors:', vendors?.length || 0);
    return c.json({ vendors: vendors || [] });
  } catch (err) {
    console.log('Admin vendors get error:', err);
    return c.json({ error: 'Failed to get vendors' }, 500);
  }
});

app.get('/make-server-8966d869/admin/orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orders = await kv.getByPrefix('order:');
    return c.json({ orders });
  } catch (err) {
    console.log('Admin orders get error:', err);
    return c.json({ error: 'Failed to get orders' }, 500);
  }
});

// Get platform commission earnings (admin only)
app.get('/make-server-8966d869/admin/commissions', async (c) => {
  try {
    // Check for admin user header (for direct admin auth)
    const adminUserHeader = c.req.header('X-Admin-User');
    
    if (adminUserHeader) {
      try {
        const adminUser = JSON.parse(adminUserHeader);
        if (adminUser.role === 'admin' && adminUser.email === 'flourisholuwatimilehin@gmail.com') {
          console.log('Admin commission access granted for:', adminUser.email);
          
          // Get platform earnings summary
          const platformEarnings = await kv.get(`platform_earnings:${PLATFORM_OWNER_ID}`) || {
            totalEarnings: 0,
            totalOrders: 0,
            monthlyEarnings: {},
          };
          
          // Get recent commission records
          const allCommissions = await kv.getByPrefix('commission:');
          const recentCommissions = allCommissions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50); // Last 50 commission records
          
          return c.json({
            platformEarnings,
            recentCommissions,
            commissionRate: COMMISSION_RATE,
            summary: {
              totalEarnings: platformEarnings.totalEarnings || 0,
              totalOrders: platformEarnings.totalOrders || 0,
              averageCommissionPerOrder: platformEarnings.totalOrders > 0 
                ? Math.round((platformEarnings.totalEarnings || 0) / platformEarnings.totalOrders)
                : 0,
              currentMonth: new Date().toISOString().substring(0, 7),
              currentMonthEarnings: platformEarnings.monthlyEarnings?.[new Date().toISOString().substring(0, 7)] || 0
            }
          });
        }
      } catch (parseError) {
        console.log('Invalid admin user header:', parseError);
      }
    }

    // Fallback to Supabase auth
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get platform earnings (same logic as above)
    const platformEarnings = await kv.get(`platform_earnings:${PLATFORM_OWNER_ID}`) || {
      totalEarnings: 0,
      totalOrders: 0,
      monthlyEarnings: {},
    };
    
    const allCommissions = await kv.getByPrefix('commission:');
    const recentCommissions = allCommissions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
    
    return c.json({
      platformEarnings,
      recentCommissions,
      commissionRate: COMMISSION_RATE,
      summary: {
        totalEarnings: platformEarnings.totalEarnings || 0,
        totalOrders: platformEarnings.totalOrders || 0,
        averageCommissionPerOrder: platformEarnings.totalOrders > 0 
          ? Math.round((platformEarnings.totalEarnings || 0) / platformEarnings.totalOrders)
          : 0,
        currentMonth: new Date().toISOString().substring(0, 7),
        currentMonthEarnings: platformEarnings.monthlyEarnings?.[new Date().toISOString().substring(0, 7)] || 0
      }
    });
  } catch (err) {
    console.log('Admin commission get error:', err);
    return c.json({ error: 'Failed to get commission data' }, 500);
  }
});

// WALLET ENDPOINTS

// Get vendor wallet
app.get('/make-server-8966d869/vendor/wallet', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const wallet = await kv.get(`wallet:${user.id}`) || {
      vendorId: user.id,
      walletBalance: 0,
      totalEarnings: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      lastUpdated: new Date().toISOString()
    };

    // Get recent transactions (vendor only sees their credited amounts)
    const allTransactions = await kv.getByPrefix('transaction:');
    const vendorTransactions = allTransactions
      .filter(txn => txn.vendorId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map(txn => ({
        id: txn.id,
        orderId: txn.orderId,
        amount: txn.vendorAmount, // Only show vendor's 96%
        status: txn.status,
        createdAt: txn.createdAt,
        paymentReference: txn.paymentReference
      }));

    return c.json({
      wallet,
      recentTransactions: vendorTransactions
    });
  } catch (err) {
    console.log('Get wallet error:', err);
    return c.json({ error: 'Failed to get wallet' }, 500);
  }
});

// Vendor withdrawal request
app.post('/make-server-8966d869/vendor/withdraw', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount, password, bankCode, accountNumber, accountName } = await c.req.json();

    if (!amount || !password || !bankCode || !accountNumber) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify password (in production, compare with hashed password)
    // For now, we'll use a simple check - you should implement proper password verification
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (signInError) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    // Get vendor wallet
    const wallet = await kv.get(`wallet:${user.id}`);
    if (!wallet || wallet.walletBalance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }

    // Initiate Paystack transfer
    const transferCode = `TRANSFER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // First, create a transfer recipient
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName || user.user_metadata?.businessName || 'Vendor',
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      })
    });

    const recipientData = await recipientResponse.json();

    if (!recipientResponse.ok || !recipientData.status) {
      console.log('Recipient creation error:', recipientData);
      return c.json({ error: recipientData.message || 'Failed to create recipient' }, 400);
    }

    // Initiate transfer
    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amount * 100, // Convert to kobo
        recipient: recipientData.data.recipient_code,
        reason: `Withdrawal by ${user.user_metadata?.businessName || user.email}`,
        reference: transferCode
      })
    });

    const transferData = await transferResponse.json();

    if (!transferResponse.ok || !transferData.status) {
      console.log('Transfer error:', transferData);
      return c.json({ error: transferData.message || 'Failed to initiate transfer' }, 400);
    }

    // Update wallet balance
    wallet.walletBalance -= amount;
    wallet.totalWithdrawn = (wallet.totalWithdrawn || 0) + amount;
    wallet.lastUpdated = new Date().toISOString();
    await kv.set(`wallet:${user.id}`, wallet);

    // Record withdrawal
    const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const withdrawal = {
      id: withdrawalId,
      vendorId: user.id,
      amount,
      accountNumber,
      bankCode,
      accountName: accountName || user.user_metadata?.businessName,
      status: transferData.data.status,
      transferCode: transferData.data.transfer_code,
      reference: transferCode,
      createdAt: new Date().toISOString()
    };

    await kv.set(`withdrawal:${withdrawalId}`, withdrawal);

    return c.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      withdrawal: {
        id: withdrawalId,
        amount,
        status: withdrawal.status,
        reference: transferCode
      }
    });
  } catch (err) {
    console.log('Withdrawal error:', err);
    return c.json({ error: 'Failed to process withdrawal' }, 500);
  }
});

// Get withdrawal history
app.get('/make-server-8966d869/vendor/withdrawals', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allWithdrawals = await kv.getByPrefix('withdrawal:');
    const vendorWithdrawals = allWithdrawals
      .filter(wd => wd.vendorId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ withdrawals: vendorWithdrawals });
  } catch (err) {
    console.log('Get withdrawals error:', err);
    return c.json({ error: 'Failed to get withdrawals' }, 500);
  }
});

// Admin withdrawal
app.post('/make-server-8966d869/admin/withdraw', async (c) => {
  try {
    // Check for admin authentication
    const adminUserHeader = c.req.header('X-Admin-User');
    let isAdmin = false;

    if (adminUserHeader) {
      try {
        const adminUser = JSON.parse(adminUserHeader);
        if (adminUser.role === 'admin' && adminUser.email === 'flourisholuwatimilehin@gmail.com') {
          isAdmin = true;
        }
      } catch (parseError) {
        console.log('Invalid admin user header');
      }
    }

    if (!isAdmin) {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      
      if (!user || authError || user.user_metadata?.role !== 'admin') {
        return c.json({ error: 'Unauthorized - Admin access required' }, 401);
      }
    }

    const { amount, password, bankCode, accountNumber, accountName } = await c.req.json();

    if (!amount || !password) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify admin password
    if (password !== 'Thesameasyours1.') {
      return c.json({ error: 'Invalid admin password' }, 401);
    }

    // Get platform earnings
    const platformEarnings = await kv.get(`platform_earnings:${PLATFORM_OWNER_ID}`) || {
      totalEarnings: 0,
      totalWithdrawn: 0
    };

    const availableBalance = (platformEarnings.totalEarnings || 0) - (platformEarnings.totalWithdrawn || 0);

    if (availableBalance < amount) {
      return c.json({ error: 'Insufficient commission balance' }, 400);
    }

    // Record admin withdrawal
    const withdrawalId = `ADMIN-WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const withdrawal = {
      id: withdrawalId,
      adminId: PLATFORM_OWNER_ID,
      amount,
      accountNumber: accountNumber || 'Admin Account',
      bankCode: bankCode || 'N/A',
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    await kv.set(`admin_withdrawal:${withdrawalId}`, withdrawal);

    // Update platform earnings
    platformEarnings.totalWithdrawn = (platformEarnings.totalWithdrawn || 0) + amount;
    platformEarnings.lastUpdated = new Date().toISOString();
    await kv.set(`platform_earnings:${PLATFORM_OWNER_ID}`, platformEarnings);

    return c.json({
      success: true,
      message: 'Admin withdrawal processed successfully',
      withdrawal: {
        id: withdrawalId,
        amount,
        availableBalance: availableBalance - amount
      }
    });
  } catch (err) {
    console.log('Admin withdrawal error:', err);
    return c.json({ error: 'Failed to process admin withdrawal' }, 500);
  }
});

// Update vendor status (admin only)
app.put('/make-server-8966d869/admin/vendors/:vendorId/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const vendorId = c.req.param('vendorId');
    const { status, isVerified } = await c.req.json();
    
    const vendor = await kv.get(`vendor:${vendorId}`);
    if (!vendor) {
      return c.json({ error: 'Vendor not found' }, 404);
    }
    
    await kv.set(`vendor:${vendorId}`, {
      ...vendor,
      status,
      isVerified: isVerified !== undefined ? isVerified : vendor.isVerified,
      updatedAt: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (err) {
    console.log('Vendor status update error:', err);
    return c.json({ error: 'Failed to update vendor status' }, 500);
  }
});

// Helper function to update vendor statistics
async function updateVendorStats(vendorId: string, action: string, data?: any) {
  try {
    const vendor = await kv.get(`vendor:${vendorId}`);
    if (!vendor) return;

    const today = new Date().toISOString().split('T')[0];
    const analytics = await kv.get(`vendor_analytics:${vendorId}`) || {
      dailyStats: {},
      weeklyStats: {},
      monthlyStats: {},
      yearlyStats: {},
      lastUpdated: new Date().toISOString()
    };

    let updatedVendor = { ...vendor };

    switch (action) {
      case 'newOrder':
        updatedVendor.totalOrders = (vendor.totalOrders || 0) + 1;
        updatedVendor.todaysOrders = (vendor.todaysOrders || 0) + 1;
        
        // Update daily stats
        if (!analytics.dailyStats[today]) {
          analytics.dailyStats[today] = { orders: 0, revenue: 0 };
        }
        analytics.dailyStats[today].orders += 1;
        break;

      case 'orderCompleted':
        updatedVendor.revenue = (vendor.revenue || 0) + (data?.amount || 0);
        
        // Update daily revenue
        if (!analytics.dailyStats[today]) {
          analytics.dailyStats[today] = { orders: 0, revenue: 0 };
        }
        analytics.dailyStats[today].revenue += (data?.amount || 0);
        
        // Calculate average order value
        if (updatedVendor.totalOrders > 0) {
          updatedVendor.averageOrderValue = updatedVendor.revenue / updatedVendor.totalOrders;
        }
        break;

      case 'menuItemAdded':
        // Count current active menu items
        const menuItems = await kv.getByPrefix(`menu:${vendorId}:`);
        const activeItems = menuItems.filter(item => item.isAvailable !== false);
        updatedVendor.activeMenuItems = activeItems.length;
        break;

      case 'profileUpdated':
        // Update last active time
        updatedVendor.lastActive = new Date().toISOString();
        break;
    }

    // Update rating calculation (simplified - in real app, based on reviews)
    if (updatedVendor.totalOrders > 0) {
      // Simple rating calculation based on completion rate and order volume
      const completionRate = updatedVendor.totalOrders > 0 ? 0.95 : 0; // Assume 95% completion rate
      const orderVolumeBonus = Math.min(updatedVendor.totalOrders / 100, 0.5); // Max 0.5 bonus
      updatedVendor.rating = Math.min(4.0 + completionRate + orderVolumeBonus, 5.0);
    }

    // Save updated vendor data
    await kv.set(`vendor:${vendorId}`, updatedVendor);
    
    // Save updated analytics
    analytics.lastUpdated = new Date().toISOString();
    await kv.set(`vendor_analytics:${vendorId}`, analytics);

  } catch (error) {
    console.error('Error updating vendor stats:', error);
  }
}

// Get vendor dashboard stats
app.get('/make-server-8966d869/vendor/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let vendor = await kv.get(`vendor:${user.id}`);
    
    // If vendor doesn't exist in database, create fresh vendor profile
    if (!vendor) {
      const freshVendorProfile = {
        id: user.id,
        email: user.email,
        businessName: user.user_metadata?.businessName || 'Your Restaurant',
        location: user.user_metadata?.location || '',
        phone: user.user_metadata?.phone || '',
        cuisine: user.user_metadata?.cuisine || '',
        rating: 0.0,
        totalOrders: 0,
        revenue: 0,
        todaysOrders: 0,
        activeMenuItems: 0,
        status: 'active',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isVerified: false,
        thisWeekOrders: 0,
        thisMonthOrders: 0,
        averageOrderValue: 0,
        completionRate: 0,
        responseTime: 0,
        orderHistory: [],
        revenueHistory: [],
        customerRetention: 0,
        peakHours: [],
        popularItems: []
      };
      
      await kv.set(`vendor:${user.id}`, freshVendorProfile);
      await kv.set(`vendor_analytics:${user.id}`, {
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
        yearlyStats: {},
        lastUpdated: new Date().toISOString()
      });
      
      vendor = freshVendorProfile;
    }

    const analytics = await kv.get(`vendor_analytics:${user.id}`) || {
      dailyStats: {},
      weeklyStats: {},
      monthlyStats: {},
      yearlyStats: {},
      lastUpdated: new Date().toISOString()
    };

    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = analytics?.dailyStats?.[today] || { orders: 0, revenue: 0 };

    // Get recent orders for the vendor
    const allOrders = await kv.getByPrefix('order:');
    const vendorOrders = allOrders
      .filter(order => order.vendorId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Get latest 5 orders

    // Count active menu items
    const menuItems = await kv.getByPrefix(`menu:${user.id}:`);
    const activeItems = menuItems.filter(item => item.isAvailable !== false).length;

    const stats = {
      totalOrders: vendor.totalOrders || 0,
      todaysOrders: todayStats.orders || 0,
      revenue: vendor.revenue || 0,
      todaysRevenue: todayStats.revenue || 0,
      rating: vendor.rating || 0.0,
      activeMenuItems: activeItems,
      averageOrderValue: vendor.averageOrderValue || 0,
      recentOrders: vendorOrders || [],
      isVerified: vendor.isVerified || false,
      businessName: vendor.businessName || user.user_metadata?.businessName || 'Your Restaurant',
      joinDate: vendor.joinDate || new Date().toISOString(),
      lastActive: vendor.lastActive || new Date().toISOString()
    };

    return c.json({ stats });
  } catch (err) {
    console.log('Vendor stats error:', err);
    return c.json({ error: 'Failed to get vendor stats' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);