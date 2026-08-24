const fs = require('fs');

async function runTest() {
  const apiBase = 'http://localhost:4000/api/v1';
  const username = 'test_session_user_' + Date.now();
  const email = `${username}@test.com`;
  const password = 'TestSecure2026!';

  console.log('--- SESSION 1: Registration & Upload ---');
  // 1. Register User
  const regRes = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password,
      initialVault: {
        name: 'Personal Vault',
        encryptedVaultKey: 'mock_key',
        salt: 'mock_salt',
        keyVersion: 1,
      },
    }),
  });
  const regData = await regRes.json();
  let accessToken = regData?.data?.accessToken;
  if (!accessToken) throw new Error('Failed to register: ' + JSON.stringify(regData));
  console.log('User registered. Session 1 Active.');

  // 2. Connect Telegram
  const botToken = '8567432087:AAHydXkz8OT9w5q9CZdlCRG1EaTsqNB2f_k';
  const chatId = '1253687962';
  
  await fetch(`${apiBase}/telegram/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ botToken, chatId }),
  });
  console.log('Telegram Bot Linked.');

  // 3. Upload Photo
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const dummyFileContent = Buffer.from('TeleGphoto Fake Image Content For Session Test');
  const metadata = JSON.stringify({ fileName: 'persistent_photo.jpg', mimeType: 'image/jpeg', mediaType: 'image' });

  const uploadParts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="persistent_photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
  ];
  
  const uploadBody = Buffer.concat([
    Buffer.from(uploadParts[0] + uploadParts[1]),
    dummyFileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const uploadRes = await fetch(`${apiBase}/media/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${accessToken}`,
    },
    body: uploadBody,
  });
  const uploadData = await uploadRes.json();
  const photoId = uploadData?.data?.id;
  console.log('Uploaded Photo ID:', photoId);

  // 4. Terminate Session 1
  console.log('\n--- TERMINATING SESSION 1 ---');
  await fetch(`${apiBase}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  accessToken = null; // Destroy local token
  console.log('Session 1 terminated. Token discarded.');

  console.log('\n--- SESSION 2: Login & Access Photo ---');
  // 5. Login to create Session 2
  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: username,
      password,
    }),
  });
  const loginData = await loginRes.json();
  const newAccessToken = loginData?.data?.accessToken;
  if (!newAccessToken) throw new Error('Login failed for Session 2');
  console.log('User logged in. Session 2 Active.');

  // 6. Fetch Gallery and Verify Photo Exists
  const galleryRes = await fetch(`${apiBase}/media`, {
    headers: { Authorization: `Bearer ${newAccessToken}` },
  });
  const galleryData = await galleryRes.json();
  const fetchedPhoto = galleryData.data.items.find(i => i.id === photoId);
  if (!fetchedPhoto) throw new Error('Photo NOT found in gallery after new session!');
  console.log('Photo successfully found in gallery list in Session 2:', fetchedPhoto.fileName);

  // 7. Download Photo from Telegram via Proxy
  const downloadRes = await fetch(`${apiBase}/media/${photoId}/download?token=${newAccessToken}`);
  if (downloadRes.ok) {
    const text = await downloadRes.text();
    console.log(`\n✅ SUCCESS: Downloaded photo buffer in Session 2!`);
    console.log(`Content verification: "${text.substring(0, 40)}..."`);
  } else {
    throw new Error('Download failed: ' + await downloadRes.text());
  }

  console.log('\n🎉 CROSS-SESSION PERSISTENCE TEST COMPLETED SUCCESSFULLY!');
}

runTest().catch(console.error);
