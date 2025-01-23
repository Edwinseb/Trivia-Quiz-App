const express = require('express'); // For creating the server
const mysql = require('mysql2'); // For connecting to the database
const bodyParser = require('body-parser'); // For reading form data

const app = express(); // Create the Express app

// To handle form data properly
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files (HTML, CSS, JS) from the public folder
app.use(express.static('public'));

// Set up the database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Dexter_2024',
  database: 'quizApp'
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database!');
});

// Create a route to handle user registration
app.post('/register', (req, res) => {
  const { fullname, email, password } = req.body;

  console.log('Received data:', { fullname, email, password });

  // Insert the data into the users table
  const query = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';
  db.query(query, [fullname, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      res.status(500).send('Registration failed. Please try again.');
      return;
    }
    res.redirect('/index.html');
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      res.status(500).send('Login failed. Please try again.');
      return;
    }
    
    if (results.length > 0) {
      res.redirect('/index.html');
    } else {
      res.status(401).send('Invalid email or password');
    }
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
