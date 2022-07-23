// imports.gi
import * as GObject           from '@gi/GObject'
import * as Adw               from '@gi/Adw'
import * as Gtk               from '@gi/Gtk'
import * as Gio               from '@gi/Gio'

// local modules
import settings               from '../../utils/settings'
import RoundedCornersItem     from '../widgets/rounded-corners-item'
import EditShadowWindow       from '../widgets/edit-shadow-window'
import { list_children }      from '../../utils/prefs'
import { distribution_id }    from '../../utils/io'
import { path, template_url } from '../../utils/io'
import deps                   from '../../utils/deps'
import { _log }               from '../../utils/log'

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
            'setup_guide_page',
            'meson_setup_label',
            'source_code_label',
            'deps_cmd_label',
        ],
    },
    class extends Adw.PreferencesPage {
        // Those properties come from 'InternalChildren'
        private _global_settings_preferences_group !: Adw.PreferencesGroup
        private _enable_log_switch                 !: Gtk.Switch
        private _skip_libhandy_app_switch          !: Gtk.Switch
        private _skip_libadwaita_app_switch        !: Gtk.Switch
        private _setup_guide_page                  !: Gtk.Widget
        private _meson_setup_label                 !: Gtk.Label
        private _source_code_label                 !: Gtk.Label
        private _deps_cmd_label                    !: Gtk.Label

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

            const source_path = path (import.meta.url, '../../patched-blur')
            const id = distribution_id ()
            _log ('Distribution ID: ' + id)
            if (id && deps[id]) {
                this._deps_cmd_label.label = deps[id]
            } else {
                this._deps_cmd_label.visible = false
            }

            this._meson_setup_label.label =
                'meson --prefix=/ _build ' + source_path
            this._source_code_label.label =
                'You can check the source code <a href="file://' +
                source_path +
                '">here</a>.'
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

        _show_setup_guide_page () {
            (this.root as Adw.PreferencesWindow).present_subpage (
                this._setup_guide_page
            )
        }

        _hide_page_cb () {
            (this.root as Adw.PreferencesWindow).close_subpage ()
        }
    }
)
