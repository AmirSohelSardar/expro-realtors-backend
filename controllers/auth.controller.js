import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import crypto from 'crypto';




//Register

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isApproved: role === "seller" ? false : true,
            verificationToken
        });

        try {
            await sendEmail({
                email,
                subject: "Email Verification- Real Estate platform",
                message: `<p>Your verification code is: <strong>${verificationToken}</strong></p><p>Please use this code to verify your email address.</p>`
            });
        } catch (emailError) {
            console.error("Error sending verification email:", emailError.message);
        }

        res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email for verification.",
            user: {
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//login
export const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }  
        
        if (!user.isVerified) {
    return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in"
    });
}
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }
        if(user.isBlocked){
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked, please contact support for assistance"
            });
        }
        //token

        const token = jwt.sign({id: user._id,role:user.role},process.env.JWT_SECRET, { expiresIn: "30d" })
          
       const userObj = user.toObject();
delete userObj.password;
res.json({ message: "Login successful", token, user: userObj });





    }

    catch(err){
        res.status(500).json({
            message:err.message
        });

    }

}

//to get profile
export const getMe = async(req,res)=>{
    try{
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.json({
            success: true,
            user,
        });
    }

     catch(err){
        res.status(500).json({
            message:err.message
        });

    }
}

//verify the email

export const verifyEmail = async (req,res)=>{
    try{
        const {email, code} = req.body;
        if(!email|| !code){
            return res.status(400).json({message: "Email and code are required"})

        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        if(user.isVerified){
            return res.status(400).json({message: "Email already verified"})
        }

        if(user.verificationToken !==code){
            return res.status(400).json({message: "Invalid verification code"})
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        res.status(200).json({
            message: "Email verified successfully",
            success: true
        });
    }

    catch(err){
        res.status(500).json({
            message:err.message,
            success: false
        });

    }
}

// Forgot Password — sends a 6-digit OTP code by email
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No user found with that email address" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = otp;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
        await user.save();

        const message = `
            <h2>Password Reset Request</h2>
            <p>Your password reset code is: <strong>${otp}</strong></p>
            <p>This code will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset Code - Real Estate Platform",
                message,
            });
            res.status(200).json({ message: "Password reset code sent to your email", success: true });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Could not send email", success: false });
        }
    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
};

//now reset the password using the OTP code

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            return res.status(400).json({ message: "Email, code and new password are required" });
        }

        const user = await User.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        res.status(200).json({
            message: "Password updated successfully",
            success: true
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
}