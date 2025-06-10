const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

let users = [];

app.post('/register', (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({
                username: '',
                email: '',
                faceData: null,
                error: 'Missing required fields'
            });
        }
        
        // Check if user already exists
        const existingUser = users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            return res.status(400).json({
                username: '',
                email: '',
                faceData: null,
                error: 'User already exists'
            });
        }
        
        // Save user (in real app, hash the password)
        const newUser = { username, email, password };
        users.push(newUser);
        
        console.log('New user registered:', { username, email });
        
        res.json({
            username: username,
            email: email,
            faceData: null
        });
        
    } catch (error) {
        res.status(500).json({
            username: '',
            email: '',
            faceData: null,
            error: 'Server error'
        });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => 
        (u.username === username || u.email === username) && u.password === password
    );
    
    if (user) {
        res.json({
            username: user.username,
            email: user.email,
            faceData: user.faceData || null
        });
    } else {
        res.status(401).json({
            username: '',
            email: '',
            faceData: null,
            error: 'Invalid credentials'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});