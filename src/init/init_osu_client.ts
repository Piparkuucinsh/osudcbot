import { auth } from "osu-api-extended";
import dotenv from "dotenv";

dotenv.config();

export const osu_login = async () => {
  const client_id: string = process.env.OSU_CLIENT_ID!;
  const secret_key: string = process.env.OSU_CLIENT_SECRET!;

  await auth.login(Number(client_id), secret_key, ["public"]);
  console.log("osu! client logged in");
};
