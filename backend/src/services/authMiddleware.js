const { auth, db } = require('./firebase.js');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    console.log('Received token length:', token?.length);

    // Verify the Firebase ID token
    const decoded = await auth.verifyIdToken(token);

    // Fetch role from Firestore 
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const userData = userDoc.data();

    req.user = {
      ...decoded,
      role: userData?.role || null,
      name: userData?.name || '',
      email: userData?.email || decoded.email,
    };

    console.log('Authenticated user:', req.user.uid, '| Role:', req.user.role);

    next();
  } catch (error) {
    console.error('Token verification error:', error.code, error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
  }

  //Case-insensitive role check
  const userRole = req.user.role?.toLowerCase();
  const allowedRoles = roles.map(r => r.toLowerCase());

  if (!userRole || !allowedRoles.includes(userRole)) {
    console.warn(`Forbidden: User role '${userRole}' not in [${allowedRoles.join(', ')}]`);
    return res.status(403).json({ error: 'Forbidden: Insufficient role' });
  }

  next();
};

module.exports = { verifyToken, requireRole };