import * as Gtk                       from '@gi/Gtk'
import * as Gdk                       from '@gi/Gdk'
import * as Notify                    from '@gi/Notify'
import { getCurrentExtension }        from '@imports/misc/extensionUtils'

import { pages }                      from '@me/preferences/index'

import { PreferencesWindow, imports } from '@global'

function load_css () {
    const display = Gdk.Display.get_default ()
    if (display) {
        const css = new Gtk.CssProvider ()
        const path = `${getCurrentExtension ().path}/stylesheet-prefs.css`
        css.load_from_path (path)
        Gtk.StyleContext.add_provider_for_display (display, css, 0)
    }
}

export function init () {
    Notify.init ('yi.extensions.rounded-window-corners.prefs')
}

// Load preferences Pages for Gnome 40 / Gnome 41
export function buildPrefsWidget () {
    const scrolled_win = new Gtk.ScrolledWindow ()
    const stack = new Gtk.Stack ({ css_classes: ['page'] })
    const swither = new Gtk.StackSwitcher ({ stack })

    scrolled_win.set_child (stack)

    // Add StackSwitcher into HeaderBar
    scrolled_win.connect ('realize', () => {
        const win = scrolled_win.root as Gtk.Window
        win.width_request = 550
        const titlebar = win.get_titlebar () as Gtk.HeaderBar | null
        titlebar?.set_title_widget (swither)

        win.connect ('close-request', () => {
            Notify.uninit ()
        })
    })

    // Load pages
    for (const page of pages ()) {
        stack.add_titled (page.widget, page.title, page.title)
    }

    // Load css
    load_css ()

    return scrolled_win
}

// Load ui for Gnome 42+
export function fillPreferencesWindow (window: PreferencesWindow) {
    const Adw = imports.gi.Adw

    for (const page of pages ()) {
        const pref_page = new Adw.PreferencesPage ({
            title: page.title,
            icon_name: page.icon_name,
        })
        const group = new Adw.PreferencesGroup ()
        pref_page.add (group)
        group.add (page.widget)
        window.add (pref_page)
    }

    window.connect ('close-request', () => {
        Notify.uninit ()
    })

    load_css ()
}
