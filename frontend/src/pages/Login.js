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
        <div>
            {!token ? (
                <>
                    <h2>{isRegistering ? 'Register' : 'Login'}</h2>
                    <form id="authForm" onSubmit={handleSubmit}>
                        <label htmlFor="username">Username:</label>
                        <Input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        /><br />

                        <label htmlFor="password">Password:</label>
                        <Input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        /><br />

                        {isRegistering && (
                            <>
                                <label htmlFor="email">Email:</label>
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                /><br />
                            </>
                        )}

                        <Button type="submit">
                            {isRegistering ? 'Register' : 'Login'}
                        </Button>
                    </form>

                    <Button onClick={() => setIsRegistering(!isRegistering)}>
                        Switch to {isRegistering ? 'Login' : 'Register'}
                    </Button>
                </>
            ) : (
                <>
                    <h2>Welcome Back!</h2>

                    <h3>Your Achievements:</h3>
                    {achievements.length > 0 ? (
                        <ul>
                            {achievements.map((achievement, index) => (
                                <li key={index}>
                                    <strong>{achievement.name}</strong> - {achievement.description}
                                    <br />
                                    <small>Earned on: {new Date(achievement.earned_at).toLocaleDateString()}</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No achievements to display.</p>
                    )}
                    <Button onClick={handleLogout}>Log Out</Button>
                    <Button onClick={handleDeleteAccount} style={{ backgroundColor: 'red', color: 'white' }}>
                        Delete Account
                    </Button>
                </>
            )}
            {achievementMessage && (
                <p style={{ color: 'green', fontWeight: 'bold' }}>{achievementMessage}</p>
            )}
        </div>
    );
};

export default UserAuthForm;
