// imports.gi
import * as Gio                  from '@gi/Gio'
import * as GLib                 from '@gi/GLib'

// Gjs builtin modules
import ByteArray                 from '@imports/byteArray'

// local modules
import settings                  from './settings.js'

// types
import * as Meta                 from '@gi/Meta'
import { global, log, logError } from '@global'
import { Widget }                from '@gi/Gtk.js'

// --------------------------------------------------------------- [end imports]

const load = (path: string): string => {
    const [, buffer] = GLib.file_get_contents (path)
    const contents = ByteArray.toString (buffer)
    GLib.free (buffer)
    return contents
}

export const template_url = (mod_url: string, relative_path: string) =>
    'file://' + path (mod_url, relative_path)

export const path = (mod_url: string, relative_path: string) => {
    const parent = Gio.File.new_for_uri (mod_url).get_parent ()
    if (!parent) {
        throw Error ('Fail to load parent of ' + mod_url)
    }
    const mod_dir = parent.get_path ()
    return `${mod_dir}/${relative_path}`
}

export const loadFile = (mod_url: string, relative_path: string) =>
    load (path (mod_url, relative_path))

export const loadShader = (mod_url: string, relative_path: string) => {
    let [declarations, main] = loadFile (mod_url, relative_path).split (
        /^.*?main\(\s?\)\s?/m
    )

    declarations = declarations.trim ()
    main = main.trim ().replace (/^[{}]/gm, '').trim ()
    return { declarations, code: main }
}

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

export const getAppType = (meta_window: Meta.Window) => {
    try {
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

export const scaleFactor = () =>
    global.display.get_monitor_scale (global.display.get_current_monitor ())

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

export default {
    loadFile,
    loadShader,
    computeWindowContentsOffset,
    getAppType,
    AppType,
    scaleFactor,
    path,
    _log,
}
