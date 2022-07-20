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
