import { ListBox } from '@gi/Gtk'
import * as Notify from '@gi/Notify'

export const list_children = (widget: ListBox) => {
    return widget.get_children ()
}

export const show_err_msg = (info: string) => {
    const summary = 'Preferences Page'
    new Notify.Notification ({ summary, body: info }).show ()
}
