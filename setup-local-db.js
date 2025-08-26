// Setup script for local MongoDB connection
const { MongoClient } = require('mongodb');

// Test different connection options
const connectionOptions = [
  {
    name: 'Atlas with updated URI',
    uri: 'mongodb+srv://sufiyanali0727:erp1234@cluster0.o7uq2of.mongodb.net/nextjs-dashboard?retryWrites=true&w=majority&serverSelectionTimeoutMS=5000'
  },
  {
    name: 'Local MongoDB',
    uri: 'mongodb://localhost:27017/nextjs-dashboard'
  }
];

async function testConnection(option) {
  console.log(`\n🔄 Testing ${option.name}...`);
  console.log(`📍 URI: ${option.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  try {
    const client = new MongoClient(option.uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    await client.connect();
    console.log(`✅ ${option.name} connection successful!`);
    
    // Test database operations
    const db = client.db('nextjs-dashboard');
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);
    
    await client.close();
    return true;
  } catch (error) {
    console.log(`❌ ${option.name} connection failed:`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing MongoDB connections...\n');
  
  for (const option of connectionOptions) {
    const success = await testConnection(option);
    if (success) {
      console.log(`\n✅ Recommended connection: ${option.name}`);
      console.log(`📋 Update your .env.local file with:`);
      console.log(`   MONGODB_URI=${option.uri}`);
      break;
    }
  }
  
  console.log('\n📝 Setup Instructions:');
  console.log('1. Copy the working URI to your .env.local file');
  console.log('2. If Atlas fails, install local MongoDB:');
  console.log('   - Download: https://www.mongodb.com/try/download/community');
  console.log('   - Install and start MongoDB service');
  console.log('   - Use: mongodb://localhost:27017/nextjs-dashboard');
  console.log('3. Restart your Next.js development server');
}

main().catch(console.error);
