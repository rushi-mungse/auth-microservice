import { checkSchema } from "express-validator";
export default checkSchema({
    fullName: {
        trim: true,
        notEmpty: true,
        errorMessage: "Full name is required!",
    },

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
});
