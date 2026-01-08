import { CommandModule } from '@/types'
import desa from '@/commands/desa'
import check from '@/commands/check'
import pervert from '@/commands/pervert'
import updateUsers from '@/commands/update_users'
import purgeRoles from '@/commands/purge_roles'
import deleteMessages from '@/commands/delete'

const getCommandList = () => {
    let commands: CommandModule[] = []

    commands = [desa, check, pervert, updateUsers, purgeRoles, deleteMessages]
    // Additional commands are added in later implementation stages.
    return commands
}

export default getCommandList
