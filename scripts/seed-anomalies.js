const fs = require('fs');
const axios = require('axios');

async function seedAnomalies() {
  const USER_SERVICE_URL = 'http://139.84.226.209:9034'; 
  const CODE_SERVICE_URL = 'http://139.84.226.209:9033'; 
  const AI_SERVICE_URL = 'https://staging-api.gatepassng.com/ai';

  const authApi = axios.create({ baseURL: `${USER_SERVICE_URL}/api/v1` });
  
  console.log('Fetching estate_id for Suncity Estate...');
  let estateIdForLogin;
  try {
    const searchRes = await authApi.get('/estates/public/search', { params: { search_query: 'Suncity Estate' } });
    const items = searchRes.data?.data?.items || searchRes.data?.items;
    if (items && items.length > 0) {
      estateIdForLogin = items[0].id;
      console.log(`✅ Found Estate ID: ${estateIdForLogin}`);
    } else {
      console.error('ERROR: Could not find Suncity Estate.');
      process.exit(1);
    }
  } catch (err) {
    console.error('ERROR: Estate search failed.', err.message);
    process.exit(1);
  }

  console.log('Logging in as Jane Doe...');
  let jwt;
  try {
    const loginRes = await authApi.post('/auth/login', {
      email: 'janedoe@example.com',
      password: 'NewPowerfulPassword',
      estate_id: estateIdForLogin
    });
    jwt = loginRes.data?.data?.access_token || loginRes.data?.access_token;
    console.log('✅ Login successful!');
  } catch (err) {
    console.error('ERROR: Login failed. Make sure the credentials are correct.', err.response?.data || err.message);
    process.exit(1);
  }

  const userApi = axios.create({
    baseURL: `${USER_SERVICE_URL}/api/v1`,
    headers: { Authorization: `Bearer ${jwt}` },
  });

  const codeApi = axios.create({
    baseURL: `${CODE_SERVICE_URL}/api/v1`,
    headers: { Authorization: `Bearer ${jwt}` },
  });

  const aiApi = axios.create({
    baseURL: `${AI_SERVICE_URL}/api/v1`,
    headers: { Authorization: `Bearer ${jwt}` },
  });

  try {
    console.log('1. Fetching my profile to get estate_id...');
    const profileRes = await userApi.get('/users/profile/me');
    console.log('Profile Response Keys:', Object.keys(profileRes.data));
    const profileData = profileRes.data.data || profileRes.data;
    const estateId = profileData.estate_id;
    const myUserId = profileData.user_id || profileData.id;
    console.log('Extracted myUserId:', myUserId);
    
    if (!estateId) {
      console.error('ERROR: Could not determine your estate_id. Are you assigned to an estate?');
      process.exit(1);
    }
    console.log(`✅ Estate ID: ${estateId}`);

    console.log('2. Fetching other users in the estate...');
    // Fetch users (residents, security, guests)
    const usersRes = await userApi.get('/users/', { params: { estate_id: estateId, limit: 10 } });
    const users = usersRes.data.data?.items || usersRes.data.items || usersRes.data.data || usersRes.data || [];
    
    if (!Array.isArray(users) || users.length === 0) {
      console.error('ERROR: Could not find any other users in your estate to generate codes for.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users. We will generate codes and validate them to create anomalies.`);

    // Take top 3 users to generate access logs for
    const targetUsers = users.slice(0, 3);

    for (let i = 0; i < targetUsers.length; i++) {
      const user = targetUsers[i];
      const isGuest = true;
      const type = 'visitor';
      
      console.log(`\n--- Processing User: ${user.first_name || user.guest_name || 'Unknown'} (${type}) ---`);

      // 3. Generate a code
      const body = {
        user_id: myUserId, // The resident creating the code
        estate_id: estateId,
        visitor_fullname: user.first_name || user.guest_name || 'Guest',
        relationship_with_resident: 'friend',
        gender: user.gender || 'MALE',
        validity_period: { start: new Date().toISOString(), end: new Date(Date.now() + 86400000).toISOString() },
        validity_window: { start: '00:00:00', end: '23:59:59' }
      };

      console.log('Generating access code...', body);
      let code;
      try {
        const codeRes = await codeApi.post(`/codeservice?receiver=${type}`, body);
        code = codeRes.data?.data?.code || codeRes.data?.code;
        console.log(`✅ Code Generated: ${code}`);
      } catch (err) {
        console.error('Failed to generate code:', JSON.stringify(err.response?.data || err.message, null, 2));
        continue;
      }

      if (!code) continue;

      // 4. Validate the code multiple times to simulate access log history
      // We will validate it 15 times to ensure it looks like an anomaly (e.g. Unusual Frequency)
      console.log('Validating code 15 times to create logs...');
      let successCount = 0;
      for (let v = 0; v < 15; v++) {
        try {
          await codeApi.get(`/codeservice/${code}`);
          successCount++;
        } catch (err) {
          // If the code expires or hits a limit, it might fail. We just catch and continue.
          // console.log(`Validation ${v+1} failed:`, err.response?.data || err.message);
        }
      }
      console.log(`✅ Successfully validated code ${successCount} times.`);
    }

    console.log('\n🎉 Done! The logs have been generated. The code service should automatically trigger AI webhooks. You can check the UI now.');

  } catch (err) {
    console.error('Script failed:', JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

seedAnomalies();
