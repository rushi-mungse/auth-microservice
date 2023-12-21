import { User } from "../entity";
import { Repository } from "typeorm";
import { IUserData } from "../types";

class UserService {
    constructor(private userRepository: Repository<User>) {}

    /* find user by email */
    async findUserByEmail(email: string) {
        return await this.userRepository.findOne({ where: { email } });
    }

    /* create user */
    async saveUser(userData: IUserData) {
        return await this.userRepository.save(userData);
    }
}

export default UserService;
