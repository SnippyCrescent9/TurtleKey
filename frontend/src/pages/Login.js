import React, { useState } from 'react';
import Input from '../components/Inputs';
import Button from '../components/Buttons';

const UserAuthForm = () => {
    const [isRegistering, setIsRegistering] = useState(true); // Toggle between login and register
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState(null);

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
                if (!isRegistering) {
                    // Handle login success
                    const { token } = data;
                    setToken(token);
                    localStorage.setItem('token', token); // Store token for later use
                    //for debugging....
                    //console.log('Token stored in state:', token); // Debug state token
                    //console.log('Token stored in localStorage:', localStorage.getItem('token')); // Debug localStorage token
                    
                    alert('Login successful! Token stored.');
                } else {
                    alert(`Success: ${data.message}`);
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

    return (
        <div>
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
        </div>
    );
};

export default UserAuthForm;