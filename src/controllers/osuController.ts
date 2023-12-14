import { auth } from "osu-api-extended";
import dotenv from 'dotenv';
import path from "path";

dotenv.config();

const ROOT_PATH = path.join(__dirname, '..');

class OsuController {
    public constructor() {
        // Initialize the singleton instance
    }

    public login(): void {
        try {
            const client_id: string = process.env.OSU_CLIENT_ID!;
            const secret_key: string = process.env.OSU_CLIENT_SECRET!;

            auth.login(Number(client_id), secret_key, ["public"])
            .then(() => {
                console.log("Successfully logged in to osu!");
            })
        } catch (error) {
            console.error("Failed to log in to osu:", error);
        }
    }
}

export let osuClient = new OsuController();