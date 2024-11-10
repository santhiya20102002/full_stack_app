const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('pg'); // PostgreSQL client

const app = express();
const port = 5000;

// Database client setup
const client = new Client({
  user: 'postgres', // replace with your PostgreSQL username
  host: 'localhost',
  database: 'image_marks', // replace with your PostgreSQL database name
  password: '2002', // replace with your PostgreSQL password
  port: 5432,
});

client.connect();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse incoming JSON requests

// Endpoint to save coordinates
app.post('/api/marks', async (req, res) => {
  const { coordinates } = req.body;
  const imageName = 'parachute.jpg'; // You can use dynamic image names if needed

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
