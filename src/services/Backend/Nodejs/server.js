// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;


app.use(cors());

// NGROK URL ortam değişkeninden okunuyor
const NGROK_URL = process.env.NGROK_URL || 'https://your-ngrok-url.ngrok.io';


app.get('/get-public-url', (req, res) => {
  res.json({ url: NGROK_URL });
});


const exampleUsers = {
  'user1': ['user2', 'user3'],
  'user2': ['user1'],
  'user3': ['user1'],
};

// Kullanıcı ID’ye göre önerilen kullanıcıların IDsini döner
app.get('/same-cluster-users/:uid', (req, res) => {
  const uid = req.params.uid;
  const users = exampleUsers[uid] || [];
  res.json({ user_ids: users });
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log(`Using NGROK_URL = ${NGROK_URL}`);
});
