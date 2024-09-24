const express = require('express');
const { Akinator } = require('@aqul/akinator-api');
const axios = require('axios');
const app = express();
const port = 3000;
const dbUrl = 'http://nue-db.vercel.app';

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Akinator Game API</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
      <style>
        body { font-family: sans-serif; }
        .endpoint { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1><i class="fas fa-gamepad"></i> Akinator Game API</h1>
      <div class="endpoint">
        <h3><i class="fas fa-play"></i> Start Game</h3>
        <p>GET /:username/start</p>
      </div>
      <div class="endpoint">
        <h3><i class="fas fa-question"></i> Answer Question</h3>
        <p>GET /:username/answer/:answer (0-4)</p>
      </div>
      <div class="endpoint">
        <h3><i class="fas fa-undo"></i> Cancel Answer</h3>
        <p>GET /:username/cancel</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/:username/start', async (req, res) => {
  const { username } = req.params;
  const akinator = new Akinator({ region: 'id', childMode: false });
  await akinator.start();
  await axios.post(`${dbUrl}/write/${username}`, { json: { akinator } });
  res.json({ message: `Game started for ${username}`, question: akinator.question, progress: akinator.progress });
});

app.get('/:username/answer/:answer', async (req, res) => {
  const { username, answer } = req.params;
  const { data: { json: { akinator } } } = await axios.get(`${dbUrl}/read/${username}`);
  if (!akinator) return res.status(404).json({ message: `No game session found for ${username}` });
  await akinator.answer(parseInt(answer));
  await axios.post(`${dbUrl}/write/${username}`, { json: { akinator } });
  if (akinator.isWin) {
    res.json({
      message: 'Congratulations!',
      win: true,
      suggestion_name: akinator.sugestion_name,
      suggestion_desc: akinator.sugestion_desc,
      suggestion_photo: akinator.sugestion_photo,
    });
  } else {
    res.json({ message: `Answered with ${answer}`, question: akinator.question, progress: akinator.progress, win: false });
  }
});

app.get('/:username/cancel', async (req, res) => {
  const { username } = req.params;
  const { data: { json: { akinator } } } = await axios.get(`${dbUrl}/read/${username}`);
  if (!akinator) return res.status(404).json({ message: `No game session found for ${username}` });
  await akinator.cancelAnswer();
  await axios.post(`${dbUrl}/write/${username}`, { json: { akinator } });
  res.json({ message: 'Cancelled the last answer', question: akinator.question, progress: akinator.progress });
});

app.listen(port, () => {
  console.log(`Akinator API is running on http://localhost:${port}`);
});
