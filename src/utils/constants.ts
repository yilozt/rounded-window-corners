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
    /** Tips when add new items in preferences Page */
    TIPS_EMPTY: 'Expand this row to edit this settings.',
    /** Used to mark widget in preferences/page/custom.ts */
    DON_T_CONFIG: 'Don\'t Configuration in Custom Page',
}
