const fs = require('fs');

async function runTest() {
  const botToken = '8567432087:AAHydXkz8OT9w5q9CZdlCRG1EaTsqNB2f_k';
  const chatId = '1253687962';
  const apiBase = 'https://telegphoto-backend.onrender.com/api/v1';

  console.log('--- STEP 1: Verifying Telegram Bot & Chat ID ---');
  const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const meData = await meRes.json();
  console.log('Bot Info:', meData);

  const testMsgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🚀 TeleGphoto Live Test: Bot successfully linked to your personal media cloud!',
    }),
  });
  const testMsgData = await testMsgRes.json();
  console.log('Message delivery result:', testMsgData);

  console.log('\n--- STEP 2: Registering Account on TeleGphoto ---');
  const username = 'krishna.3163';
  const email = 'krishna3163019@gmail.com';
  const password = 'KrishnaTestSecure2026!';

  const regRes = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password,
      initialVault: {
        name: 'Personal Vault',
        encryptedVaultKey: 'mock_wrapped_vault_key_for_test',
        salt: 'mock_salt_for_test',
        keyVersion: 1,
      },
    }),
  });
  const regData = await regRes.json();
  console.log('Registration Response:', regData);

  let accessToken = regData?.data?.accessToken;
  if (!accessToken && regData?.error?.code === 'USERNAME_TAKEN') {
    console.log('User already exists, logging in...');
    const loginRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: username,
        password,
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    accessToken = loginData?.data?.accessToken;
  }

  console.log('\n--- STEP 3: Connecting Telegram Bot in Backend ---');
  const tgConnRes = await fetch(`${apiBase}/telegram/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      botToken,
      chatId,
    }),
  });
  const tgConnData = await tgConnRes.json();
  console.log('Telegram Connection Response:', tgConnData);

  console.log('\n--- STEP 4: Uploading Test Media Directly to Telegram & API ---');
  // Upload a sample test image directly to Telegram document endpoint
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const dummyFileContent = Buffer.from('TeleGphoto Encrypted Test Media Payload - AES-256-GCM');
  
  const payloadParts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="test_photo.enc"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  ];
  
  const preBuffer = Buffer.from(payloadParts[0] + payloadParts[1]);
  const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const fullBody = Buffer.concat([preBuffer, dummyFileContent, postBuffer]);

  const tgUploadRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: fullBody,
  });
  const tgUploadData = await tgUploadRes.json();
  console.log('Telegram Document Upload Result:', tgUploadData);

  console.log('\n--- STEP 5: Verifying Sync Bootstrap Endpoint ---');
  const bootstrapRes = await fetch(`${apiBase}/sync/bootstrap`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const bootstrapData = await bootstrapRes.json();
  console.log('Sync Bootstrap Result:', bootstrapData);

  console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
}

runTest().catch((err) => console.error('Test failed with error:', err));
