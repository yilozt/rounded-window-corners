import { Widget }                   from '@gi/Gtk'
import { Toast, PreferencesWindow } from '@gi/Adw'

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

export const show_toast = (me: Widget, toast: Toast) => {
    const win: PreferencesWindow = me.root as PreferencesWindow
    win.add_toast (toast)
}
