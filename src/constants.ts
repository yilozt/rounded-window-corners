// This files use for store const variants will used by other modules.

/**
 * Loaded Message will be shown when debug.
 * see: https://patorjk.com/software/taag
 */
export const LOADED_MSG = `
╦═╗┌─┐┬ ┬┌┐┌┌┬┐┌─┐┌┬┐╔═╗┌─┐┬─┐┌┬┐┌─┐┬─┐┌─┐╔═╗┌─┐┌─┐┌─┐┌─┐┌┬┐┌─┐
╠╦╝│ ││ ││││ ││├┤  ││║  │ │├┬┘ ││├┤ ├┬┘└─┐║╣ ├┤ ├┤ ├┤ │   │ └─┐
╩╚═└─┘└─┘┘└┘─┴┘└─┘─┴┘╚═╝└─┘┴└──┴┘└─┘┴└─└─┘╚═╝└  └  └─┘└─┘ ┴ └─┘

[RoundedCordersEffect] Loaded.`

export default {
    /** Message to shown when extensions loaded successfully  */
    LOADED_MSG,
    /** Name of shadow actors */
    SHADOW_ACTOR_NAME: 'Rounded Window Shadow Actor',
    /** Name of rounded corners effects */
    ROUNDED_CORNERS_EFFECT: 'Rounded Corners Effect',
    /** Name of clip shadow effects  */
    CLIP_SHADOW_EFFECT: 'Clip Shadow Effect',
    /** Padding of shadow actors */
    SHADOW_PADDING: 80,
}
