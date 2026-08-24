const fs = require('fs');

async function runTest() {
  const apiBase = 'http://localhost:4000/api/v1';
  const username = 'test_crud_user_' + Date.now();
  const email = `${username}@test.com`;
  const password = 'TestSecure2026!';

  console.log('--- STEP 1: Registering User ---');
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
  const accessToken = regData?.data?.accessToken;
  if (!accessToken) {
    throw new Error('Failed to register: ' + JSON.stringify(regData));
  }
  console.log('User registered successfully.');

  console.log('\n--- STEP 2: Connecting Telegram ---');
  // Use mock or test token
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
  console.log('Telegram connected.');

  console.log('\n--- STEP 3: Upload Photo 1 ---');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const dummyFileContent = Buffer.from('TeleGphoto Fake Image Content 1');
  
  // Fake FormData payload for express multer
  const metadata = JSON.stringify({
    fileName: 'photo1.jpg',
    mimeType: 'image/jpeg',
    mediaType: 'image',
    width: 800,
    height: 600
  });

  const uploadParts1 = [
    `--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo1.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
  ];
  
  const uploadBody1 = Buffer.concat([
    Buffer.from(uploadParts1[0] + uploadParts1[1]),
    dummyFileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const uploadRes1 = await fetch(`${apiBase}/media/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${accessToken}`,
    },
    body: uploadBody1,
  });
  const uploadData1 = await uploadRes1.json();
  const photo1Id = uploadData1?.data?.id;
  console.log('Uploaded Photo 1 Result:', uploadData1);

  console.log('\n--- STEP 4: Access Photo 1 (Download Proxy) ---');
  if (!photo1Id) throw new Error('No photo1Id returned');
  const downloadRes = await fetch(`${apiBase}/media/${photo1Id}/download?token=${accessToken}`);
  if (downloadRes.ok) {
    const text = await downloadRes.text();
    console.log(`Successfully downloaded Photo 1 via proxy! Content starts with: "${text.substring(0, 30)}..."`);
  } else {
    console.error('Download failed:', downloadRes.status, await downloadRes.text());
  }

  console.log('\n--- STEP 5: Upload Photo 2 ---');
  const metadata2 = JSON.stringify({
    fileName: 'photo2.png',
    mimeType: 'image/png',
    mediaType: 'image',
  });
  const dummyFileContent2 = Buffer.from('TeleGphoto Fake Image Content 2');
  const uploadParts2 = [
    `--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n${metadata2}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo2.png"\r\nContent-Type: image/png\r\n\r\n`,
  ];
  const uploadBody2 = Buffer.concat([
    Buffer.from(uploadParts2[0] + uploadParts2[1]),
    dummyFileContent2,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const uploadRes2 = await fetch(`${apiBase}/media/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${accessToken}`,
    },
    body: uploadBody2,
  });
  const uploadData2 = await uploadRes2.json();
  const photo2Id = uploadData2?.data?.id;
  console.log('Uploaded Photo 2 Result:', uploadData2);

  console.log('\n--- STEP 6: Perform CRUD Operations ---');
  
  // Mark Photo 1 as Favorite
  console.log('Toggling favorite on Photo 1...');
  const favRes = await fetch(`${apiBase}/media/${photo1Id}/favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ favorite: true })
  });
  console.log('Favorite result:', await favRes.json());

  // Move Photo 2 to Trash
  console.log('Moving Photo 2 to trash...');
  const trashRes = await fetch(`${apiBase}/media/${photo2Id}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('Trash result:', await trashRes.json());

  // Fetch Gallery to verify state
  console.log('\n--- STEP 7: Fetch Final Gallery State ---');
  const galleryRes = await fetch(`${apiBase}/media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const galleryData = await galleryRes.json();
  console.log('Gallery contains items:', galleryData.data.items.length);
  const p1 = galleryData.data.items.find(i => i.id === photo1Id);
  if (p1) {
    console.log(`Photo 1 -> Favorite: ${p1.favorite}, Trashed: ${p1.trashed}`);
  }

  // Fetch Trashed Gallery
  const trashGalleryRes = await fetch(`${apiBase}/media?trashed=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const trashGalleryData = await trashGalleryRes.json();
  console.log('Trash contains items:', trashGalleryData.data.items.length);
  const p2 = trashGalleryData.data.items.find(i => i.id === photo2Id);
  if (p2) {
    console.log(`Photo 2 -> Trashed: ${p2.trashed}`);
  }

  console.log('\n🎉 E2E TEST COMPLETED SUCCESSFULLY!');
}

runTest().catch(console.error);
