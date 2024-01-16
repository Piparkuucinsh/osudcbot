import { auth } from 'osu-api-extended';
import dotenv from 'dotenv';

dotenv.config();

export const osu_login = () => {
    const client_id: string = process.env.OSU_CLIENT_ID!;
    const secret_key: string = process.env.OSU_CLIENT_SECRET!;

    auth.login(Number(client_id), secret_key, ["public"])
    console.log("Successfully logged in to osu!");
}
