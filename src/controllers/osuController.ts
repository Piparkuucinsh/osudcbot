import { auth } from "osu-api-extended";
import dotenv from 'dotenv';

dotenv.config();

export default class OsuController {
    private static instance: OsuController;

    private constructor() {
        // Initialize the singleton instance
    }

    public static getInstance(): OsuController {
        if (!OsuController.instance) {
            OsuController.instance = new OsuController();
        }

        return OsuController.instance;
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
