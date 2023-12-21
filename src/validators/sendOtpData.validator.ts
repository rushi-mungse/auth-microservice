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
