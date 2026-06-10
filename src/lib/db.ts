import { Pool, type PoolClient } from "pg";

const EXPECTED_COLUMNS: Record<string, string> = {
	discord_id: "bigint",
	osu_id: "integer",
	last_checked: "text",
};

const CREATE_PLAYERS_TABLE = `
CREATE TABLE IF NOT EXISTS players (
    discord_id BIGINT PRIMARY KEY,
    osu_id INTEGER,
    last_checked TEXT
);
`;

let pool: Pool | null = null;

function buildDatabaseUrl(): string {
	if (process.env.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}

	const user = process.env.POSTGRES_USER;
	const password = process.env.POSTGRES_PASSWORD;
	const database = process.env.POSTGRES_DB;

	if (!user || !password || !database) {
		throw new Error(
			"DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB must be set",
		);
	}

	return `postgresql://${user}:${password}@db:5432/${database}`;
}

export const initDb = async (): Promise<Pool> => {
	if (pool) return pool;

	pool = new Pool({
		connectionString: buildDatabaseUrl(),
		ssl:
			process.env.PGSSLMODE === "disable"
				? false
				: { rejectUnauthorized: false },
	});

	await ensurePlayersTable(pool);
	return pool;
};

export const getDb = (): Pool => {
	if (!pool) {
		throw new Error("Database pool not initialized");
	}
	return pool;
};

export const closeDb = async (): Promise<void> => {
	if (pool) {
		await pool.end();
		pool = null;
	}
};

const ensurePlayersTable = async (db: Pool): Promise<void> => {
	const client = await db.connect();
	try {
		await client.query(CREATE_PLAYERS_TABLE);
		await verifyPlayersTable(client);
	} finally {
		client.release();
	}
};

const verifyPlayersTable = async (client: PoolClient): Promise<void> => {
	const { rows } = await client.query<{
		column_name: string;
		data_type: string;
	}>(
		`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'players' AND table_schema = 'public';
        `,
	);

	if (rows.length === 0) {
		throw new Error(
			"players table does not exist in schema 'public' after creation attempt",
		);
	}

	const existing = new Map(
		rows.map((row: { column_name: string; data_type: string }) => [
			row.column_name,
			row.data_type,
		]),
	);
	const mismatches: string[] = [];

	for (const [col, expectedType] of Object.entries(EXPECTED_COLUMNS)) {
		const actual = existing.get(col);
		if (!actual) {
			mismatches.push(`missing column: ${col}`);
			continue;
		}
		if (actual !== expectedType) {
			mismatches.push(
				`column ${col} has type ${actual}, expected ${expectedType}`,
			);
		}
	}

	if (mismatches.length > 0) {
		throw new Error(
			`players table schema mismatch:\n${mismatches.join(
				"\n",
			)}\nRefusing to continue to avoid data corruption.`,
		);
	}
};

export const getPlayer = async (
	discordId: string,
): Promise<PlayerRow | null> => {
	const { rows } = await getDb().query<PlayerRow>(
		"SELECT discord_id, osu_id, last_checked FROM players WHERE discord_id = $1",
		[discordId],
	);
	return rows[0] ?? null;
};

export const getPlayerByOsuId = async (
	osuId: number,
): Promise<PlayerRow | null> => {
	const { rows } = await getDb().query<PlayerRow>(
		"SELECT discord_id, osu_id, last_checked FROM players WHERE osu_id = $1",
		[osuId],
	);
	return rows[0] ?? null;
};

export const createPlayer = async (discordId: string): Promise<void> => {
	await getDb().query(
		"INSERT INTO players (discord_id) VALUES ($1) ON CONFLICT (discord_id) DO NOTHING",
		[discordId],
	);
};

export const setPlayerOsuId = async (
	discordId: string,
	osuId: number,
): Promise<void> => {
	await getDb().query("UPDATE players SET osu_id = $1 WHERE discord_id = $2", [
		osuId,
		discordId,
	]);
};

export const clearPlayerOsuId = async (discordId: string): Promise<void> => {
	await getDb().query(
		"UPDATE players SET osu_id = NULL WHERE discord_id = $1",
		[discordId],
	);
};

export const listLinkedPlayers = async (): Promise<
	Array<{ discord_id: string; osu_id: number; last_checked: string | null }>
> => {
	const { rows } = await getDb().query<{
		discord_id: string;
		osu_id: number;
		last_checked: string | null;
	}>(
		"SELECT discord_id, osu_id, last_checked FROM players WHERE osu_id IS NOT NULL",
	);
	return rows;
};

export const setLastChecked = async (
	discordId: string,
	value: string,
): Promise<void> => {
	await getDb().query(
		"UPDATE players SET last_checked = $1 WHERE discord_id = $2",
		[value, discordId],
	);
};

export const listAllPlayers = async (): Promise<string[]> => {
	const { rows } = await getDb().query<{ discord_id: string }>(
		"SELECT discord_id FROM players",
	);
	return rows.map((row) => row.discord_id);
};

export type PlayerRow = {
	discord_id: string;
	osu_id: number | null;
	last_checked: string | null;
};
