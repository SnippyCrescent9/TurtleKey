import React, { useState } from 'react';
import Input from '../components/Inputs';
import Button from '../components/Buttons';

const PasswordRater = () => {
    const [password, setPassword] = useState('');
    const [strength, setStrength] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const ratePassword = async (password) => {
        if (password.length === 0) {
            setError('Please enter a password!');
            setStrength('');
            setMessage('');
            return;
        }

        setError('');
        setMessage('');

        let strengthScore = 0;

        // Check password criteria
        if (password.length < 8) strengthScore = 0;
        else strengthScore += 1;

        if (!/[A-Z]/.test(password)) strengthScore = Math.min(strengthScore, 2);
        else strengthScore += 2;

        if (!/[a-z]/.test(password)) strengthScore = Math.min(strengthScore, 4);
        else strengthScore += 1;

        if (!/[0-9]/.test(password)) strengthScore = Math.min(strengthScore, 6);
        else strengthScore += 2;

        if (!/[\W_]/.test(password)) strengthScore = Math.min(strengthScore, 8);
        else strengthScore += 2;

        // Assign strength based on score
        if (strengthScore <= 4) setStrength('Weak');
        else if (strengthScore <= 5) setStrength('Moderate');
        else if (strengthScore <= 6) setStrength('Strong');
        else setStrength('Very Strong');

        // If the password is very strong, send the API request
        if (strengthScore >= 8) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('No token found, please log in again.');
                    return;
                }

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
                    const responseData = await response.json();  // Parse as JSON
                    setError(responseData.error || 'An error occurred.');
                    return;
                }

                const responseData = await response.json();  // Parse as JSON
                setMessage(responseData.message);
            } catch (error) {
                setError('An error occurred. Please try again later.');
            }
        }
    };

    return (
        <div>
            <h2>Let's Rate Your Password!</h2>
            <label htmlFor="password">Password: </label>
            <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
            />
            <Button onClick={() => ratePassword(password)}>Rate Your Password</Button>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {strength && !error && <p>Password Strength: {strength}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
        </div>
    );
};

export default PasswordRater;
