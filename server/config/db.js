// debug_db.js
const path = require('path');
const fs = require('fs');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('Working dir:', process.cwd());
console.log('server __dirname:', __dirname);

const show = (k) => console.log(`${k} = ${process.env[k] ? '[SET]' : '[MISSING]'}`);
show('MONGODB_URI');
show('JWT_SECRET');
show('NODE_ENV');
show('PORT');
console.log('\n---- .env raw preview (first 50 lines) ----');
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).slice(0,50).join('\n');
    console.log(content || '[empty file]');
  } else {
    console.log('.env not found at', envPath);
  }
} catch (err) {
  console.error('Error reading .env:', err);
}

// Parse Mongo host(s) for DNS checks
const uri = process.env.MONGODB_URI || '';
if (!uri) {
  console.error('\nNo MONGODB_URI found in environment. Please create ../.env with MONGODB_URI and JWT_SECRET.');
  process.exit(1);
}

console.log('\nMONGODB_URI (truncated):', uri.length > 200 ? uri.slice(0,200) + '...' : uri);

// extract host part for mongodb+srv and mongodb://
function extractHostsFromMongoUri(uri) {
  try {
    if (uri.startsWith('mongodb+srv://')) {
      // host is between mongodb+srv://<user:pass>@ and the first '/'
      const afterCreds = uri.split('@')[1] || uri.split('mongodb+srv://')[1];
      const host = (afterCreds || '').split('/')[0];
      return [host];
    } else if (uri.startsWith('mongodb://')) {
      // list of hosts between mongodb:// and '/' possibly comma separated
      const after = uri.split('mongodb://')[1];
      const hostPortList = (after.split('/')[0] || '').split('@').pop(); // handle creds
      return hostPortList.split(',').map(h => h.split(':')[0]);
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
}

const hosts = extractHostsFromMongoUri(uri);
console.log('\nExtracted host(s):', hosts.length ? hosts.join(', ') : '[none]');

async function dnsLookupAll(host) {
  return new Promise((resolve) => {
    dns.lookup(host, { all: true }, (err, addresses) => {
      if (err) return resolve({ host, ok: false, err: err.message });
      resolve({ host, ok: true, addrs: addresses });
    });
  });
}

(async () => {
  if (hosts.length) {
    console.log('\nDNS lookups:');
    for (const h of hosts) {
      // if host contains port, remove
      const hostOnly = h.split(':')[0];
      const res = await dnsLookupAll(hostOnly);
      console.log(JSON.stringify(res, null, 2));
    }
  } else {
    console.log('No hosts to DNS lookup.');
  }

  // Try Mongoose connection
  console.log('\nAttempting Mongoose connection (10s timeout)...');
  const mongoose = require('mongoose');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Mongoose connected successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\nMongoose connection failed:');
    console.error('name:', err && err.name);
    console.error('message:', err && err.message);
    if (err && err.stack) {
      console.error('stack:', err.stack.split('\n').slice(0,10).join('\n'));
    }
    // Give hints for common errors
    console.log('\nHints:');
    if (err && err.message && err.message.includes('ECONNREFUSED')) {
      console.log('- ECONNREFUSED usually means the client attempted to reach 127.0.0.1:27017 (local Mongo) and nothing is listening there.');
      console.log('- Check that MONGODB_URI is correctly loaded and not empty.');
    }
    if (err && err.message && /authentication/i.test(err.message)) {
      console.log('- Authentication failed. Verify username/password in Atlas and that the user has privileges.');
    }
    if (err && err.message && /ENOTFOUND|getaddrinfo/i.test(err.message)) {
      console.log('- DNS lookup failed. Ensure your machine has internet and the hostname resolves (Atlas SRV requires DNS).');
    }
    if (err && err.message && /IP address .* is not whitelisted|not authorized|Access denied/i.test(err.message)) {
      console.log('- IP not allowed. Add your IP to MongoDB Atlas Network Access (or 0.0.0.0/0 for testing).');
    }
    process.exit(1);
  }
})();