// Security logging utilities
const logSuspiciousActivity = (req, activity, details = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    activity,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id || null,
    details
  };
  
  console.warn('SECURITY ALERT:', logData);
};

const logAdminAction = (req, action, details = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    action,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id || null,
    details
  };
  
  console.info('ADMIN ACTION:', logData);
};

const logXSSAttempt = (req, maliciousInput) => {
  logSuspiciousActivity(req, 'XSS_ATTEMPT', { input: maliciousInput });
};

const logFailedLogin = (req, email) => {
  logSuspiciousActivity(req, 'FAILED_LOGIN', { email });
};

const logSQLInjectionAttempt = (req, maliciousQuery) => {
  logSuspiciousActivity(req, 'SQL_INJECTION_ATTEMPT', { query: maliciousQuery });
};

const logCommandInjectionAttempt = (req, maliciousCommand) => {
  logSuspiciousActivity(req, 'COMMAND_INJECTION_ATTEMPT', { command: maliciousCommand });
};

const logRateLimitExceeded = (req, count) => {
  logSuspiciousActivity(req, 'RATE_LIMIT_EXCEEDED', { count });
};

module.exports = {
  logSuspiciousActivity,
  logAdminAction,
  logXSSAttempt,
  logFailedLogin,
  logSQLInjectionAttempt,
  logCommandInjectionAttempt,
  logRateLimitExceeded
};
