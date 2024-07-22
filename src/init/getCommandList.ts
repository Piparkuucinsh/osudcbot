import { config } from '@/config.ts'
import type { CommandModule } from '@/types.d.ts'

import desa from '@/commands/desa.ts'

const getCommandList = () => {
    let commands: CommandModule[] = []

    if (config.desa) {
        commands = [...commands, desa]
    }

    // commands = [...commands]

    return commands
}

export default getCommandList
