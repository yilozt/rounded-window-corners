import * as Gio  from '@gi/Gio'
import * as GLib from '@gi/GLib'
import ByteArray from '@imports/byteArray'

// --------------------------------------------------------------- [end imports]

export const load = (path: string): string => {
    const [, buffer] = GLib.file_get_contents (path)
    const contents = ByteArray.toString (buffer)
    GLib.free (buffer)
    return contents
}

export const path = (mod_url: string, relative_path: string) => {
    const parent = Gio.File.new_for_uri (mod_url).get_parent ()

    const mod_dir = parent?.get_path ()
    return Gio.File.new_for_path (`${mod_dir}/${relative_path}`).get_path ()
}

export const loadFile = (mod_url: string, relative_path: string) =>
    load (path (mod_url, relative_path) ?? '')

export const loadShader = (path: string) => {
    let [declarations, main] = load (path).split (/^.*?main\(\s?\)\s?/m)

    declarations = declarations.trim ()
    main = main.trim ().replace (/^[{}]/gm, '').trim ()
    return { declarations, code: main }
}
