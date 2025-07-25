const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'No se proporcionó un token' });
    }

    const tokenPart = token.split(' ')[1];
    
    jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
