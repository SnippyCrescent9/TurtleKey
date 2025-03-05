import React, { useState } from 'react';
import Input from '../components/Inputs';
import Button from '../components/Buttons';

const PasswordRater = () => {
    const [password, setPassword] = useState('');
    const [strength, setStrength] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [feedback, setFeedback] = useState([]);

    const ratePassword = async (password) => {
        // Check if user is logged in first
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to rate your password.');
            setStrength('');
            setMessage('');
            setFeedback([]);
            return;
        }

        if (password.length === 0) {
            setError('Please enter a password!');
            setStrength('');
            setMessage('');
            setFeedback([]);
            return;
        }

        setError('');
        setMessage('');
        setFeedback([]);

        let strengthScore = 0;
        let feedbackList = [];

        // Check password criteria
        if (password.length < 8) {
            strengthScore = 0;
            feedbackList.push('Password should be at least 8 characters long');
        } else {
            strengthScore += 1;
        }

        if (!/[A-Z]/.test(password)) {
            strengthScore = Math.min(strengthScore, 2);
            feedbackList.push('Add uppercase letters (A-Z)');
        } else {
            strengthScore += 2;
        }

        if (!/[a-z]/.test(password)) {
            strengthScore = Math.min(strengthScore, 4);
            feedbackList.push('Add lowercase letters (a-z)');
        } else {
            strengthScore += 1;
        }

        if (!/[0-9]/.test(password)) {
            strengthScore = Math.min(strengthScore, 6);
            feedbackList.push('Add numbers (0-9)');
        } else {
            strengthScore += 2;
        }

        if (!/[\W_]/.test(password)) {
            strengthScore = Math.min(strengthScore, 8);
            feedbackList.push('Add special characters (!@#$%^&*)');
        } else {
            strengthScore += 2;
        }

        // Assign strength based on score
        let strengthText = '';
        if (strengthScore <= 4) strengthText = 'Weak';
        else if (strengthScore <= 5) strengthText = 'Moderate';
        else if (strengthScore <= 6) strengthText = 'Strong';
        else strengthText = 'Very Strong';

        setStrength(strengthText);
        setFeedback(feedbackList);

        // If the password is very strong, send the API request
        if (strengthScore >= 8) {
            try {
                const response = await fetch('http://localhost:5000/rate-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        passwordStrength: 'very strong',
                    }),
                });

                if (!response.ok) {
                    const responseData = await response.json();
                    setError(responseData.error || 'An error occurred.');
                    return;
                }

                const responseData = await response.json();
                if (responseData.message) {
                    setMessage(responseData.message);
                }
            } catch (error) {
                setError('An error occurred. Please try again later.');
            }
        }
    };

    return (
        <div className="password-rater-content">
            <h2>Rate Your Password Strength</h2>
            <div className="rater-section">
                <div className="password-form">
                    <div className="input-group">
                        <label htmlFor="password">Enter your password:</label>
                        <Input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>
                    <Button onClick={() => ratePassword(password)}>Rate Password</Button>
                </div>
                
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}
                {strength && (
                    <div className="strength-indicator">
                        <p>Password Strength: <span className={`strength-${strength.toLowerCase().replace(' ', '-')}`}>{strength}</span></p>
                        <div className="strength-bar">
                            <div className={`strength-fill strength-${strength.toLowerCase().replace(' ', '-')}`}></div>
                        </div>
                        {feedback.length > 0 && (
                            <div className="feedback-section">
                                <h4>Suggestions to improve your password:</h4>
                                <ul>
                                    {feedback.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordRater;
