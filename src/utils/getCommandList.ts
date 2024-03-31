import { config } from "../config";
import { CommandModule } from "types";

import desa from "../commands/desa";
import updateUsers from "../commands/update_users";
import removeUsers from "../commands/remove_users";
import viewUser from "../commands/view_user";
import compareUsers from "../commands/compare_users";
import leaderboard from "../commands/leaderboard";
import popular_maps from "../commands/popular_maps";
import top_achievement from "../commands/top_achievement";

const getCommandList = () => {
    let commands: CommandModule[] = [];

    if (config.desa) {
        commands = [...commands, desa];
    }

    commands = [...commands, updateUsers, removeUsers, viewUser, compareUsers, leaderboard, popular_maps, top_achievement];

    return commands;
};

export default getCommandList;
