const express = require('express');
const { Akinator } = require('@aqul/akinator-api');
const axios = require('axios'); // Adding axios for API requests
const app = express();
const port = 3000;

const API_BASE_URL = 'http://nue-db.vercel.app';

// Start a new game
app.get('/:username/start', async (req, res) => {
  const { username } = req.params;
  const region = 'id';
  const akinator = new Akinator({ region, childMode: false });
  await akinator.start();

  // Save the session to the external DB
  await axios.post(`${API_BASE_URL}/write/${username}`, {
    json: akinator
  });

  res.json({
    message: `Game started for ${username}`,
    question: akinator.question,
    progress: akinator.progress
  });
});

// Answer a question and check if the user won
app.get('/:username/answer/:answer', async (req, res) => {
  const { username, answer } = req.params;

  // Retrieve the session from the external DB
  const response = await axios.get(`${API_BASE_URL}/read/${username}`);
  const akinatorData = response.data;
  
  if (!akinatorData) {
    return res.status(404).json({ message: `No game session found for ${username}` });
  }

  const akinator = new Akinator(akinatorData);
  await akinator.answer(parseInt(answer));

  // Check if the game is won
  if (akinator.isWin) {
    res.json({
      message: 'Congratulations!',
      win: true,
      suggestion_name: akinator.sugestion_name,
      suggestion_desc: akinator.sugestion_desc,
      suggestion_photo: akinator.sugestion_photo
    });

    // Delete the session after the game is won
    await axios.get(`${API_BASE_URL}/delete/${username}`);
  } else {
    res.json({
      message: `Answered with ${answer}`,
      question: akinator.question,
      progress: akinator.progress,
      win: false
    });

    // Update the session in the external DB
    await axios.post(`${API_BASE_URL}/write/${username}`, {
      json: akinator
    });
  }
});

// Cancel the last answer
app.get('/:username/cancel', async (req, res) => {
  const { username } = req.params;

  // Retrieve the session from the external DB
  const response = await axios.get(`${API_BASE_URL}/read/${username}`);
  const akinatorData = response.data;

  if (!akinatorData) {
    return res.status(404).json({ message: `No game session found for ${username}` });
  }

  const akinator = new Akinator(akinatorData);
  await akinator.cancelAnswer();

  // Update the session after cancelling the answer
  await axios.post(`${API_BASE_URL}/write/${username}`, {
    json: akinator
  });

  res.json({
    message: 'Cancelled the last answer',
    question: akinator.question,
    progress: akinator.progress
  });
});

app.listen(port, () => {
  console.log(`Akinator API is running on http://localhost:${port}`);
});
