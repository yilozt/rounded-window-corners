// imports.gi
import * as Meta       from '@gi/Meta'

// gnome modules
import { openPrefs }   from '@imports/misc/extensionUtils'

// local modules
import { load }        from './io'
import { _logError }   from './log'

// types
import { global }      from '@global'
import * as types      from './types'
import { Connections } from '../connections'

// --------------------------------------------------------------- [end imports]

export const computeWindowContentsOffset = (meta_window: Meta.Window) => {
    const bufferRect = meta_window.get_buffer_rect ()
    const frameRect = meta_window.get_frame_rect ()
    return [
        frameRect.x - bufferRect.x,
        frameRect.y - bufferRect.y,
        frameRect.width - bufferRect.width,
        frameRect.height - bufferRect.height,
    ]
}

export enum AppType {
    LibHandy,
    LibAdwaita,
    Other,
}

/**
 * Query application type for a Meta.Window, used to skip add rounded
 * corners effect to some window.
 * @returns Application Type: LibHandy | LibAdwaita | Other
 */
export const getAppType = (meta_window: Meta.Window) => {
    try {
        // May cause Permission error
        const contents = load (`/proc/${meta_window.get_pid ()}/maps`)
        if (contents.match (/libhandy.*?so/)) {
            return AppType.LibHandy
        } else if (contents.match (/libadwaita.*?so/)) {
            return AppType.LibAdwaita
        } else {
            return AppType.Other
        }
    } catch (e) {
        _logError (e as Error)
        return AppType.Other
    }
}

export const scaleFactor = () =>
    global.display.get_monitor_scale (global.display.get_current_monitor ())

type BackgroundMenu = {
    _getMenuItems: () => { label?: { text: string } }[]
    addAction: (label: string, action: () => void) => void
}
type BackgroundExtra = {
    _backgroundMenu: BackgroundMenu
}

/**
 * Add Item into background menu, now we can open preferences page by right
 * click in background
 * @param menu - BackgroundMenu to add
 */
export const AddBackgroundMenuItem = (menu: BackgroundMenu) => {
    const to_add = 'Rounded Corners Settings'

    for (const item of menu._getMenuItems ()) {
        if (item.label?.text === to_add) {
            return
        }
    }

    menu.addAction (to_add, () => {
        try {
            openPrefs ()
        } catch (err) {
            /**/
        }
    })
}

/** Find all Background menu, then add extra item to it */
export const SetupBackgroundMenu = () => {
    for (const _bg of global.window_group.first_child.get_children ()) {
        const menu = (_bg as typeof _bg & BackgroundExtra)._backgroundMenu
        AddBackgroundMenuItem (menu)
    }
}

/** When surface actor of Meta.WindowActor is ready, call the ready callback  */
export const WhenSurfaceActorIsReady = (
    connections: Connections,
    actor: Meta.WindowActor,
    ready: () => void
) => {
    const win = actor.meta_window
    if (win.get_client_type () === Meta.WindowClientType.X11) {
        // Add rounded corners to surface actor for X11 client
        if (actor.first_child) {
            ready ()
        } else {
            // Surface Actor may not ready in some time
            connections.connect (actor, 'notify::first-child', () => {
                connections.disconnect (actor, 'notify::first-child')
                // now it's ready
                ready ()
            })
        }
    } else {
        // Add rounded corners to WindowActor for Wayland client
        ready ()
    }
}

/** Choice Rounded Corners Settings for window  */
export const ChoiceRoundedCornersCfg = (
    global_cfg: types.RoundedCornersCfg,
    custom_cfg_list: {
        [wm_class_instance: string]: types.RoundedCornersCfg
    },
    win: Meta.Window
) => {
    const k = win.get_wm_class_instance ()
    if (k == null || !custom_cfg_list[k] || !custom_cfg_list[k].enabled) {
        return global_cfg
    }

    const custom_cfg = custom_cfg_list[k]
    // Need to skip border radius item from custom settings
    custom_cfg.border_radius = global_cfg.border_radius
    return custom_cfg
}
