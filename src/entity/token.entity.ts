import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
} from "typeorm";
import { User } from "./";

@Entity({ name: "tokens" })
export default class Token {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, {
        nullable: true,
        cascade: ["update", "remove"],
        onDelete: "SET NULL",
    })
    user: User;

    @Column({ type: "timestamp" })
    expiresAt: Date;

    @UpdateDateColumn()
    updatedAt: number;

    @CreateDateColumn()
    createdAt: number;
}
