import { config } from "../config";
import { CommandModule } from "types";

import desa from "../commands/desa";
import updateUsers from "../commands/update_users";
import removeUsers from "../commands/remove_users";

const getCommandList = () => {
    let commands: CommandModule[] = [];

    if (config.desa) {
        commands = [...commands, desa];
    }

    commands = [...commands, updateUsers, removeUsers];

    return commands;
};

export default getCommandList;
