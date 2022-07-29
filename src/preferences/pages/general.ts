// imports.gi
import * as GObject       from '@gi/GObject'
import * as Hdy           from '@gi/Handy'
import * as Gdk           from '@gi/Gdk'
import * as Gio           from '@gi/Gio'

// local modules
import settings           from '../../utils/settings'
import RoundedCornersItem from '../widgets/rounded-corners-item'
import EditShadowWindow   from '../widgets/edit-shadow-window'
import { list_children }  from '../../utils/prefs'
import { template_url }   from '../../utils/io'

// types
import * as Gtk           from '@gi/Gtk'

// --------------------------------------------------------------- [end imports]

type _Item = InstanceType<typeof RoundedCornersItem>
type _Win = InstanceType<typeof EditShadowWindow>

export const General = GObject.registerClass (
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
        ],
    },
    class extends Hdy.PreferencesPage {
        // Those properties come from 'InternalChildren'
        private _global_settings_preferences_group !: Hdy.PreferencesGroup
        private _enable_log_switch                 !: Gtk.Switch
        private _skip_libhandy_app_switch          !: Gtk.Switch
        private _skip_libadwaita_app_switch        !: Gtk.Switch
        private _border_width_ajustment            !: Gtk.Adjustment
        private _border_color_button               !: Gtk.ColorButton

        private edit_shadow_window: _Win | null = null
        private config_items                       !: _Item

        _init () {
            super._init ()

            this.edit_shadow_window = null
            this.config_items = new RoundedCornersItem ()

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

            this._border_color_button.connect ('color-set', (source) => {
                const color = source.get_rgba ()
                settings ().border_color = [
                    color.red,
                    color.green,
                    color.blue,
                    color.alpha,
                ]
            })
        }

        private build_ui () {
            list_children (this.config_items).forEach ((i) => {
                this.config_items.remove (i)
                this._global_settings_preferences_group.add (i)
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
            if (this.edit_shadow_window) {
                return
            }

            const win = this.get_toplevel () as Gtk.Window
            this.edit_shadow_window = new EditShadowWindow ()
            win.hide ()
            this.edit_shadow_window.application = win.application
            this.edit_shadow_window.show_all ()
            this.edit_shadow_window.connect ('destroy', () => {
                win.show_all ()
                this.edit_shadow_window = null
            })
        }
    }
)
