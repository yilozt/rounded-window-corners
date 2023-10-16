import { settings } from './settings.js'

// --------------------------------------------------------------- [end imports]

/**
 * Log message Only when debug_mode of settings () is enabled
 */
export const _log = (...args: unknown[]) => {
  if (settings ().debug_mode) {
    console.log (`[RoundedCornersEffect] ${args}`)
  }
}

/** Always log error message  */
export const _logError = (err: Error) => {
  console.error (err)
}

/**
 * Get stack message when called this function, this method
 * will be used when monkey patch the code of gnome-shell to skip some
 * function invocations.
 */
export const stackMsg = (): string | undefined => {
  try {
    throw Error ()
  } catch (e) {
    return (e as Error)?.stack?.trim ()
  }
}
