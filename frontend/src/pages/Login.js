import React, { useState, useEffect } from 'react';
import Input from '../components/Inputs';
import Button from '../components/Buttons';

const UserAuthForm = () => {
    const [isRegistering, setIsRegistering] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [achievements, setAchievements] = useState(() => {
        const storedAchievements = localStorage.getItem('achievements');
        return storedAchievements ? JSON.parse(storedAchievements) : [];
    });
    const [achievementMessage, setAchievementMessage] = useState('');

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

                const { token, username, achievementMessage } = data;

                if (isRegistering) {
                    setToken(token);
                    localStorage.setItem('token', token);
                    setUsername(username);
                    setAchievementMessage(achievementMessage);  // Store achievement message here
                    alert('Registration successful! You are now logged in.');
                    if (achievementMessage) {
                        fetchAchievements(token);
                    }
                } else {
                    const { token, username } = data;
                    setToken(token);
                    localStorage.setItem('token', token);
                    setUsername(username);
                    alert('Login successful! Token stored.');
                    fetchAchievements(token);
                }
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Something went wrong'}`);
            }
        } catch (err) {
            console.error('Error connecting to the backend:', err);
            alert('Error connecting to the server.');
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
        setAchievements([]);
        localStorage.removeItem('token');
        localStorage.removeItem('achievements');
        alert('Logged out successfully!');
    };

    return (
        <div className="auth-content">
            <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
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
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="profile-section">
                        <h3>Welcome, {username}!</h3>
                        <Button onClick={handleLogout}>Logout</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserAuthForm;
