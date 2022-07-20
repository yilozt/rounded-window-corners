// imports.gi
import * as GObject       from '@gi/GObject'
import * as Adw           from '@gi/Adw'
import * as Gtk           from '@gi/Gtk'
import * as Gio           from '@gi/Gio'

// local modules
import settings           from '../../utils/settings'
import RoundedCornersItem from '../widgets/rounded-corners-item'
import EditShadowWindow   from '../widgets/edit-shadow-window'
import { list_children }  from '../../utils/ui'
import { template_url }   from '../../utils/io'

// --------------------------------------------------------------- [end imports]

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
        ],
    },
    class extends Adw.PreferencesPage {
        // Those properties come from 'InternalChildren'
        private _global_settings_preferences_group !: Adw.PreferencesGroup
        private _enable_log_switch                 !: Gtk.Switch
        private _skip_libhandy_app_switch          !: Gtk.Switch
        private _skip_libadwaita_app_switch        !: Gtk.Switch

        private edit_shadow_window = new EditShadowWindow ()
        private config_items = new RoundedCornersItem ()

        constructor () {
            super ()
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
            this.edit_shadow_window.show ()
        }
    }
)
