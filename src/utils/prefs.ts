import { Widget }  from '@gi/Gtk'
import * as Adw    from '@gi/Adw'
import * as Notify from '@gi/Notify'

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

export const show_err_msg = (me: Widget, info: string) => {
    try {
        const win = me.root as Adw.PreferencesWindow
        win.add_toast (new Adw.Toast ({ title: info, timeout: 3 }))
    } catch (e) {
        const summary = 'Preferences Page'
        new Notify.Notification ({ summary, body: info }).show ()
    }
}
