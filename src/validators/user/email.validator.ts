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
});
