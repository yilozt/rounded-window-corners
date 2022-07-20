import { load }          from './io'
import settings          from './settings'
import { log, logError } from '@global'

// --------------------------------------------------------------- [end imports]

const we_are_in_vm = load ('/sys/devices/virtual/dmi/id/board_name').includes (
    'VirtualBox'
)

export const _log = (...args: unknown[]) => {
    // Always enable log in virtual machine
    if (settings ().debug_mode || we_are_in_vm) {
        log (`[RoundedCornersEffect] ${args}`)
    }
}

export const _logError = (err: Error) => {
    log (`[Rounded Corners Effect] Error occurs: ${err.message}`)
    logError (err)
}
