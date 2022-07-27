// imports.gi
import * as Meta           from '@gi/Meta'

// gnome modules
import { openPrefs }       from '@imports/misc/extensionUtils'

// local modules
import { load }            from './io'
import { _log, _logError } from './log'
import constants           from './constants'

// types
import { global }          from '@global'
import * as types          from './types'
import { Connections }     from '../utils/connections'
import { Actor }           from '@gi/Clutter'

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
        if (contents.match (/libhandy-1.so/)) {
            return AppType.LibHandy
        } else if (contents.match (/libadwaita-1.so/)) {
            return AppType.LibAdwaita
        } else {
            return AppType.Other
        }
    } catch (e) {
        _logError (e as Error)
        return AppType.Other
    }
}

/**
 * Get scale factor of a Meta.window, if win is undefined, return
 * scale factor of current monitor
 */
export const WindowScaleFactor = (win?: Meta.Window) => {
    const monitor = win
        ? win.get_monitor ()
        : global.display.get_current_monitor ()
    return global.display.get_monitor_scale (monitor)
}

type BackgroundMenu = {
    _getMenuItems: () => { label?: { text: string } }[]
    addAction: (label: string, action: () => void) => void
    moveMenuItem(item: { label?: { text: string } }, index: number): void
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
    for (const item of menu._getMenuItems ()) {
        if (item.label?.text === constants.ITEM_LABEL) {
            return
        }
    }

    menu.addAction (constants.ITEM_LABEL, () => {
        try {
            openPrefs ()
        } catch (err) {
            openPrefs ()
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

export const RestoreBackgroundMenu = () => {
    const remove_menu_item = (menu: BackgroundMenu) => {
        const items = menu._getMenuItems ()

        for (const i of items) {
            if (i?.label?.text === constants.ITEM_LABEL) {
                (i as Actor).destroy ()
                break
            }
        }
    }

    for (const _bg of global.window_group.first_child.get_children ()) {
        const menu = (_bg as typeof _bg & BackgroundExtra)._backgroundMenu
        remove_menu_item (menu)
        _log ('Added Item of ' + menu + 'Removed')
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
