// imports.gi
import * as GObject        from '@gi/GObject'
import * as Gdk            from '@gi/Gdk'
import * as Gio            from '@gi/Gio'

// local modules
import settings            from '../../utils/settings'
import connections         from '../../utils/connections'
import { list_children }   from '../../utils/prefs'
import { template_url }    from '../../utils/io'
import RoundedCornersItems from '../widgets/rounded-corners-item'
import EditShadowWindow    from '../widgets/edit-shadow-window'

// types
import * as Gtk            from '@gi/Gtk'

// --------------------------------------------------------------- [end imports]

export default GObject.registerClass (
    {
        Template: template_url (import.meta.url, './general.ui'),
        GTypeName: 'General',

        // Widgets export from template ui
        InternalChildren: [
            'global_settings_preferences_group',
            'enable_log_switch',
            'skip_libadwaita_app_switch',
            'skip_libhandy_app_switch',
            'border_width_ajustment',
            'border_color_button',
            'edit_shadow_row',
            'applications_group',
        ],
    },
    class extends Gtk.Box {
        // Those properties come from 'InternalChildren'
        private _global_settings_preferences_group !: Gtk.ListBox
        private _enable_log_switch                 !: Gtk.Switch
        private _skip_libhandy_app_switch          !: Gtk.Switch
        private _skip_libadwaita_app_switch        !: Gtk.Switch
        private _border_width_ajustment            !: Gtk.Adjustment
        private _border_color_button               !: Gtk.ColorButton
        private _edit_shadow_row                   !: Gtk.ListBoxRow
        private _applications_group                !: Gtk.ListBox

        private config_items                       !: _Items
        private edit_shadow_window                 !: _Win

        _init () {
            super._init ()

            this.edit_shadow_window = new EditShadowWindow ()
            this.config_items = new RoundedCornersItems ()

            this.build_ui ()

            settings ().bind (
                'debug-mode',
                this._enable_log_switch,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            )
            settings ().bind (
                'skip-libadwaita-app',
                this._skip_libadwaita_app_switch,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            )
            settings ().bind (
                'skip-libhandy-app',
                this._skip_libhandy_app_switch,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            )
            settings ().bind (
                'border-width',
                this._border_width_ajustment,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            )

            const color = settings ().border_color
            this._border_color_button.rgba = new Gdk.RGBA ({
                red: color[0],
                green: color[1],
                blue: color[2],
                alpha: color[3],
            })

            connections
                .get ()
                .connect (this._border_color_button, 'color-set', (source) => {
                    const color = source.get_rgba ()
                    settings ().border_color = [
                        color.red,
                        color.green,
                        color.blue,
                        color.alpha,
                    ]
                })

            // Handler active event for BoxList
            connections
                .get ()
                .connect (
                    this._global_settings_preferences_group,
                    'row-activated',
                    (box: Gtk.ListBox, row: Gtk.ListBoxRow) => {
                        if (row == this.config_items._paddings_row) {
                            this.config_items.update_revealer ()
                        }
                    }
                )

            connections
                .get ()
                .connect (
                    this._applications_group,
                    'row-activated',
                    (box: Gtk.ListBox, row: Gtk.ListBoxRow) => {
                        if (row === this._edit_shadow_row) {
                            this._show_edit_shadow_window_cb ()
                        }
                    }
                )
        }

        private build_ui () {
            list_children (this.config_items).forEach ((i) => {
                this.config_items.remove (i)
                this._global_settings_preferences_group.append (i)
            })
            // Bind Variants
            this.config_items.cfg = settings ().global_rounded_corner_settings
            this.config_items.watch ((cfg) => {
                settings ().global_rounded_corner_settings = cfg
            })
        }

        // ---------------------------------------------------- [signal handler]

        /** Called when click 'Window Shadow' action row */
        _show_edit_shadow_window_cb () {
            const win = this.root as Gtk.Window
            this.edit_shadow_window.application = win.application
            this.edit_shadow_window.present ()
            win.hide ()
            this.edit_shadow_window.connect ('close-request', () => {
                win.show ()
                this.edit_shadow_window.hide ()
            })
        }
    }
)

type _Items = InstanceType<typeof RoundedCornersItems>
type _Win = InstanceType<typeof EditShadowWindow>
