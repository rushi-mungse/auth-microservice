import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface ISendOtpData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface ISendOtpRequestData extends Request {
    body: ISendOtpData;
}

export interface IVerifyOtpData {
    fullName: string;
    email: string;
    hashOtp: string;
    otp: string;
}

export interface IVerifyOtpRequestData extends Request {
    body: IVerifyOtpData;
}

export interface IUserData {
    id?: number;
    fullName: string;
    email: string;
    password: string;
    role: string;
}

export type TPayload = JwtPayload & {
    userId: string;
    role: string;
    tokenId?: string;
};

export interface IAuthCookie {
    accessToken: string;
    refreshToken: string;
}

export interface IAuthRequest extends Request {
    auth: TPayload;
}

export interface ILoginData {
    email: string;
    password: string;
}

export interface ILoginRequest extends Request {
    body: ILoginData;
}

export interface IForgetPasswordRequest {
    body: {
        email: string;
    };
}

export interface ISetPasswordRequest {
    body: IVerifyOtpData & { password: string; confirmPassword: string };
}

export interface IUpdateFullNameRequest extends Request {
    body: {
        fullName: string;
    };
    auth: TPayload;
}

export interface IUploadProfilePictureRequest extends Request {
    auth: TPayload;
}

export interface IChangePasswordRequest extends Request {
    body: {
        oldPassword: string;
        newPassword: string;
    };
    auth: TPayload;
}
export interface ISendOtpForChangeEmailRequest extends Request {
    body: {
        email: string;
    };
    auth: TPayload;
}

export interface IVerifyOtpForChangeEmailRequest extends Request {
    body: IVerifyOtpData;
    auth: TPayload;
}

export interface ISendOtpForChangePhoneNumberRequest extends Request {
    body: {
        phoneNumber: string;
        countryCode: string;
    };
    auth: TPayload;
}

export interface IOtpInfoForPhoneNumber {
    phoneNumber: string;
    otp: string;
    hashOtp: string;
    fullName: string;
    countryCode: string;
}

export interface IVerifyOtpForChangePhoneNumberRequest extends Request {
    body: IOtpInfoForPhoneNumber;
    auth: TPayload;
}

export interface ISendOtpToUserRegister extends Request {
    body: {
        fullName: string;
        email: string;
        password: string;
        confirmPassword: string;
        role: "admin" | "customer" | "manager";
    };
}

export interface IVerifyOtpUserRegister extends Request {
    body: {
        fullName: string;
        email: string;
        hashOtp: string;
        otp: string;
        role: "admin" | "customer" | "manager";
    };
}
