import * as Gtk from 'gi://Gtk'
import * as Gdk from 'gi://Gdk'
import * as Adw from 'gi://Adw'

import { init_settings } from './utils/settings.js'
import { pages } from './preferences/index.js'
import * as Utils from './utils/io.js'
import {
  ExtensionPreferences
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

export default class RoundedWindowCornresPrefs extends ExtensionPreferences {
  _load_css () {
    const display = Gdk.Display.get_default ()
    if (display) {
      const css = new Gtk.CssProvider ()
      const path = Utils.path (import.meta.url, 'stylesheet-prefs.css')
      css.load_from_path (path)
      Gtk.StyleContext.add_provider_for_display (display, css, 0)
    }
  }

  fillPreferencesWindow (win: Adw.PreferencesWindow) {
    init_settings (this.getSettings ())

    for (const page of pages ()) {
      const pref_page = new Adw.PreferencesPage ({
        title: page.title,
        icon_name: page.icon_name,
      })
      const group = new Adw.PreferencesGroup ()
      pref_page.add (group)
      group.add (page.widget)
      win.add (pref_page)
    }

    this._load_css ()
  }
}
