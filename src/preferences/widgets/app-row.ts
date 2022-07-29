// imports.gi
import * as GObject        from '@gi/GObject'
import * as Hdy            from '@gi/Handy'
import * as Gtk            from '@gi/Gtk'

// local Modules
import { template_url }    from '../../utils/io'
import { show_err_msg }    from '../../utils/prefs'
import connections         from '../../utils/connections'
import constants           from '../../utils/constants'
import { on_picked, pick } from '../../dbus/client'

// ----------------------------------------------------------------- end imports

export default GObject.registerClass (
    {
        Template: template_url (import.meta.url, './app-row.ui'),
        GTypeName: 'AppRow',
        InternalChildren: [
            'wm_class_instance_entry',
            'wm_name_row',
            'remove_button',
            'change_title_btn',
            'pick_window_btn',
        ],
    },
    class extends Hdy.ExpanderRow {
        private _wm_class_instance_entry !: Gtk.Entry
        private _remove_button           !: Gtk.Button
        private _change_title_btn        !: Gtk.Button
        private _pick_window_btn         !: Gtk.Button

        private bind_property_handler?: GObject.Binding

        /** Store event handlers for this widget */
        private cb?: AppRowHandler

        _init (
            config?: Partial<Hdy.ExpanderRow.ConstructorProperties>,
            cb?: AppRowHandler
        ) {
            super._init (config)
            this.cb = cb

            connections.get ().connect (this, 'notify::expanded', () => {
                if (this.expanded) {
                    this._wm_class_instance_entry.text = this.title
                    this.connect_signals ()
                    cb && cb.on_open && cb.on_open (this)
                } else {
                    this.change_title ()
                    this.disconnect_signals ()
                    cb && cb.on_close && cb.on_close ()
                }
            })

            connections
                .get ()
                .connect (this._remove_button, 'clicked', (btn: Gtk.Button) => {
                    if (this.expanded) {
                        this.disconnect_signals ()
                    }
                    connections.get ().disconnect_all (btn)
                    connections.get ().disconnect_all (this)
                    cb && cb.on_delete && cb.on_delete (this)
                })
        }

        private connect_signals () {
            const c = connections.get ()
            c.connect (this._change_title_btn, 'clicked', () => {
                this.change_title ()
            })

            c.connect (this._pick_window_btn, 'clicked', () => {
                on_picked ((wm_instance_class) => {
                    const title =
                        'Can\'t pick a window window from this position'
                    if (wm_instance_class == 'window-not-found') {
                        show_err_msg (title)
                        return
                    }
                    this._wm_class_instance_entry.text = wm_instance_class
                })
                pick ()
            })
        }

        private disconnect_signals () {
            this.bind_property_handler?.unbind ()
            connections.get ().disconnect_all (this._change_title_btn)
            connections.get ().disconnect_all (this._pick_window_btn)
        }

        private change_title () {
            if (
                !this.cb ||
                !this.cb.on_title_changed ||
                this.title == this._wm_class_instance_entry.text ||
                this._wm_class_instance_entry.text == ''
            ) {
                return
            }

            if (
                this.cb.on_title_changed (
                    this.title, // old title
                    this._wm_class_instance_entry.text // new title
                )
            ) {
                this.title = this._wm_class_instance_entry.text
                this.subtitle = ''
            } else {
                if (this.title == '') {
                    this.subtitle = constants.TIPS_EMPTY
                }
            }
        }
    }
)

export type AppRowHandler = {
    on_delete?: (row: Hdy.ExpanderRow) => void
    on_open?: (row: Hdy.ExpanderRow) => void
    on_close?: () => void
    on_title_changed?: (old_title: string, new_title: string) => boolean
}
