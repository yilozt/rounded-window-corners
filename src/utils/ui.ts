// gnome modules
import { openPrefs }                from '@imports/misc/extensionUtils'

// local modules
import { load }                     from './io'
import { _logError }                from './log'

// types
import { Widget }                   from '@gi/Gtk'
import { Toast, PreferencesWindow } from '@gi/Adw'
import { global }                   from '@global'
import * as Meta                    from '@gi/Meta'

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

export const list_children = (widget: Widget) => {
    const children = []
    for (
        let child = widget.get_first_child ();
        child != null;
        child = child.get_next_sibling ()
    ) {
        children.push (child)
    }
    return children
}

export const show_toast = (me: Widget, toast: Toast) => {
    const win: PreferencesWindow = me.root as PreferencesWindow
    win.add_toast (toast)
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
    const to_add = 'Open Rounded Corners Effect Preferences Page...'

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
