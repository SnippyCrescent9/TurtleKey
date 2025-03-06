import React, { useState, useEffect } from 'react';
import Input from '../components/Inputs';
import Button from '../components/Buttons';
import { useNavigate } from 'react-router-dom';

const UserAuthForm = () => {
    const [isRegistering, setIsRegistering] = useState(true);
    const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [achievements, setAchievements] = useState(() => {
        const storedAchievements = localStorage.getItem('achievements');
        return storedAchievements ? JSON.parse(storedAchievements) : [];
    });
    const [achievementMessage, setAchievementMessage] = useState('');
    const navigate = useNavigate();

    // Debug useEffect for username
    useEffect(() => {
        console.log('Current username:', username);
    }, [username]);

    // Function to fetch achievements
    const fetchAchievements = async (userToken) => {
        try {
            const response = await fetch('http://localhost:5000/user-achievements', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`, // Include token in the request
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAchievements(data.achievements || []);
                localStorage.setItem('achievements', JSON.stringify(data.achievements || [])); // Persist achievements
                console.log('Fetched achievements:', data.achievements);
            } else {
                console.error('Failed to fetch achievements');
                alert('Could not fetch achievements.');
            }
        } catch (err) {
            console.error('Error fetching achievements:', err);
            alert('Error fetching achievements from the server.');
        }
    };

    // Handle registration and login
    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isRegistering ? 'register' : 'login';
        const payload = isRegistering
            ? { username, password, email }
            : { username, password };

        if (!username || !password || (isRegistering && !email)) {
            alert('Please fill in all the required fields.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Login response data:', data);
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('isGuest', 'false');
                
                // Handle achievement message for new users
                if (isRegistering && data.achievementMessage) {
                    setAchievementMessage(data.achievementMessage);
                }
                
                // Fetch achievements
                await fetchAchievements(data.token);
                
                // Dispatch storage change event
                window.dispatchEvent(new Event('storageChange'));
                
                navigate('/profile');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action is irreversible!')) {
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                alert('Account deleted successfully.');
                handleLogout(); // Log out the user after account deletion
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to delete account'}`);
            }
        } catch (err) {
            console.error('Error deleting account:', err);
            alert('Error connecting to the server.');
        }
    };

    // Handle logout
    const handleLogout = () => {
        setToken(null);
        setUsername('');
        setAchievements([]);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('achievements');
        // Dispatch custom event to notify Navbar
        window.dispatchEvent(new Event('storageChange'));
        alert('Logged out successfully!');
    };

    // Add handleGuestLogin function before the return statement
    const handleGuestLogin = async () => {
        try {
            const response = await fetch('http://localhost:5000/guest-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('isGuest', 'true');
                
                // Dispatch storage change event
                window.dispatchEvent(new Event('storageChange'));
                
                navigate('/guest-profile');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Guest login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during guest login');
        }
    };

    return (
        <div className="auth-content">
            <h2>{token ? 'Account Information' : (isRegistering ? 'Create Account' : 'Welcome Back')}</h2>
            <div className="auth-card">
                {!token ? (
                    <>
                        <form id="authForm" onSubmit={handleSubmit} className="auth-form">
                            <div className="input-group">
                                <label htmlFor="username">Username</label>
                                <Input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="Enter your username"
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Password</label>
                                <Input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                />
                            </div>

                            {isRegistering && (
                                <div className="input-group">
                                    <label htmlFor="email">Email</label>
                                    <Input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="Enter your email"
                                    />
                                </div>
                            )}

                            <div className="button-group">
                                <Button type="submit">
                                    {isRegistering ? 'Create Account' : 'Sign In'}
                                </Button>
                                <div className="button-separator">
                                    <span>or</span>
                                </div>
                                <Button type="button" onClick={() => setIsRegistering(!isRegistering)}>
                                    {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                                </Button>
                                <div className="button-separator">
                                    <span>or</span>
                                </div>
                                <Button type="button" onClick={handleGuestLogin}>
                                    Continue as Guest
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="profile-section">
                        <h3>Welcome Back, {username}!</h3>
                        {achievementMessage && (
                            <p className="success-message">{achievementMessage}</p>
                        )}
                        {achievements && achievements.length > 0 && (
                            <div className="achievements-section">
                                <h4>Your Achievements:</h4>
                                <ul>
                                    {achievements.map((achievement, index) => (
                                        <li key={index}>
                                            <div>{achievement.name} - {achievement.description}</div>
                                            <div className="achievement-timestamp">
                                                Earned on: {new Date(achievement.earned_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <Button onClick={handleLogout}>Logout</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserAuthForm;
