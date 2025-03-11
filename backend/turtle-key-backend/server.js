import dotenv from 'dotenv';
import express from 'express';
import pool from './database.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();
const app = express();
//port number for fly.io is 8080, and not localhost 5000 anymore
const PORT = process.env.PORT || 8080;

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

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

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

// Function to generate 6-character alphanumeric code
function generateResetCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        // Hash the email using the same method as registration
        const hashedEmail = crypto.createHash('sha256').update(email).digest('hex');
        
        // Check if user exists using hashed email
        const user = await pool.query('SELECT id FROM users WHERE email = $1', [hashedEmail]);
        
        if (user.rows.length > 0) {
            const userId = user.rows[0].id;
            const resetCode = generateResetCode();
            const expiryTime = new Date(Date.now() + 15 * 60000); // 15 minutes from now

            // Invalidate any existing codes
            await pool.query(
                'UPDATE password_reset_codes SET is_valid = false WHERE user_id = $1',
                [userId]
            );

            // Insert new reset code
            await pool.query(
                'INSERT INTO password_reset_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
                [userId, resetCode, expiryTime]
            );

            // Send email
            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: email, // Use original email for sending
                subject: 'Password Reset Code - TurtleKey',
                html: `
                    <p>Here is your one time reset passcode:</p>
                    <h2 style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;">
                        ${resetCode}
                    </h2>
                    <p>This passcode will expire in 15 minutes or when used.</p>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        // Always return success (even if email doesn't exist - security best practice)
        res.json({ success: true, message: 'If an account exists with this email, a reset code has been sent.' });

    } catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
});

app.post('/validate-reset-code', async (req, res) => {
    const { email, code } = req.body;
    try {
        // Hash the email to match database
        const hashedEmail = crypto.createHash('sha256').update(email).digest('hex');
        
        // Get user and their reset code
        const result = await pool.query(
            `SELECT rc.* FROM password_reset_codes rc
             JOIN users u ON u.id = rc.user_id
             WHERE u.email = $1 AND rc.code = $2 AND rc.is_valid = true
             ORDER BY rc.created_at DESC LIMIT 1`,
            [hashedEmail, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid reset code.' });
        }

        const resetCode = result.rows[0];

        // Check if code is expired
        if (new Date() > new Date(resetCode.expires_at)) {
            return res.status(400).json({ success: false, message: 'Reset code has expired.' });
        }

        // Check if code is already used
        if (resetCode.is_used) {
            return res.status(400).json({ success: false, message: 'Reset code has already been used.' });
        }

        // Check attempt count
        if (resetCode.attempt_count >= 3) {
            await pool.query(
                'UPDATE password_reset_codes SET is_valid = false WHERE id = $1',
                [resetCode.id]
            );
            return res.status(400).json({ success: false, message: 'Too many invalid attempts.' });
        }

        // If code is valid, mark as used
        await pool.query(
            'UPDATE password_reset_codes SET is_used = true WHERE id = $1',
            [resetCode.id]
        );

        res.json({ success: true, message: 'Code validated successfully.' });

    } catch (error) {
        console.error('Error in validate-reset-code:', error);
        res.status(500).json({ success: false, message: 'An error occurred while validating the code.' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Validate password requirements
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,20})/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be 8-20 characters long and contain at least one capital letter, one number, and one special character.'
        });
    }

    try {
        // Hash the email to match database
        const hashedEmail = crypto.createHash('sha256').update(email).digest('hex');

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user's password
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
            [hashedPassword, hashedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Unable to update password.' });
        }

        // Invalidate all reset codes for this user
        await pool.query(
            `UPDATE password_reset_codes rc
             SET is_valid = false
             FROM users u
             WHERE u.id = rc.user_id AND u.email = $1`,
            [hashedEmail]
        );

        res.json({ success: true, message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Error in reset-password:', error);
        res.status(500).json({ success: false, message: 'An error occurred while resetting the password.' });
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

app.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running on http://localhost:${PORT}`);
});