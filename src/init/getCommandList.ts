import check from "@/commands/check";
import deleteMessages from "@/commands/delete";
import desa from "@/commands/desa";
import pervert from "@/commands/pervert";
import purgeRoles from "@/commands/purge_roles";
import updateUsers from "@/commands/update_users";
import type { CommandModule } from "@/types";

const getCommandList = () => {
	let commands: CommandModule[] = [];

	commands = [desa, check, pervert, updateUsers, purgeRoles, deleteMessages];
	// Additional commands are added in later implementation stages.
	return commands;
};

export default getCommandList;
