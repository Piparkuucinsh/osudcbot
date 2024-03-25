import { REST, Routes, PermissionFlagsBits, Role } from "discord.js";
import fs from "fs";
import { config } from "./config";
import 'dotenv/config';

const BOT_TOKEN = process.env.BOT_TOKEN;
const SERVER_ID = config.bot_guild_id;

if (!BOT_TOKEN) {
    throw Error("no bot_token in env");
}
if (!SERVER_ID) {
    throw Error("no server_id in config");
}

interface RoleConfig {
    name: string;
    color: string;
    lower_bound?: number;
    upper_bound?: number;
    hoist?: boolean;
}

// Read roles from the JSON file
const roles: RoleConfig[] = JSON.parse(fs.readFileSync('roles.json', 'utf-8'));

// Construct an instance of the REST module
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

const createRoles = async () => {
    try {
        console.log(`Starting to create ${roles.length} roles.`);

        const existingRoles = await rest.get(Routes.guildRoles(SERVER_ID)) as Role[];

        for (const role of roles) {
            const colorInt = parseInt(role.color.replace('#', ''), 16);

            const matchingRoles = existingRoles.filter(r => r.name === role.name);

            for (const matchingRole of matchingRoles) {
                console.log(`Role ${role.name} already exists. Deleting it.`);
                await rest.delete(Routes.guildRole(SERVER_ID, matchingRole.id));
                console.log(`Deleted role: ${role.name}`);
            }

            const response = await rest.post(
                Routes.guildRoles(SERVER_ID),
                {
                    body: {
                        name: role.name,
                        color: colorInt,
                        hoist: role.hoist,
                        reason: 'Automated role creation',
                    }
                }
            );
            console.log(`Successfully created/updated role: ${(response as { name: string }).name}`);
        }
    } catch (error) {
        console.error('Error in role creation/update:', error);
    }
};

void createRoles();