const pool = require('./config/database');

async function checkPassword() {
  try {
    const result = await pool.query('SELECT email, password FROM pickers WHERE email = $1', ['jj']);
    console.log('Email:', result.rows[0].email);
    console.log('Password:', result.rows[0].password);
    console.log('Password length:', result.rows[0].password.length);
    console.log('Password type:', typeof result.rows[0].password);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPassword();




