import React, {useState} from 'react';
import Input from '../components/Inputs';
import Button from '../components/Buttons';
import MissingCriteria from '../components/MissingCriteria';


const PasswordRater = () => {

  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState('');
  const [error, setError] = useState('');
  const [missingCriteria, setMissingCriteria] = useState([]);

  const ratePassword = (password) => {
    if (password.length === 0) {
      setError('Please enter a password!');
      setStrength('');
      setMissingCriteria([]);
      return;
    }

    setError('');
    setMissingCriteria([]);
    
    let strength = 0;
    let missing = [];
  
    if (password.length < 8) {
      missing.push('at least 8 characters');
    } else {
      strength += 1;
    }

    if (!/[A-Z]/.test(password)) {
      missing.push('an uppercase letter');
    } else {
      strength += 2;
    }

    if (!/[a-z]/.test(password)){
      missing.push('a lowercase letter');
    } else {
      strength += 1;
    }

    if (!/[0-9]/.test(password)){
      missing.push('a number');
    } else {
      strength += 2;
    }
    if (!/[\W_]/.test(password)){
      missing.push('a special character')
    } else {
      strength += 2;
    }

    if (strength <= 4) setStrength('Weak');
    else if (strength ===5) setStrength('Moderate');
    else if (strength ===6) setStrength('Strong');
    else if (strength ===8) setStrength('Very Strong');

    if (missing.length > 0) {
      setMissingCriteria(missing);
    }

    setPassword('');
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
        {error && <p style={{ color: 'red'}}>{error}</p>}
        {strength && !error && <p>Password Strength: {strength}</p>}
        <MissingCriteria criteria={missingCriteria}/>
      </div>
    );
  };
  
  export default PasswordRater;