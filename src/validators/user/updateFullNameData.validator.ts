import { checkSchema } from "express-validator";
export default checkSchema({
    fullName: {
        trim: true,
        notEmpty: true,
        errorMessage: "fullName is required!",
    },
});
