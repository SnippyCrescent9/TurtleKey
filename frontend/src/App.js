import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import GeneratePassword from './pages/GeneratePassword';
import PasswordRater from './pages/PasswordRater';
import RegisterForm from './pages/Login';
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
        </Routes>
      </div>
    </div>
  );
}

export default App;
