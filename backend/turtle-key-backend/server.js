import dotenv from 'dotenv';
import express from 'express';
import pool from './database.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Check if the authorization header is present
    if (!authHeader) {
        return res.status(401).send('Access Denied: No token provided');
    }

    // Split the header to extract the token if in "Bearer <token>" format
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access Denied: Malformed token');
    }

    try {
        // Verify the token using your secret
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Attach user data to the request
        next(); // Move to the next middleware or route
    } catch (error) {
        console.error('Token verification error:', error.message); // Log the error
        res.status(403).send('Invalid Token');
    }
};

const awardAchievement = async (userId, achievementId) => {
    try {
        // Check if the user already has the achievement
        const checkAchievement = await pool.query(
            'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
            [userId, achievementId]
        );
        if (checkAchievement.rows.length > 0) {
            return; // Achievement already awarded
        }

        // Award the achievement
        await pool.query(
            'INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES ($1, $2, NOW())',
            [userId, achievementId]
        );
        console.log(`Achievement ${achievementId} awarded to user ${userId}`);
    } catch (error) {
        console.error('Error awarding achievement:', error.stack);
    }
};

//Home route
app.get('/', (req,res)=> {
    res.send('Welcome to TurtleKey Backend!')
});

// Create a user with hashed password and complete profile
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({error:'Username and password are required'});
        }

        // Check if username or email already exists
        const userCheck = await pool.query(
            'SELECT username, email FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (userCheck.rows.length > 0) {
            const existingUser = userCheck.rows[0];
            if (existingUser.username === username) {
                return res.status(400).json({error: 'Username already exists. Please choose a different username.'});
            }
            if (existingUser.email === email) {
                return res.status(400).json({error: 'Email already registered. Please use a different email.'});
            }
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user and return their ID
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, email, profile_complete) VALUES ($1, $2, $3, true) RETURNING id',
            [username, hashedPassword, email]
        );

        const userId = result.rows[0].id;

        // Award the New Turtle achievement
        await awardAchievement(userId, 4); // Achievement ID for New Turtle

        res.status(201).json({success: true, message: 'User registered successfully and New Turtle achievement awarded!'});
    } catch (error) {
        console.error('Error details:', error.stack);
        res.status(500).json({error:'Error registering user'});
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(404).json({error: 'User not found'});
        }
        
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({error:'Incorrect Password!'});
        }

        const token = jwt.sign({ userId: user.rows[0].id, username: user.rows[0].username }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        console.log('Generated Token:', token);

        res.json({ success: true, message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({error: 'Server error'});
    }
});

app.post('/generate-password', authenticateToken, async (req, res) => {
    //USED FOR DEBUG, DELETE LATER
    //console.log('Route hit: /generate-password');
    //console.log('Request body:', req.body);
    //console.log('Authenticated user:', req.user);

    
    const { passwordStrength } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId || typeof userId !== 'number') {
        return res.status(400).send('Invalid userId');
    }
    if (!passwordStrength || typeof passwordStrength !== 'string') {
        return res.status(400).send('Invalid passwordStrength');
    }    

    try {
        // Record password generation (increment count)
        await pool.query(
            'UPDATE users SET password_count = password_count + 1 WHERE id = $1',
            [userId]
        );
        //USED TO CHECK IF USER ID IS CORRECT
        //console.log('User ID:', userId);

        // Fetch the user's updated password count
        const result = await pool.query(
            'SELECT password_count FROM users WHERE id = $1',
            [userId]
        );
        //will be removed, needed to figure out error DELETE LATER
        //console.log('User data fetched:', result.rows);
        if (!result.rows.length) {
            return res.status(404).send('User not found');
        }

        const passwordCount = result.rows[0].password_count;

        // Check achievements
        if (passwordCount === 1) {
            await awardAchievement(userId, 1); // First Generated Password
        }
        if (passwordCount === 5) {
            await awardAchievement(userId, 3); // Turtle-tastic!
        }
        if (passwordStrength === 'very strong') {
            await awardAchievement(userId, 2); // Shell Proof Password
        }

        res.status(200).send('Password generated successfully!');
    } catch (error) {
        console.error('Error generating password:', error.stack);
        res.status(500).send('Error generating password');
    }
});

//Fetch all users
app.get('/users', authenticateToken, async (req, res)=>{
    try {
        const result = await pool.query('SELECT id, username, email FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Server error');
    }
});

// Test route to verify the database
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.send(`Database Connected: ${result.rows[0].now}`);
    } catch (error) {
        res.status(500).send('Database connection failed');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});