const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Test 1: Check if we can query pickers table
    console.log('\n1. Testing pickers table query...');
    const pickersResult = await pool.query('SELECT id, email, nickname, realname, active FROM pickers WHERE active = $1 LIMIT 3', ['y']);
    console.log('✅ Found', pickersResult.rows.length, 'active pickers');
    pickersResult.rows.forEach(picker => {
      console.log(`   - ${picker.email} (${picker.nickname}) - ${picker.realname}`);
    });
    
    // Test 2: Check password hashing
    console.log('\n2. Testing password hashing...');
    const testPassword = 'password';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('✅ Password hashing works:', isValid);
    
    // Test 3: Check if we can find a specific user
    console.log('\n3. Testing user lookup...');
    const testEmail = 'jj'; // From our sample data
    const userResult = await pool.query('SELECT * FROM pickers WHERE email = $1', [testEmail]);
    if (userResult.rows.length > 0) {
      console.log('✅ Found user:', userResult.rows[0].email);
      console.log('   - ID:', userResult.rows[0].id);
      console.log('   - Nickname:', userResult.rows[0].nickname);
      console.log('   - Realname:', userResult.rows[0].realname);
      console.log('   - Active:', userResult.rows[0].active);
      console.log('   - Password hash length:', userResult.rows[0].password.length);
    } else {
      console.log('❌ User not found');
    }
    
    // Test 4: Test password comparison
    console.log('\n4. Testing password comparison...');
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      try {
        const passwordMatch = await bcrypt.compare('password', user.password);
        console.log('✅ Password comparison result:', passwordMatch);
      } catch (error) {
        console.log('❌ Password comparison failed:', error.message);
        console.log('   This might be because the password is not bcrypt hashed');
      }
    }
    
    console.log('\n🎉 Login test completed!');
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();


