const pool = require('./config/database');

async function testLogin() {
  try {
    console.log('Testing login with plain text passwords...');
    
    // Test login with known user
    const email = 'jj';
    const password = 'password';
    
    const result = await pool.query('SELECT * FROM pickers WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Found user:', user.email);
    console.log('   - Stored password:', user.password);
    console.log('   - Input password:', password);
    
    // Test plain text comparison
    const isPlainText = user.password.length < 20;
    console.log('   - Is plain text:', isPlainText);
    
    if (isPlainText) {
      const validPassword = password === user.password;
      console.log('   - Password match:', validPassword);
    }
    
    console.log('\n🎉 Login test completed!');
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();








