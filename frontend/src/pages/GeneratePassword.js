import React, {useState} from 'react';
import Button from '../components/Buttons';
import Input from '../components/Inputs';
import { jwtDecode } from 'jwt-decode';

const GeneratePassword = () => {
    //usestates for password, length, and error
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(12);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const generatePassword = async () => {
        // Check for token first
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to generate a password.');
            setPassword('');
            setMessage('');
            return;
        }

        if (length < 8 || length > 20) {
            setError('Password length must be between 8 and 20 characters');
            setPassword('');
            setMessage('');
            return;
        }

        setError('');
        setMessage('Password generated successfully!');

        //generate a strong password
        const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
        const specialCharacters = '!@#$%^&*()';
        const numbers = '0123456789';
        const allLists = [upperCase, lowerCase, specialCharacters, numbers];
        
        let generatedPassword = '';
   
        generatedPassword += upperCase[crypto.getRandomValues(new Uint32Array(1))[0] % upperCase.length];
        generatedPassword += lowerCase[crypto.getRandomValues(new Uint32Array(1))[0] % lowerCase.length];
        generatedPassword += specialCharacters[crypto.getRandomValues(new Uint32Array(1))[0] % specialCharacters.length];
        generatedPassword += numbers[crypto.getRandomValues(new Uint32Array(1))[0] % numbers.length];
        
        for (let i = 4; i < length; i++) {
            const randomListIndex = crypto.getRandomValues(new Uint32Array(1))[0] % allLists.length;
            const randomChar = allLists[randomListIndex][crypto.getRandomValues(new Uint32Array(1))[0] % allLists[randomListIndex].length];
            generatedPassword += randomChar;
        }

        // Shuffle the generated password securely
        const passwordArray = generatedPassword.split('');
        for (let i = passwordArray.length - 1; i > 0; i--) {
            const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
            [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
        }

        setPassword(passwordArray.join(''));

        //for debugging
        //console.log(localStorage.getItem('token'));

        try {
            const decodedToken = jwtDecode(token);

            if (!decodedToken.userId) {
                setError('Invalid token. User ID missing.');
                return;
            }
            
            const response = await fetch('http://localhost:5000/generate-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: decodedToken.userId,
                    passwordStrength: 'very strong',
                }),
            });
            
            if (!response.ok) {
                const errorMessage = await response.text();
                setError(errorMessage); // Display error to user
                return;
            }
        
            const successMessage = await response.text();
            console.log('Success:', successMessage); // Debug or display a success toast
            setMessage(successMessage);
        } catch (error) {
            console.error('Error while posting:', error);
            setError('An error occurred. Please try again later.');
        }
    };

    return (
        <div className="generate-password-content">
            <h2>Generate a Secure Password</h2>
            <div className="password-section">
                <div className="password-form">
                    <div className="input-group">
                        <label htmlFor="PasswordLength">Desired Password Length: </label>
                        <Input
                            id="PasswordLength"
                            type="number"
                            value={length}
                            onChange={(e) => setLength(Number(e.target.value))}
                            min="8"
                            max="20"
                        />
                    </div>
                    <Button onClick={generatePassword}>Generate Password</Button>
                </div>
                
                {error && <p className="error-message">{error}</p>}
                {password && (
                    <div className="password-result">
                        <p>Generated Password: 
                            <span className="password-mask">{'*'.repeat(password.length)}</span>
                        </p>
                        <div className="button-group">
                            <Button onClick={() => alert(password)}>Show Password</Button>
                            <Button onClick={() => {
                                navigator.clipboard.writeText(password);
                                alert('Password copied to clipboard!');
                                setPassword('');
                            }}>Copy Password</Button>
                        </div>
                    </div>
                )}
                {message && <p className="success-message">{message}</p>}
            </div>

            <div className="disclaimer-section">
                <p>⚠️ <strong>Disclaimer:</strong> Please store your password securely. 
                Once copied, it will be cleared from the application for your security. 
                Ensure the password is saved in a secure location as it cannot be recovered later.</p>
            </div>
        </div>
    );
};

export default GeneratePassword;