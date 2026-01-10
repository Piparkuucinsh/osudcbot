<h1 align="center">Lāčplēsis</h1>
<h4 align="center">A bot for the <a href="https://discord.com/invite/2xVdx5Q">osu!Latvia Discord server</a></h4>

## Features

- automatically link osu! accounts to discord accounts with Discord rich presence
- assign discord roles corresponding to osu! country ranks
- post new top scores (personal bests)
- admin utilities for managing users/roles
- join/leave/ban/unban notifications

## Setup

1. Clone the repository
2. Install Bun: https://bun.sh
3. Install dependencies:
    - `bun install`
4. Create `.env` with:
    - `BOT_TOKEN`
    - `CLIENT_ID`
    - `OSU_CLIENT_ID`
    - `OSU_CLIENT_SECRET`
    - `DATABASE_URL` (or `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)
5. Create `config.json` from `config_example.json`
6. Register commands:
    - `bun src/register_commands.ts`
7. Run the bot:
    - `bun dev`
