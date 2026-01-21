const axios = require('axios');
require('dotenv').config();

const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

async function run() {
  console.log('API test base:', BASE);

  try {
    // Login admin
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@foodapp.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    console.log('Logging in admin', adminEmail);
    const login = await axios.post(`${BASE}/api/auth/login`, { email: adminEmail, password: adminPassword });
    const adminToken = login.data.token;
    console.log('Admin login OK');

    // Create restaurant
    console.log('Creating restaurant...');
    const r = await axios.post(`${BASE}/api/restaurants`, { name: 'API Test R', description: 'Created by test', location: 'Test' }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Restaurant created:', r.data.restaurant && r.data.restaurant._id);
    const restaurantId = r.data.restaurant._id;

    // Create menu item
    console.log('Creating menu item...');
    const m = await axios.post(`${BASE}/api/menu`, { name: 'Test Item', price: 5.5, restaurant: restaurantId }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Menu item created:', m.data.menuItem && m.data.menuItem._id);
    const menuItemId = m.data.menuItem._id;

    // Register a new user
    const unique = Date.now();
    const userEmail = `testuser+${unique}@example.com`;
    console.log('Registering user', userEmail);
    const reg = await axios.post(`${BASE}/api/auth/register`, { name: 'Test User', email: userEmail, password: 'password123' });
    const userToken = reg.data.token;
    console.log('User registered and logged in');

    // Create order
    console.log('Creating order...');
    const orderBody = {
      items: [{ menuItem: menuItemId, quantity: 2 }],
      restaurant: restaurantId,
      deliveryAddress: '123 Test St',
      paymentMethod: 'cash'
    };
    const o = await axios.post(`${BASE}/api/orders`, orderBody, { headers: { Authorization: `Bearer ${userToken}` } });
    console.log('Order created:', o.data.order && o.data.order._id);

    // Fetch my orders
    const my = await axios.get(`${BASE}/api/orders/my-orders`, { headers: { Authorization: `Bearer ${userToken}` } });
    console.log('My orders count:', my.data.count);

    console.log('\nAll tests passed.');
    process.exit(0);
  } catch (err) {
    if (err.response) {
      console.error('Request failed:', err.response.status, err.response.data);
    } else {
      console.error('Test error:', err.message);
    }
    process.exit(2);
  }
}

run();
