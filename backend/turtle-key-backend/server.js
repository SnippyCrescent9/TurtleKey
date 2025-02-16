import dotenv from 'dotenv';
import express from 'express';
import pool from './database.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
            return null; // Achievement already awarded
        }

        // Award the achievement
        await pool.query(
            'INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES ($1, $2, NOW())',
            [userId, achievementId]
        );
        // Fetch the name of the awarded achievement
        const achievementResult = await pool.query(
            'SELECT name FROM achievements WHERE id = $1',
            [achievementId]
        );

        // Check if the result contains a valid achievement name
        const achievementName = achievementResult.rows[0]?.name || 'an achievement';
        
        console.log(`Achievement ${achievementId} awarded to user ${userId}`);
        return `Congratulations! You have earned the "${achievementName}" achievement.`;
    } catch (error) {
        console.error('Error awarding achievement:', error.stack);
        return null;
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
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password, and email are required' });
        }

        // Hash the email using SHA-256
        const hashEmail = (email) => {
            return crypto.createHash('sha256').update(email).digest('hex');
        };

        const hashedEmail = hashEmail(email);

        // Check if username or hashed email already exists
        const userCheck = await pool.query(
            'SELECT username, email FROM users WHERE username = $1 OR email = $2',
            [username, hashedEmail]
        );

        if (userCheck.rows.length > 0) {
            const existingUser = userCheck.rows[0];
            if (existingUser.username === username) {
                return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
            }
            if (existingUser.email === hashedEmail) {
                return res.status(400).json({ error: 'Email already registered. Please use a different email.' });
            }
        }

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, email, profile_complete) VALUES ($1, $2, $3, true) RETURNING id',
            [username, hashedPassword, hashedEmail]
        );

        const userId = result.rows[0].id;

        // Award the New Turtle achievement
        const achievementMessage = await awardAchievement(userId, 4); // Achievement ID for New Turtle

         // Generate JWT token (just like your login function)
         const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully and New Turtle achievement awarded!',
            achievementMessage: achievementMessage || null,
            token,
        });
    } catch (error) {
        console.error('Error details:', error.stack);
        res.status(500).json({ error: 'Error registering user' });
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

app.delete('/delete-account', authenticateToken, async (req, res) => {
    const userId = req.user?.userId;

    try {
        // Ensure the user ID is valid
        if (!userId) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Optionally, delete user achievements
        await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);

        // Optionally, delete other user-related data here (e.g., passwords, logs, etc.)

        // Delete the user account
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error.stack);
        res.status(500).json({ error: 'Error deleting account' });
    }
});

app.post('/generate-password', authenticateToken, async (req, res) => {
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

        // Fetch the user's updated password count
        const result = await pool.query(
            'SELECT password_count FROM users WHERE id = $1',
            [userId]
        );
        
        if (!result.rows.length) {
            return res.status(404).send('User not found');
        }

        const passwordCount = result.rows[0].password_count;

        let achievementMessage = '';

        // Check achievements
        if (passwordCount === 1) {
            achievementMessage = await awardAchievement(userId, 1); // First Generated Password
        }
        if (passwordCount === 5) {
            achievementMessage = await awardAchievement(userId, 3); // Turtle-tastic!
        }

        // Send response with achievement message if any
        if (achievementMessage) {
            return res.status(200).send(achievementMessage); // Send message to frontend
        }

        res.status(200).send('Password generated successfully!');
    } catch (error) {
        console.error('Error generating password:', error.stack);
        res.status(500).send('Error generating password');
    }
});

// Add the /rate-password endpoint
app.post('/rate-password', authenticateToken, async (req, res) => {
    const { passwordStrength } = req.body;
    const userId = req.user?.userId;

    if (!passwordStrength) {
        return res.status(400).send('Password strength rating is required');
    }

    if (!userId) {
        return res.status(400).send('Invalid user');
    }

    try {
        // Here, you can add logic to rate the password based on its strength
        let achievementMessage = '';
        if (passwordStrength === 'very strong') {
            // Award achievement for a strong password
            achievementMessage = await awardAchievement(userId, 2); // Achievement ID for strong password
        }

        // Only send a response if an achievement is awarded
        if (achievementMessage) {
            return res.status(200).json({
                success: true,
                message: `Password strength rated as very strong. ${achievementMessage}`,
            });
        }

        // No achievement awarded, so don't send a response here
        return res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error('Error rating password:', error.stack);
        res.status(500).json({ error: 'Error rating password' });
    }
});


app.get('/user-achievements', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        console.log('User ID from token:', userId);

        // Ensure a valid user ID is present
        if (!userId) {
            console.error('Invalid user: No user ID found from token');
            return res.status(400).json({ error: 'Invalid user' });
        }

        const query = `
            SELECT ua.achievement_id, a.name, a.description, ua.earned_at
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1
            ORDER BY ua.earned_at;
        `;

        // Fetch the user's achievements
        const result = await pool.query(query, [userId]);
        console.log('Achievements result:', result.rows);

        res.status(200).json({ achievements: result.rows });
    } catch (error) {
        console.error('Error fetching user achievements:', error.stack);
        res.status(500).json({ error: 'Error fetching achievements' });
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