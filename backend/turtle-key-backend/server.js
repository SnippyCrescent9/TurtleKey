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

    if (!authHeader) {
        return res.status(401).send('Access Denied: No token provided');
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access Denied: Malformed token');
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if it's a guest token
        if (verified.isGuest) {
            // Verify the guest still exists and token matches
            pool.query(
                'SELECT * FROM guests WHERE id = $1 AND token = $2',
                [verified.guestId, token]
            ).then(result => {
                if (result.rows.length === 0) {
                    return res.status(403).send('Invalid or expired guest token');
                }
                // Update last_active timestamp
                pool.query(
                    'UPDATE guests SET last_active = NOW() WHERE id = $1',
                    [verified.guestId]
                );
                req.user = verified;
                next();
            }).catch(error => {
                console.error('Error verifying guest:', error);
                res.status(403).send('Invalid guest token');
            });
        } else {
            // Regular user authentication
            req.user = verified;
            next();
        }
    } catch (error) {
        console.error('Token verification error:', error.message);
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

        res.json({ 
            success: true, 
            message: 'Login successful', 
            token,
            username: user.rows[0].username 
        });
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
    const userId = req.user?.userId;
    const isGuest = req.user?.isGuest;

    if (!passwordStrength || typeof passwordStrength !== 'string') {
        return res.status(400).send('Invalid passwordStrength');
    }    

    try {
        // Only update password count for regular users
        if (!isGuest) {
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
    const isGuest = req.user?.isGuest;

    if (!passwordStrength) {
        return res.status(400).send('Password strength rating is required');
    }

    // For guest users, we don't need to check userId
    if (!isGuest && !userId) {
        return res.status(400).send('Invalid user');
    }

    try {
        // Only award achievements for regular users, not guests
        let achievementMessage = '';
        if (!isGuest && passwordStrength === 'very strong') {
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

// Guest login endpoint
app.post('/guest-login', async (req, res) => {
    try {
        console.log('Starting guest login process...');

        // Generate a unique guest username
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const guestUsername = `Guest_${timestamp}${randomNum}`;

        console.log('Generated guest username:', guestUsername);

        // Check if username exists in guests table only
        console.log('Checking for username conflicts...');
        const userCheck = await pool.query(
            'SELECT username FROM guests WHERE username = $1',
            [guestUsername]
        );

        if (userCheck.rows.length > 0) {
            console.log('Username conflict detected:', guestUsername);
            return res.status(409).json({ error: 'Username conflict, please try again' });
        }

        console.log('No username conflicts found, creating guest account...');

        // Create a new guest user
        const result = await pool.query(
            'INSERT INTO guests (username, created_at, last_active) VALUES ($1, NOW(), NOW()) RETURNING id',
            [guestUsername]
        );

        if (!result.rows || result.rows.length === 0) {
            console.error('Failed to insert guest user');
            return res.status(500).json({ error: 'Failed to create guest account' });
        }

        const guestId = result.rows[0].id;
        console.log('Guest account created with ID:', guestId);

        // Generate JWT token
        console.log('Generating JWT token...');
        const token = jwt.sign({ guestId, username: guestUsername, isGuest: true }, process.env.JWT_SECRET, {
            expiresIn: '24h',
        });

        // Store the token in the guests table
        console.log('Storing token in database...');
        await pool.query(
            'UPDATE guests SET token = $1 WHERE id = $2',
            [token, guestId]
        );

        console.log('Guest login successful for username:', guestUsername);

        res.status(201).json({
            success: true,
            message: 'Guest login successful',
            token,
            username: guestUsername
        });
    } catch (error) {
        console.error('Detailed error in guest login:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error code:', error.code);
        console.error('Error detail:', error.detail);
        console.error('Error hint:', error.hint);
        
        res.status(500).json({ 
            error: 'Error creating guest account',
            details: error.message,
            name: error.name,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Cleanup old guest accounts (runs every hour)
const cleanupGuestAccounts = async () => {
    try {
        const result = await pool.query(
            'DELETE FROM guests WHERE created_at < NOW() - INTERVAL \'24 hours\''
        );
        console.log(`Cleaned up ${result.rowCount} old guest accounts`);
    } catch (error) {
        console.error('Error cleaning up guest accounts:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupGuestAccounts, 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});