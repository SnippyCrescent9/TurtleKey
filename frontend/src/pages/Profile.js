import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Buttons';

const Profile = () => {
    const [username, setUsername] = useState('');
    const [achievements, setAchievements] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');
        const isGuest = localStorage.getItem('isGuest') === 'true';

        console.log('Profile useEffect - Token:', token);
        console.log('Profile useEffect - Username:', storedUsername);
        console.log('Profile useEffect - Is Guest:', isGuest);

        if (!token) {
            console.log('No token found, redirecting to login');
            navigate('/login');
            return;
        }

        if (isGuest) {
            console.log('User is guest, redirecting to guest profile');
            navigate('/guest-profile');
            return;
        }

        setUsername(storedUsername);

        // Fetch achievements
        const fetchAchievements = async () => {
            try {
                console.log('Fetching achievements...');
                const response = await fetch('http://localhost:5000/user-achievements', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Achievements data:', data);
                    setAchievements(data.achievements || []);
                } else {
                    console.error('Failed to fetch achievements:', response.status);
                    setError('Failed to fetch achievements');
                }
            } catch (error) {
                console.error('Error fetching achievements:', error);
                setError('Error fetching achievements');
            }
        };

        fetchAchievements();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('isGuest');
        window.dispatchEvent(new Event('storageChange'));
        navigate('/login');
    };

    return (
        <div className="container">
            <h2>Account</h2>
            <div className="profile-section">
                <h3>Welcome back, {username || 'User'}!</h3>
                
                {error && <p className="error-message">{error}</p>}
                
                {achievements.length > 0 ? (
                    <div className="achievements-section">
                        <h4>Your Achievements:</h4>
                        <ul>
                            {achievements.map((achievement, index) => (
                                <li key={index}>
                                    <div className="achievement-content">
                                        <div className="achievement-title">
                                            <span className="trophy-icon">🏆</span>
                                            {achievement.name}
                                        </div>
                                        <div className="achievement-description">{achievement.description}</div>
                                        <div className="achievement-timestamp">
                                            Earned on: {new Date(achievement.earned_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>No achievements yet. Keep using the app to earn achievements!</p>
                )}

                <div className="button-group">
                    <Button onClick={handleLogout}>Logout</Button>
                </div>
            </div>
        </div>
    );
};

export default Profile; 