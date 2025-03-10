import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import GeneratePassword from './pages/GeneratePassword';
import PasswordRater from './pages/PasswordRater';
import RegisterForm from './pages/Login';
import GuestProfile from './pages/GuestProfile';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ValidateCode from './pages/ValidateCode';
import ResetPassword from './pages/ResetPassword';
import './styles.css';
import Header from './components/Header';

function App() {
  return (
    <div>
      <Header/>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/generate-password" element={<GeneratePassword />} />
          <Route path="/rate-password" element={<PasswordRater />} />
          <Route path="/login" element={<RegisterForm/>} />
          <Route path="/guest-profile" element={<GuestProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/validate-code" element={<ValidateCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
