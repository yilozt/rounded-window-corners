import { ListBox } from '@gi/Gtk'
import * as Notify from '@gi/Notify'

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
    const summary = 'Preferences Page'
    new Notify.Notification ({ summary, body: info }).show ()
}
