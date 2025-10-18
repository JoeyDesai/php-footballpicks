import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Mail, Lock, User, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function CreateAccount() {
  const [formData, setFormData] = useState({
    email: '',
    realName: '',
    nickName: '',
    password: '',
    confirmPassword: '',
    sitePassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { createAccount } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await createAccount(formData);
    
    if (result.success) {
      setSuccess('Account created successfully! Please log in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="create-account-container">
      <div className="create-account-card glass-container">
        <div className="create-account-header">
          <Target className="create-account-icon" />
          <h1>Create Account</h1>
          <p>Join the Football Picks community</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-account-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="realName">Real Name</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                id="realName"
                name="realName"
                value={formData.realName}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter your real name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nickName">Nick Name</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                id="nickName"
                name="nickName"
                value={formData.nickName}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter your nickname"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="glass-input"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sitePassword">Site Password</label>
            <div className="input-wrapper">
              <Key className="input-icon" />
              <input
                type="password"
                id="sitePassword"
                name="sitePassword"
                value={formData.sitePassword}
                onChange={handleChange}
                className="glass-input"
                placeholder="Enter the site password"
                required
              />
            </div>
            <small className="form-help">
              You need the site password to create an account
            </small>
          </div>

          <button
            type="submit"
            className="glass-button primary w-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="create-account-footer">
          <p>Already have an account?</p>
          <Link to="/login" className="glass-button secondary">
            Sign In
          </Link>
        </div>
      </div>

      <style jsx="true">{`
        .create-account-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .create-account-card {
          width: 100%;
          max-width: 500px;
          text-align: center;
        }

        .create-account-header {
          margin-bottom: 2rem;
        }

        .create-account-icon {
          color: rgba(100, 150, 255, 1);
          margin-bottom: 1rem;
          width: 48px;
          height: 48px;
        }

        .create-account-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: white;
        }

        .create-account-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 100, 100, 0.2);
          border: 1px solid rgba(255, 100, 100, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          color: rgba(255, 150, 150, 1);
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(100, 255, 100, 0.2);
          border: 1px solid rgba(100, 255, 100, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          color: rgba(150, 255, 150, 1);
        }

        .create-account-form {
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.5);
          width: 20px;
          height: 20px;
        }

        .input-wrapper .glass-input {
          padding-left: 3rem;
        }

        .form-help {
          display: block;
          margin-top: 0.5rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .create-account-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.5rem;
        }

        .create-account-footer p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}

export default CreateAccount;