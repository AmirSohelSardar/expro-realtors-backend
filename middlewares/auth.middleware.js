import jwt from  'jsonwebtoken';
import User from '../models/user.model.js';

//protect

export const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);

req.user = await User.findById(decoded.id).select("-password");

// Check if user exists
if (!req.user) {
    return res.status(401).json({
        success: false,
        message: "User not found"
    });
}

// Check if blocked
if (req.user.isBlocked) {
    return res.status(403).json({
        success: false,
        message: "Your account has been blocked by an admin"
    });
}

next();
    } catch (error) {
        res.status(401).json({success:false, 
             message: "Not authorized" });
    }
}


//rolebased authentication 
export const authorize = (...roles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied, you don't have permission"
            });
        }

        next();
    };
};




