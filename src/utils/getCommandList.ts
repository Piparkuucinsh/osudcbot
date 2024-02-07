import { config } from "config";
import { CommandModule } from "types";

import desa from "../commands/desa";

const getCommandList = () => {
  let commands: CommandModule[] = [];

  if (config.desa) {
    commands = [...commands, desa];
  }

  return commands;
};

export default getCommandList;
