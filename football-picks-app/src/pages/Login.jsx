import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card glass-container">
        <div className="login-header">
          <Target className="login-icon" />
          <h1>Football Picks</h1>
          <p>Sign in to your account</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
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

          <button
            type="submit"
            className="glass-button primary w-full"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account?</p>
          <Link to="/create-account" className="glass-button secondary">
            Create Account
          </Link>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        .login-header {
          margin-bottom: 2rem;
        }

        .login-icon {
          color: rgba(100, 150, 255, 1);
          margin-bottom: 1rem;
          width: 48px;
          height: 48px;
        }

        .login-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: white;
        }

        .login-header p {
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

        .login-form {
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

        .login-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.5rem;
        }

        .login-footer p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}

export default Login;