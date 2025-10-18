const pool = require('./config/database');

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test database name
    const dbResult = await client.query('SELECT current_database()');
    console.log('✅ Database:', dbResult.rows[0].current_database);
    
    // Test user
    const userResult = await client.query('SELECT current_user');
    console.log('✅ User:', userResult.rows[0].current_user);
    
    // Check if pickers table exists
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pickers'
      );
    `);
    console.log('✅ Pickers table exists:', tableResult.rows[0].exists);
    
    // Check if pickersview exists
    const viewResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'pickersview'
      );
    `);
    console.log('✅ Pickersview exists:', viewResult.rows[0].exists);
    
    // Test querying pickers table
    const pickersResult = await client.query('SELECT COUNT(*) as count FROM pickers');
    console.log('✅ Pickers count:', pickersResult.rows[0].count);
    
    // Test querying pickersview
    const viewDataResult = await client.query('SELECT COUNT(*) as count FROM pickersview');
    console.log('✅ Pickersview count:', viewDataResult.rows[0].count);
    
    // Show sample data
    const sampleResult = await client.query('SELECT id, email, nickname, realname FROM pickers LIMIT 3');
    console.log('✅ Sample pickers data:');
    sampleResult.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Email: ${row.email}, Nickname: ${row.nickname}, Realname: ${row.realname}`);
    });
    
    client.release();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check if PostgreSQL is listening on port 5432');
      console.error('3. Verify the host is correct (localhost)');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed - check username and password');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist - check database name');
    }
  } finally {
    await pool.end();
  }
}

testConnection();

