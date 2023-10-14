import * as Gio from 'gi://Gio'
import * as GLib from 'gi://GLib'
import * as Gtk from 'gi://Gtk'
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

export const list_children = (widget: Gtk.ListBox) => {
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

export const show_err_msg = (info: string) => {
  // Show error message with notifications
  // by call DBus method of org.freedesktop.Notifications
  //
  // Ref: https://gjs.guide/guides/gio/dbus.html#direct-calls

  Gio.DBus.session.call (
    'org.freedesktop.Notifications',
    '/org/freedesktop/Notifications',
    'org.freedesktop.Notifications',
    'Notify',
    new GLib.Variant ('(susssasa{sv}i)', [
      '',
      0,
      '',
      'Rounded Window Corners',
      info,
      [],
      {},
      3000,
    ]),
    null,
    Gio.DBusCallFlags.NONE,
    -1,
    null,
    null
  )
}

/** Tips when add new items in preferences Page */
export const TIPS_EMPTY = () => _ ('Expand this row to pick a window.')
