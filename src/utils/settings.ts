// imports.gi
import * as GLib                   from '@gi/GLib'
import * as Gio                    from '@gi/Gio'

// used to mark types, will be remove in output files.
import * as GObject                from '@gi/GObject'
import { BoxShadow }               from './types'
import { CustomRoundedCornersCfg } from './types'
import { RoundedCornersCfg }       from './types'
import { log }                     from '@global'

// --------------------------------------------------------------- [end imports]

/**
 * This function is base on getSettings() in
 * https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/misc/
 * extensionUtils.js#L211
 *
 * Need this function because preferences is launched in a new process.
 */
function getSettings (schema: string) {
    const GioSSS = Gio.SettingsSchemaSource
    const schemaDir = Gio.File.new_for_uri (import.meta.url)
        .get_parent ()
        ?.get_parent ()
        ?.get_child ('schemas')
    let schemaSource
    if (schemaDir?.query_exists (null)) {
        schemaSource = GioSSS.new_from_directory (
            schemaDir.get_path () ?? '',
            GioSSS.get_default (),
            false
        )
    } else {
        schemaSource = GioSSS.get_default ()
    }

    const schemaObj = schemaSource?.lookup (schema, true)
    if (!schemaObj) throw new Error (`Schema ${schema} could not be found`)

    return new Gio.Settings ({ settings_schema: schemaObj })
}

/** This object use to store key of settings and its type string */
const type_of_keys: {
    // Key         // types string
    [key: string]: string
} = {}

/**
 * Keys of settings, should update this type when add new key in schemas xml
 */
export type SchemasKeys =
    | 'black-list'
    | 'skip-libadwaita-app'
    | 'skip-libhandy-app'
    | 'global-rounded-corner-settings'
    | 'custom-rounded-corner-settings'
    | 'focused-shadow'
    | 'unfocused-shadow'
    | 'debug-mode'
    | 'border-width'
    | 'border-color'

/**
 * Simple wrapper of Gio.Settings, we will use this class to store and
 * load settings for this gnome-shell extensions.
 */
class Settings {
    // Keys of settings, define getter and setter in constructor()
    black_list                     !: string[]
    skip_libadwaita_app            !: boolean
    skip_libhandy_app              !: boolean
    global_rounded_corner_settings !: RoundedCornersCfg
    custom_rounded_corner_settings !: CustomRoundedCornersCfg
    focused_shadow                 !: BoxShadow
    unfocused_shadow               !: BoxShadow
    debug_mode                     !: boolean
    border_width                   !: number
    border_color                   !: [number, number, number, number]

    /** GSettings, which used to store and load settings */
    g_settings: Gio.Settings = getSettings (
        'org.gnome.shell.extensions.rounded-window-effect'
    )

    constructor () {
        // Define getter and setter for properties in class for keys in
        // schemas
        this.g_settings.list_keys ().forEach ((key) => {
            // Cache type string of keys first
            const default_val = this.g_settings.get_default_value (key)
            if (default_val == null) {
                log ('Err: Key of Settings undefined: ' + key)
                return
            }
            type_of_keys[key] = default_val.get_type_string ()

            // Define getter and setter for keys
            Object.defineProperty (this, key.replace (/-/g, '_'), {
                get: () => this.g_settings.get_value (key).recursiveUnpack (),
                set: (val) => {
                    const variant =
                        type_of_keys[key] == 'a{sv}'
                            ? this._pack_val (val)
                            : new GLib.Variant (type_of_keys[key], val)
                    this.g_settings.set_value (key, variant)
                },
            })
        })
    }

    /**
     * Just a simple wrapper to this.settings.bind(), use SchemasKeys
     * to help us check source_prop
     */
    bind (
        source_prop: SchemasKeys,
        target: GObject.Object,
        target_prop: string,
        flags: Gio.SettingsBindFlags
    ) {
        this.g_settings.bind (source_prop, target, target_prop, flags)
    }

    // ------------------------------------------------------- [private methods]

    /**
     * this method is used to pack javascript values into GLib.Variant when type
     * of key is `a{sv}`
     *
     * @param val Javascript object to convert
     * @returns A GLib.Variant with type `a{sv}`
     */
    _pack_val (val: number | boolean | string | unknown): GLib.Variant {
        if (val instanceof Object) {
            const packed: { [prop: string]: GLib.Variant } = {}
            Object.keys (val).forEach ((k) => {
                packed[k] = this._pack_val (
                    (val as { [prop: string]: unknown })[k]
                )
            })
            return new GLib.Variant ('a{sv}', packed)
        }

        // Important: Just handler float number and unsigned int number.
        // need to add handler to signed int number if we need store signed int
        // value into GSettings in GLib.Variant

        if (typeof val == 'number') {
            if (Math.abs (val - Math.floor (val)) < 10e-20) {
                return GLib.Variant.new_uint32 (val)
            } else {
                return GLib.Variant.new_double (val)
            }
        }

        if (typeof val == 'boolean') {
            return GLib.Variant.new_boolean (val)
        }

        if (typeof val == 'string') {
            return GLib.Variant.new_string (val)
        }

        if (val instanceof Array) {
            return new GLib.Variant (
                'av',
                val.map ((i) => this._pack_val (i))
            )
        }

        throw Error ('Unknown val to packed' + val)
    }
}

/** A singleton instance of Settings */
let _settings: Settings | null = null

/** Access _settings by this method */
const settings = () => {
    if (_settings != null) {
        return _settings
    }
    _settings = new Settings ()
    return _settings
}

export default settings
