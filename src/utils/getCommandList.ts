import { config } from "../config";
import { CommandModule } from "types";

import desa from "../commands/desa";
import updateUsers from "../commands/update_users";

const getCommandList = () => {
    let commands: CommandModule[] = [];

    if (config.desa) {
        commands = [...commands, desa];
    }

    commands = [...commands, updateUsers];

    return commands;
};

export default getCommandList;
