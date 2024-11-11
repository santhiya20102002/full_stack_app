const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const app = express();
const port = 5000;

// Database client setup
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'image_marks',
  password: '2002',
  port: 5432,
});

client.connect();

app.use(cors()); 
app.use(bodyParser.json()); 

// Endpoint to save coordinates
app.post('/api/marks', async (req, res) => {
  const { coordinates } = req.body;
  const imageName = 'parachute.jpg';

  try {
    // Insert the coordinates into the database
    const query = 'INSERT INTO marks (name, coordinates) VALUES ($1, $2) RETURNING *';
    const values = [imageName, JSON.stringify(coordinates)];

    const result = await client.query(query, values);

    // Respond with success
    res.status(200).json({ message: 'Coordinates saved successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error saving coordinates to database', err);
    res.status(500).json({ message: 'Error saving coordinates', error: err });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
