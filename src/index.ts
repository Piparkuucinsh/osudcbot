import "dotenv/config";
import { init_dc_client } from "init/init_dc_client";
import { osu_login } from "init/init_osu_client";


osu_login()
export const client = init_dc_client()

