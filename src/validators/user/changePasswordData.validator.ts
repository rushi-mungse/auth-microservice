import { checkSchema } from "express-validator";
export default checkSchema({
    newPassword: {
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

    oldPassword: {
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
});
