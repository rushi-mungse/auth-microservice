import { checkSchema } from "express-validator";
export default checkSchema({
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
});
