// imports.gi
import * as GLib from 'gi://GLib'
import * as Gio from 'gi://Gio'

// used to mark types, will be remove in output files.
import * as GObject from 'gi://GObject'
import {
  BoxShadow,
  CustomRoundedCornersCfg,
  RoundedCornersCfg,
} from './types.js'
import { log } from '@global'

// --------------------------------------------------------------- [end imports]

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
  | 'settings-version'
  | 'tweak-kitty-terminal'
  | 'enable-preferences-entry'

/**
 * Simple wrapper of Gio.Settings, we will use this class to store and
 * load settings for this gnome-shell extensions.
 */
export class Settings {
  // Keys of settings, define getter and setter in constructor()
  black_list!: string[]
  skip_libadwaita_app!: boolean
  skip_libhandy_app!: boolean
  global_rounded_corner_settings!: RoundedCornersCfg
  custom_rounded_corner_settings!: CustomRoundedCornersCfg
  focused_shadow!: BoxShadow
  unfocused_shadow!: BoxShadow
  debug_mode!: boolean
  tweak_kitty_terminal!: boolean
  enable_preferences_entry!: boolean
  border_width!: number
  settings_version!: number
  border_color!: [number, number, number, number]

  /** GSettings, which used to store and load settings */
  g_settings: Gio.Settings

  constructor (g_settings: Gio.Settings) {
    this.g_settings = g_settings

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

    /** Port rounded corners settings to new version  */
    this._fix ()
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
  private _pack_val (val: number | boolean | string | unknown): GLib.Variant {
    if (val instanceof Object) {
      const packed: { [prop: string]: GLib.Variant } = {}
      Object.keys (val).forEach ((k) => {
        packed[k] = this._pack_val ((val as { [prop: string]: unknown })[k])
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

  /**  Fix RoundedCornersCfg when this type has been updated */
  private _fix_rounded_corners_cfg (
    default_val: RoundedCornersCfg & { [prop: string]: undefined },
    val: RoundedCornersCfg & { [prop: string]: undefined }
  ) {
    // Added missing props
    Object.keys (default_val).forEach ((k) => {
      if (val[k] === undefined) {
        val[k] = default_val[k]
      }
    })

    // keep_rounded_corners has been update to object type in v5
    if (typeof val['keep_rounded_corners'] === 'boolean') {
      const keep_rounded_corners = {
        ...default_val['keep_rounded_corners'],
        maximized: val['keep_rounded_corners'],
      }
      val['keep_rounded_corners'] = keep_rounded_corners
    }
  }

  /** Port Settings to newer version in here when changed 'a{sv}' types */
  private _fix () {
    const VERSION = 5
    if (this.settings_version == VERSION) {
      return
    }
    this.settings_version = VERSION

    type _Cfg = RoundedCornersCfg & { [p: string]: undefined }

    const key: SchemasKeys = 'global-rounded-corner-settings'
    const default_val = this.g_settings
      .get_default_value (key)
      ?.recursiveUnpack () as _Cfg

    // Fix global-rounded-corners-settings
    const global_cfg = this.global_rounded_corner_settings as _Cfg
    this._fix_rounded_corners_cfg (default_val, global_cfg)
    this.global_rounded_corner_settings = global_cfg

    // Fix custom-rounded-corner-settings
    const custom_cfg = this.custom_rounded_corner_settings
    Object.keys (custom_cfg).forEach ((k) => {
      this._fix_rounded_corners_cfg (default_val, custom_cfg[k] as _Cfg)
    })
    this.custom_rounded_corner_settings = custom_cfg

    log (`[RoundedWindowCorners] Update Settings to v${VERSION}`)
  }

  _disable () {
    (this.g_settings as Gio.Settings | null) = null
  }
}

/** A singleton instance of Settings */
let _settings!: Settings

export const init_settings = (g_settings: Gio.Settings) => {
  _settings = new Settings (g_settings)
}

export const uninit_settings = () => {
  _settings?._disable ()
  ;(_settings as Settings | null) = null
}

/** Access _settings by this method */
export const settings = () => {
  return _settings
}
