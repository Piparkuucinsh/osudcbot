import { config } from "../config";
import { prisma } from "../lib/prisma";

const joinedDate = new Date();

await prisma.discordUser.create({
    data: {
        id: BigInt(member.id),
        username: member.user.tag, // Discord tag includes the username and discriminator
        registration_date: joinedDate, // When they joined the server
        last_activity_date: new Date(), // Set to current date-time for now
        deleted: false // Assuming the user is not deleted when they're being added
    }
});