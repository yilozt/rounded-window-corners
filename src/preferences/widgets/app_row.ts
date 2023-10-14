// imports.gi
import * as GObject from 'gi://GObject'
import * as Gtk from 'gi://Gtk'

// local Modules
import { show_err_msg, TIPS_EMPTY } from '../../utils/prefs.js'
import { connections } from '../../utils/connections.js'
import { on_picked, pick } from '../../dbus/client.js'
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
import { uri } from '../../utils/io.js'

// types

// ----------------------------------------------------------------- end imports

export const AppRow = GObject.registerClass (
  {
    Template: uri (import.meta.url, 'app-row.ui'),
    GTypeName: 'AppRow',
    InternalChildren: [
      'wm_class_instance_entry',
      'remove_button',
      'change_title_btn',
      'pick_window_btn',
      'title',
      'description',
      'expand_img',
      'revealer',
      'expanded_list_box',
    ],
  },
  class extends Gtk.ListBoxRow {
    private _wm_class_instance_entry!: Gtk.Entry
    private _remove_button!: Gtk.Button
    private _change_title_btn!: Gtk.Button
    private _pick_window_btn!: Gtk.Button
    private _title!: Gtk.Label
    private _description!: Gtk.Label
    private _expand_img!: Gtk.Button
    private _revealer!: Gtk.Revealer
    _expanded_list_box!: Gtk.ListBox

    private bind_property_handler?: GObject.Binding

    /** Store event handlers for this widget */
    private cb?: AppRowHandler

    _init (cb?: AppRowHandler) {
      super._init ()
      this.cb = cb

      const c = connections.get ()
      c.connect (this._remove_button, 'clicked', (btn: Gtk.Button) => {
        if (this._revealer.reveal_child) {
          this.disconnect_signals ()
        }
        connections.get ().disconnect_all (btn)
        connections.get ().disconnect_all (this)
        cb && cb.on_delete && cb.on_delete (this, this._title.label)
      })

      c.connect (this._expand_img, 'clicked', () => this.on_expanded_changed ())
    }

    set title (t: string) {
      this._title.label = t
      this._title.visible = this._title.label != ''
      this._description.visible = this._description.label != ''
    }
    get title (): string {
      return this._title.label
    }
    set description (d: string) {
      this._description.label = d
      this._title.visible = this._title.label != ''
      this._description.visible = this._description.label != ''
    }

    on_expanded_changed () {
      this._revealer.reveal_child = !this._revealer.reveal_child
      if (this._revealer.reveal_child) {
        this._expand_img.add_css_class ('rotated')
        this._wm_class_instance_entry.text = this._title.label
        this.connect_signals ()
        this.cb && this.cb.on_open && this.cb.on_open (this)
      } else {
        this._expand_img.remove_css_class ('rotated')
        this.change_title ()
        this.disconnect_signals ()
        this.cb && this.cb.on_close && this.cb.on_close ()
      }
    }

    add_row (child: Gtk.Widget) {
      this._expanded_list_box.append (child)
    }

    private connect_signals () {
      const c = connections.get ()
      c.connect (this._change_title_btn, 'clicked', () => {
        this.change_title ()
      })
      c.connect (this._pick_window_btn, 'clicked', () => {
        on_picked ((wm_instance_class) => {
          const title = _ ('Can\'t pick a window window from this position')
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
        this._title.label == this._wm_class_instance_entry.text ||
        this._wm_class_instance_entry.text == ''
      ) {
        return
      }

      if (
        this.cb.on_title_changed (
          this._title.label, // old title
          this._wm_class_instance_entry.text // new title
        )
      ) {
        this.title = this._wm_class_instance_entry.text
        this.description = ''
      } else {
        if (this.title == '') {
          this.description = TIPS_EMPTY ()
        }
      }
    }
  }
)

export type AppRowHandler = {
  on_delete?: (row: Gtk.ListBoxRow, item: string) => void
  on_open?: (row: Gtk.ListBoxRow) => void
  on_close?: () => void
  on_title_changed?: (old_title: string, new_title: string) => boolean
}
