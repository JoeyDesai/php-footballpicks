/**
 * Security utilities for backend input validation and sanitization
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return String(input || '');
  }

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes email addresses (no format validation)
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  return sanitizeString(email);
};

/**
 * Validates and sanitizes numeric input
 * @param {any} input - Input to validate and sanitize
 * @param {number} defaultValue - Default value if input is invalid
 * @returns {number} - Sanitized number
 */
const sanitizeNumber = (input, defaultValue = 0) => {
  const num = Number(input);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Validates and sanitizes integer input
 * @param {any} input - Input to validate and sanitize
 * @param {number} defaultValue - Default value if input is invalid
 * @returns {number} - Sanitized integer
 */
const sanitizeInteger = (input, defaultValue = 0) => {
  const num = parseInt(input, 10);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Validates that a value is a positive integer
 * @param {any} input - Input to validate
 * @param {number} defaultValue - Default value if input is invalid
 * @returns {number} - Validated positive integer
 */
const validatePositiveInteger = (input, defaultValue = 0) => {
  const num = sanitizeInteger(input, defaultValue);
  return num >= 0 ? num : defaultValue;
};

/**
 * Validates that a value is within a specific range
 * @param {any} input - Input to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} defaultValue - Default value if input is invalid
 * @returns {number} - Validated number within range
 */
const validateRange = (input, min, max, defaultValue = min) => {
  const num = sanitizeNumber(input, defaultValue);
  return Math.max(min, Math.min(max, num));
};

/**
 * Sanitizes form data before processing
 * @param {Object} formData - Form data to sanitize
 * @returns {Object} - Sanitized form data
 */
const sanitizeFormData = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return {};
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Validates login credentials
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Object} - Validation result with sanitized data
 */
const validateLoginCredentials = (email, password) => {
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedPassword = sanitizeString(password);

  if (!sanitizedEmail || sanitizedEmail.length < 1) {
    return { valid: false, error: 'Email is required' };
  }

  if (!sanitizedPassword || sanitizedPassword.length < 1) {
    return { valid: false, error: 'Password is required' };
  }

  return {
    valid: true,
    data: {
      email: sanitizedEmail,
      password: sanitizedPassword
    }
  };
};

/**
 * Validates user registration data
 * @param {Object} userData - User registration data
 * @returns {Object} - Validation result with sanitized data
 */
const validateUserRegistration = (userData) => {
  const { email, realName, nickName, password, sitePassword } = userData;

  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedRealName = sanitizeString(realName);
  const sanitizedNickName = sanitizeString(nickName);
  const sanitizedPassword = sanitizeString(password);
  const sanitizedSitePassword = sanitizeString(sitePassword);

  if (!sanitizedEmail || sanitizedEmail.length < 1) {
    return { valid: false, error: 'Email is required' };
  }

  if (!sanitizedRealName || sanitizedRealName.length < 1) {
    return { valid: false, error: 'Real name is required' };
  }

  if (!sanitizedNickName || sanitizedNickName.length < 1) {
    return { valid: false, error: 'Nickname is required' };
  }

  if (!sanitizedPassword || sanitizedPassword.length < 1) {
    return { valid: false, error: 'Password is required' };
  }

  if (!sanitizedSitePassword || sanitizedSitePassword.length < 1) {
    return { valid: false, error: 'Site password is required' };
  }

  return {
    valid: true,
    data: {
      email: sanitizedEmail,
      realName: sanitizedRealName,
      nickName: sanitizedNickName,
      password: sanitizedPassword,
      sitePassword: sanitizedSitePassword
    }
  };
};

/**
 * Validates picks data
 * @param {Object} picks - Picks data to validate
 * @param {Array} gameIds - Valid game IDs
 * @returns {Object} - Validation result
 */
const validatePicksData = (picks, gameIds) => {
  if (!picks || typeof picks !== 'object') {
    return { valid: false, error: 'Invalid picks data' };
  }

  const usedValues = new Set();
  const errors = [];

  for (const gameId of gameIds) {
    const pick = picks[`GAME${gameId}`];
    const value = picks[`VAL${gameId}`];

    if (!pick) {
      errors.push(`Missing pick for game ${gameId}`);
    }

    if (!value || value === 0) {
      errors.push(`Missing value for game ${gameId}`);
    } else {
      const sanitizedValue = sanitizeInteger(value);
      if (sanitizedValue < 1 || sanitizedValue > gameIds.length) {
        errors.push(`Invalid value ${value} for game ${gameId}`);
      } else if (usedValues.has(sanitizedValue)) {
        errors.push(`Value ${sanitizedValue} used multiple times`);
      } else {
        usedValues.add(sanitizedValue);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('. ') };
  }

  return { valid: true };
};

/**
 * Rate limiting helper
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [key, data] of requests.entries()) {
      if (data.timestamp < windowStart) {
        requests.delete(key);
      }
    }

    // Check current IP
    const ipData = requests.get(ip);
    if (!ipData) {
      requests.set(ip, { count: 1, timestamp: now });
      return next();
    }

    if (ipData.count >= maxRequests) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many requests. Please try again later.' 
      });
    }

    ipData.count++;
    next();
  };
};

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeInteger,
  validatePositiveInteger,
  validateRange,
  sanitizeFormData,
  validateLoginCredentials,
  validateUserRegistration,
  validatePicksData,
  rateLimit
};
