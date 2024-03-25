import { auth } from "osu-api-extended";
import { v2 } from "../node_modules/osu-api-extended/dist/index";
import 'dotenv/config';

const CLIENT_ID = process.env.OSU_CLIENT_ID;
const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;


// Define a function to retrieve a player's performance points
async function getPlayerPP(username: string) {
    await auth.login(Number(CLIENT_ID), CLIENT_SECRET!, ["public"]);
    try {
        const user = await v2.user.details(username, "osu");
        console.log(user);
        if (user) {
            console.log(`Player ${username} has ${user} performance points.`);
        } else {
            console.log(`Player ${username} not found.`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example usage: Get performance points for a player
getPlayerPP('mrekk');
