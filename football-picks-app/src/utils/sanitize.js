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
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove potential script content and event handlers
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/on\w+\s*:/gi, '')
    // Remove SQL injection patterns
    .replace(/('|(\\')|(;)|(\-\-)|(\/\*)|(\*\/)|(\|)|(\*)|(\%)|(\_))/gi, '')
    // Remove potential command injection
    .replace(/[;&|`$(){}[\]\\]/g, '')
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

/**
 * Sanitizes input for safe HTML attribute values
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized attribute value
 */
export const sanitizeAttribute = (input) => {
  if (typeof input !== 'string') {
    return String(input || '');
  }

  return input
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove quotes and dangerous characters
    .replace(/["'`]/g, '')
    .replace(/[<>]/g, '')
    // Remove potential script content
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes input for safe URL usage
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized URL
 */
export const sanitizeUrl = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/file:/gi, '')
    // Remove potential script content
    .replace(/on\w+\s*=/gi, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes input for safe CSS usage
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized CSS
 */
export const sanitizeCss = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove dangerous CSS patterns
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/url\s*\(/gi, '')
    .replace(/@import/gi, '')
    // Remove potential script content
    .replace(/on\w+\s*=/gi, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes input for safe JSON usage
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized JSON string
 */
export const sanitizeJson = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Escape JSON special characters
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes input for safe SQL usage (parameterized queries only)
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized SQL string
 */
export const sanitizeSql = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove SQL injection patterns
    .replace(/('|(\\')|(;)|(\-\-)|(\/\*)|(\*\/)|(\|)|(\*)|(\%)|(\_))/gi, '')
    .replace(/[;&|`$(){}[\]\\]/g, '')
    // Remove potential command injection
    .replace(/[<>]/g, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes input for safe file system usage
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove dangerous file system characters
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./g, '')
    // Remove potential script content
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitizes input for safe HTML content (allows some HTML but removes dangerous elements)
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove dangerous HTML elements and attributes
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
    .replace(/<applet[^>]*>.*?<\/applet>/gi, '')
    .replace(/<form[^>]*>.*?<\/form>/gi, '')
    .replace(/<input[^>]*>/gi, '')
    .replace(/<textarea[^>]*>.*?<\/textarea>/gi, '')
    .replace(/<select[^>]*>.*?<\/select>/gi, '')
    .replace(/<button[^>]*>.*?<\/button>/gi, '')
    // Remove dangerous attributes
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*javascript\s*:/gi, '')
    .replace(/\s*vbscript\s*:/gi, '')
    .replace(/\s*data\s*:/gi, '')
    // Trim whitespace
    .trim();
};
