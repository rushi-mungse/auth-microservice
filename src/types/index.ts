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
