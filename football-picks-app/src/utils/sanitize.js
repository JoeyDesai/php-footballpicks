/**
 * Security utilities for sanitizing user input and preventing XSS attacks
 */

/**
 * Sanitizes a string by removing or escaping potentially dangerous HTML/script content
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return String(input || '');
  }

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove potential script content
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes an object by recursively sanitizing all string values
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - The sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitizes user data specifically for display in React components
 * @param {string|Object} userData - User data to sanitize
 * @returns {string|Object} - Sanitized user data
 */
export const sanitizeUserData = (userData) => {
  if (typeof userData === 'string') {
    return sanitizeString(userData);
  }

  if (userData && typeof userData === 'object') {
    // Sanitize common user data fields
    const sanitized = { ...userData };
    
    if (sanitized.nickname) {
      sanitized.nickname = sanitizeString(sanitized.nickname);
    }
    if (sanitized.realName) {
      sanitized.realName = sanitizeString(sanitized.realName);
    }
    if (sanitized.email) {
      sanitized.email = sanitizeString(sanitized.email);
    }
    if (sanitized.name) {
      sanitized.name = sanitizeString(sanitized.name);
    }
    
    return sanitized;
  }

  return userData;
};

/**
 * Sanitizes email addresses (no format validation)
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
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
export const sanitizeNumber = (input, defaultValue = 0) => {
  const num = Number(input);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Validates and sanitizes integer input
 * @param {any} input - Input to validate and sanitize
 * @param {number} defaultValue - Default value if input is invalid
 * @returns {number} - Sanitized integer
 */
export const sanitizeInteger = (input, defaultValue = 0) => {
  const num = parseInt(input, 10);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Sanitizes form data before submission
 * @param {Object} formData - Form data to sanitize
 * @returns {Object} - Sanitized form data
 */
export const sanitizeFormData = (formData) => {
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
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
};

/**
 * Creates a safe display name from user data
 * @param {Object} user - User object
 * @returns {string} - Safe display name
 */
export const getSafeDisplayName = (user) => {
  if (!user) return 'Unknown User';
  
  const nickname = user.nickname ? sanitizeString(user.nickname) : '';
  const realName = user.realName ? sanitizeString(user.realName) : '';
  const name = user.name ? sanitizeString(user.name) : '';
  
  return nickname || realName || name || 'Unknown User';
};
