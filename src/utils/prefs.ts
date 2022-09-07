import { DBus, DBusCallFlags } from '@gi/Gio'
import { Variant }             from '@gi/GLib'
import { ListBox }             from '@gi/Gtk'

export const list_children = (widget: ListBox) => {
    const children = []
    for (
        let c = widget.get_first_child ();
        c != null;
        c = c.get_next_sibling ()
    ) {
        children.push (c)
    }
    return children
}

export const show_err_msg = (info: string) => {
    // Show error message with notifications
    // by call DBus method of org.freedesktop.Notifications
    //
    // Ref: https://gjs.guide/guides/gio/dbus.html#direct-calls

    DBus.session.call (
        'org.freedesktop.Notifications',
        '/org/freedesktop/Notifications',
        'org.freedesktop.Notifications',
        'Notify',
        new Variant ('(susssasa{sv}i)', [
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
        DBusCallFlags.NONE,
        -1,
        null,
        null
    )
}
