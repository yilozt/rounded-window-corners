// imports.gi

import * as GObject     from '@gi/GObject'
import * as Adw         from '@gi/Adw'
import * as Gtk         from '@gi/Gtk'

// local Modules

import { template_url } from '../../utils'

// ----------------------------------------------------------------- end imports

export default GObject.registerClass (
    {
        Template: template_url (import.meta.url, './black-list-row.ui'),
        GTypeName: 'BlacklistRow',
        InternalChildren: ['entry_buffer', 'wm_name_row', 'remove_button'],
    },
    class extends Adw.ExpanderRow {
        _entry_buffer  !: Gtk.EntryBuffer
        _vm_name_row   !: Adw.PreferencesRow
        _remove_button !: Gtk.Button

        private bind_property_handler?: GObject.Binding

        constructor (
            config?: Adw.ExpanderRow.ConstructorProperties,
            cb?: {
                on_delete?: (string: string) => void
                on_open?: () => void
                on_close?: () => void
            }
        ) {
            super (config)

            this.connect ('notify::expanded', () => {
                if (this.expanded) {
                    this.connect_signals ()
                    cb && cb.on_open && cb.on_open ()
                } else {
                    cb && cb.on_close && cb.on_close ()
                    this.disconnect_signals ()
                }
            })
        }

        protected connect_signals () {
            this.bind_property_handler = this.bind_property (
                'title',
                this._entry_buffer,
                'text',
                GObject.BindingFlags.BIDIRECTIONAL |
                    GObject.BindingFlags.SYNC_CREATE
            )
        }

        disconnect_signals () {
            this.bind_property_handler?.unbind ()
        }
    }
)
