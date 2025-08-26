// Test script to create user and test login
const baseUrl = 'http://localhost:3001';

async function createTestUser() {
  try {
    console.log('Creating test user...');
    const response = await fetch(`${baseUrl}/api/auth/seed-user`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log('Seed user response:', data);
    return response.ok;
  } catch (error) {
    console.error('Error creating test user:', error);
    return false;
  }
}

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

async function main() {
  console.log('Starting login test...');
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const userCreated = await createTestUser();
  if (userCreated) {
    await testLogin();
  } else {
    console.log('Failed to create test user, skipping login test');
  }
}

main();
