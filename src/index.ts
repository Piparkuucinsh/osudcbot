import "dotenv/config";
import { init_dc_client } from "./init/init_dc_client";
import { osu_login } from "./init/init_osu_client";
import { Client } from "discord.js";

osu_login()
    .then()
    .catch((err) => {
        throw err;
    });
export let client: Client;
init_dc_client()
    .then((cl) => {
        client = cl;
    })
    .catch((err) => {
        throw err;
    });
