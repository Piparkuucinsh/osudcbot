// import { Events, GuildMember, Presence } from "discord.js";
// import { config } from "../config";
// import { EventModule } from "types";

// const presenceUpdateEvent: EventModule<Events.GuildMemberAdd> = {
//   name: Events.GuildMemberAdd,
//   once: false,
//   execute: (member: GuildMember) => {
//     try {
//       // console.log(newPresence);
//       if (!newPresence.guild) {
//         return;
//       }
//       if (newPresence.guild.id != config.server_id) {
//         return;
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   },
// };

// export default presenceUpdateEvent;
