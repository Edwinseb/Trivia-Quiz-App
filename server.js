//server.js
const express = require('express');
const mysql = require('mysql');
const app = express();

//Enable JSON parsing
app.use(express.json());
app.use(express.static('public'));

//Database Connection

const db = mysql.createConnection({
    host: 'localhost',
    user: 'Faz',
    password: 'Dexter_2024',
    database: 'quizApp'
});

//connect to database
db.connect(err => {
    if(err){
        console.error('Error connecting to database: ',err);
        return;
    }
    console.log('Connected to mysql database');
});

//Register endpoint
app.post('/register',(req,res)=>{
    const {email, password} = req.body;

    const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(query, [email, password], (err, result) => {
        if (err) {
            res.json({ error: 'Registration failed' });
            return;
        }
        res.json({ message: 'Registration successful' });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err || results.length === 0) {
            res.json({ error: 'Login failed' });
            return;
        }
        res.json({ message: 'Login successful' });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});