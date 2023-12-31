import { checkSchema } from "express-validator";
export default checkSchema({
    fullName: {
        trim: true,
        notEmpty: true,
        errorMessage: "Full name is required!",
    },

    countryCode: {
        trim: true,
        notEmpty: true,
        errorMessage: "country code is required",
        isLength: {
            options: {
                min: 2,
                max: 2,
            },
        },
    },

    phoneNumber: {
        trim: true,
        notEmpty: true,
        errorMessage: "phone number is required!",
        isLength: {
            options: {
                min: 10,
                max: 10,
            },
            errorMessage: "phone number should be 10 digits!",
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
