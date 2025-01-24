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
        //if password length is set to be under 8, send error message
        if (length < 8 || length > 20) {
            setError('A secure password length must be between 8 to 20 characters.');
            setPassword('');
            return; 
        }
        
        setError('');

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

        //Send API request to backend
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token found, please log in again.');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            //debug for decoded token structure
            //console.log('Decoded Token:', decodedToken);

            if (!decodedToken.userId) {
                setError('Invalid token. User ID missing.');
                return;
            }

            //for debugging
            //.log('User Id:', decodedToken.userId);
            
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
        } catch (error) {
            console.error('Error while posting:', error);
            setError('An error occurred. Please try again later.');
        }
    };

    return (
        <div>
            <h2>Generate a Secure Password</h2>
            <label htmlFor="PasswordLength">Desired Password Length: </label>
            <Input
                id="PasswordLength"
                type="number"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                min="8"
                max="20"
            />
            <Button onClick={generatePassword}>Generate Password</Button>
            {error && <p style={{ color: 'red'}}>{error}</p>}
            {password && (
                <p>
                    Generated Password:
                    <span style={{ fontWeight: "bold"}}>{'*'.repeat(password.length)}</span>
                    <Button onClick={() => alert(password)}>Show Password</Button>
                    <Button onClick={() => {
                        navigator.clipboard.writeText(password);
                        alert('Password copied to clipboard!');
                        setPassword(''); // Clear the password after copying
                    }}>Copy Password</Button>
                </p>
            )}

            {/* Disclaimer added here */}
            <p style={{ fontSize: '0.9rem', color: 'gray', marginTop: '20px' }}>
                ⚠️ <strong>Disclaimer:</strong> Please store your password securely. 
                Once copied, it will be cleared from the application for your security. 
                Ensure the password is saved in a secure location as it cannot be recovered later.
            </p>
        </div>
    );
};

export default GeneratePassword;