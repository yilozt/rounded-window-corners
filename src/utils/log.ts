import settings          from './settings'
import { log, logError } from '@global'

// --------------------------------------------------------------- [end imports]

/**
 * Log message Only when debug_mode of settings () is enabled
 */
export const _log = (...args: unknown[]) => {
    // Always enable log in virtual machine
    if (settings ().debug_mode) {
        log (`[RoundedCornersEffect] ${args}`)
    }
}

/** Always log error message  */
export const _logError = (err: Error) => {
    log (`[Rounded Corners Effect] Error occurs: ${err.message}`)
    logError (err)
}
