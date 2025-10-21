const pool = require('./config/database');

async function showTestAccounts() {
  try {
    const result = await pool.query('SELECT email, password, nickname, realname FROM pickers WHERE active = $1 LIMIT 5', ['y']);
    console.log('Available test accounts:');
    console.log('========================');
    result.rows.forEach(row => {
      console.log(`Email: ${row.email}`);
      console.log(`Password: ${row.password}`);
      console.log(`Nickname: ${row.nickname}`);
      console.log(`Real Name: ${row.realname}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

showTestAccounts();








