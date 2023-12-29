import { checkSchema } from "express-validator";
export default checkSchema({
    email: {
        trim: true,
        notEmpty: true,
        errorMessage: "Email is required!",
        isEmail: {
            errorMessage: "Email should be valid email!",
        },
    },

    hashOtp: {
        trim: true,
        notEmpty: true,
        errorMessage: "Invalid OTP entered!",
    },

    otp: {
        trim: true,
        notEmpty: true,
        errorMessage: "Otp is required!",
        isLength: {
            options: {
                min: 4,
                max: 4,
            },
        },
    },

    password: {
        trim: true,
        notEmpty: true,
        errorMessage: "Password is required!",
        isLength: {
            options: {
                min: 8,
            },
            errorMessage: "Password length should be at least 8 chars!",
        },
    },

    confirmPassword: {
        errorMessage: "Confirm password is required!",
        notEmpty: true,
    },
});
