imports.gi.versions.Gtk = '4.0'

// imports.gi
import * as GObject                      from '@gi/GObject'
import * as Adw                          from '@gi/Adw'
import { ListBox }                       from '@gi/Gtk'

// local modules
import { list_children, show_err_msg }   from '../../utils/prefs'
import { template_url }                  from '../../utils/io'
import constants                         from '../../utils/constants'
import { connections }                   from '../../connections'
import settings                          from '../../utils/settings'
import AppRow                            from '../widgets/app-row'
import RoundedCornersItem                from '../widgets/rounded-corners-item'

// types
import { Align, Switch, Button, Widget } from '@gi/Gtk'
import { AppRowHandler }                 from '../widgets/app-row'
import { CustomRoundedCornersCfg }       from '../../utils/types'
import { RoundedCornersCfg }             from '../../utils/types'
import { _log }                          from '../../utils/log'
import { imports }                       from '@global'

// --------------------------------------------------------------- [end imports]

export const Custom = GObject.registerClass (
    {
        Template: template_url (import.meta.url, './custom.ui'),
        GTypeName: 'CustomPage',
        InternalChildren: ['custom_group', 'add_row_btn'],
    },
    class extends Adw.PreferencesPage {
        private _custom_group !: Adw.PreferencesGroup
        private _add_row_btn  !: Button

        private _settings_cfg !: CustomRoundedCornersCfg

        _init () {
            super._init ()
            this._settings_cfg = settings ().custom_rounded_corner_settings

            for (const k in this._settings_cfg) {
                this.add_row (k, this._settings_cfg[k])
            }

            connections ().connect (this._add_row_btn, 'clicked', () => {
                const title = ''

                if (this._settings_cfg[title]) {
                    this.show_exists_error_toast (title)
                    return
                }

                const cfg = settings ().global_rounded_corner_settings
                this.add_row (title, cfg)

                this._settings_cfg[title] = cfg
            })
        }

        private add_row (
            title: string,
            cfg: RoundedCornersCfg
        ): Adw.ExpanderRow {
            const rounded_corners_item = new RoundedCornersItem ()

            const enabled_switch = new Switch ({
                valign: Align.CENTER,
                active: true,
            })

            rounded_corners_item.cfg = cfg
            enabled_switch.active = cfg.enabled

            const handler = {
                on_delete: (row) => {
                    const title = row.title

                    rounded_corners_item.unwatch ()
                    connections ().disconnect_all (enabled_switch)
                    this._custom_group.remove (row)

                    delete this._settings_cfg[title]
                    settings ().custom_rounded_corner_settings =
                        this._settings_cfg
                },
                on_title_changed: (old_title, new_title) => {
                    if (this._settings_cfg[new_title] !== undefined) {
                        this.show_exists_error_toast (new_title)
                        return false
                    }

                    const cfg = this._settings_cfg[old_title]
                    delete this._settings_cfg[old_title]
                    this._settings_cfg[new_title] = cfg

                    settings ().custom_rounded_corner_settings =
                        this._settings_cfg

                    return true
                },
                on_open: (row) => {
                    rounded_corners_item.watch ((cfg) => {
                        cfg.enabled = enabled_switch.active
                        this._on_cfg_changed (row.title, cfg)
                    })
                    connections ().connect (enabled_switch, 'state-set', () => {
                        const cfg = rounded_corners_item.cfg
                        cfg.enabled = enabled_switch.active
                        this._on_cfg_changed (row.title, cfg)
                        return false
                    })
                },
                on_close: () => {
                    rounded_corners_item.unwatch ()
                    connections ().disconnect_all (enabled_switch)
                },
            } as AppRowHandler

            const expanded_row = new AppRow ({ title }, handler)

            if (title == '') {
                expanded_row.subtitle = constants.TIPS_EMPTY
            }

            this._custom_group.add (expanded_row)

            const enabled_row = new Adw.ActionRow ({
                title: 'Enabled',
                subtitle: 'Enable custom settings for this window',
                activatable_widget: enabled_switch,
            })

            enabled_row.add_suffix (enabled_switch)

            add_row (expanded_row, enabled_row)

            list_children (rounded_corners_item)
                .filter ((child) => child.name != constants.DON_T_CONFIG)
                .forEach ((child) => {
                    rounded_corners_item.remove (child)
                    add_row (expanded_row, child)
                    enabled_switch.bind_property (
                        'active',
                        child,
                        'sensitive',
                        GObject.BindingFlags.SYNC_CREATE
                    )
                })

            return expanded_row
        }

        private show_exists_error_toast (title: string) {
            const tip =
                `'${title}': ` +
                'can\'t add into list, because this item has exists'
            show_err_msg (this.root, tip)
        }

        private _on_cfg_changed (k: string, v: RoundedCornersCfg) {
            this._settings_cfg[k] = v
            settings ().custom_rounded_corner_settings = this._settings_cfg
        }
    }
)

function add_row (parent: Adw.ExpanderRow, child: Widget) {
    try {
        parent.add_row (child)
    } catch (e) {
        // Use a fallback to add row when libadwaita <= 1.0
        const list = parent
            .get_first_child ()
            ?.get_first_child ()
            ?.get_next_sibling ()
            ?.get_first_child ()
        if (list instanceof ListBox) {
            list.append (child)
        } else {
            _log (
                'Adw.ExpanderRow.add_row() not exists and' +
                    ' fallback method is failed.'
            )
            throw e
        }
    }
}
