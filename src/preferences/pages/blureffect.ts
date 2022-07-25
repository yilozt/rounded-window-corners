// imports.gi
import * as GObject          from '@gi/GObject'
import * as Adw              from '@gi/Adw'
import { SettingsBindFlags } from '@gi/Gio'

// local modules
import { template_url }      from '../../utils/io'
import settings              from '../../utils/settings'
import constants             from '../../utils/constants'
import { connections }       from '../../connections'
import { show_err_msg }      from '../../utils/prefs'
import appRow                from '../widgets/app-row'

// types
import * as Gtk              from '@gi/Gtk'
import { AppRowHandler }     from '../widgets/app-row'

// ----------------------------------------------------------------- end imports

// TODO: Setup guide

export const BlurEffect = GObject.registerClass (
    {
        Template: template_url (import.meta.url, './blureffect.ui'),
        GTypeName: 'BlurEffect',
        InternalChildren: [
            'opacity_ajustment',
            'sigma_ajustment',
            'add_row_btn',
            'blur_list',
        ],
    },
    class extends Adw.PreferencesPage {
        // Widgets from template ui
        private _opacity_ajustment !: Gtk.Adjustment
        private _sigma_ajustment   !: Gtk.Adjustment
        private _add_row_btn       !: Gtk.Button
        private _blur_list         !: Adw.PreferencesGroup

        /** List to store into settings  */
        private blur_list: string[] = []

        _init () {
            super._init ()
            this.blur_list = settings ().blur_list

            for (const title of this.blur_list) {
                this._add_row (title)
            }

            connections ().connect (this._add_row_btn, 'clicked', () => {
                if (this.blur_list.includes ('')) {
                    return
                }
                this._add_row ()
                this.blur_list.push ('')
                settings ().blur_list = this.blur_list
            })

            settings ().bind (
                'blur-sigma',
                this._sigma_ajustment,
                'value',
                SettingsBindFlags.DEFAULT
            )
            settings ().bind (
                'blurred-window-opacity',
                this._opacity_ajustment,
                'value',
                SettingsBindFlags.DEFAULT
            )
        }

        private _add_row (title = '') {
            const handler: AppRowHandler = {
                on_title_changed: (old_title, new_title) => {
                    if (this.blur_list.includes (new_title)) {
                        const title =
                            `[${new_title}] has been added into list` +
                            ', settings will not effect'
                        show_err_msg (this.root, title)
                        return false
                    }

                    const list = this.blur_list
                    list.splice (list.indexOf (old_title), 1, new_title)
                    settings ().blur_list = list

                    return true
                },
                on_delete: (row) => {
                    this._blur_list.remove (row)
                    const list = this.blur_list
                    list.splice (list.indexOf (row.title), 1)
                    settings ().blur_list = list
                },
            }

            const subtitle = title == '' ? constants.TIPS_EMPTY : ''
            this._blur_list.add (new appRow ({ title, subtitle }, handler))
        }
    }
)
