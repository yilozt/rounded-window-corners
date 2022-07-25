// imports.gi
import * as GObject      from '@gi/GObject'
import * as Adw          from '@gi/Adw'

// Local Modules
import { _log }          from '../../utils/log'
import { template_url }  from '../../utils/io'
import { show_err_msg }  from '../../utils/prefs'
import settings          from '../../utils/settings'
import constants         from '../../utils/constants'
import { connections }   from '../../connections'
import BlackListRow      from '../widgets/app-row'

// types
import { AppRowHandler } from '../widgets/app-row'
import * as Gtk          from '@gi/Gtk'

// --------------------------------------------------------------- [end imports]

/** Black list Preferences Page */
export const Blacklist = GObject.registerClass (
    {
        Template: template_url (import.meta.url, './blacklist.ui'),
        GTypeName: 'Blacklist',
        InternalChildren: ['black_list_group', 'add_row_btn'],
    },
    class extends Adw.PreferencesPage {
        private _black_list_group !: Adw.PreferencesGroup
        private _add_row_btn      !: Gtk.Button

        /** Store value of settings */
        private black_list: Array<string> = []

        _init () {
            super._init ()
            this.black_list = []

            // Read blacklist from settings, and add it to this._black_list
            settings ().black_list.forEach ((name) => this.on_add_row (name))

            _log (this.black_list.toString ())

            connections ().connect (this._add_row_btn, 'clicked', () => {
                this.on_add_row ()
                settings ().black_list = this.black_list
            })
        }

        private show_err_msg (item: string) {
            const title = `"${item}": Can't add to list, because it has exists`
            show_err_msg (this.root, title)
        }

        // --------------------------------------------------- [signal handlers]

        private on_delete_row (row: Adw.ExpanderRow) {
            const title = row.title
            this.black_list.splice (this.black_list.indexOf (title), 1)
            settings ().black_list = this.black_list
            this._black_list_group.remove (row)
        }

        /** Add a row to black list */
        private on_add_row (title = '') {
            if (this.black_list.includes (title)) {
                this.show_err_msg (title)
                return
            }

            const handlers: AppRowHandler = {
                on_delete: (row) => this.on_delete_row (row),
                on_title_changed: (old_title, new_title) =>
                    this.on_title_changed (old_title, new_title),
            }

            const row = new BlackListRow ({ title }, handlers)

            if (!title) {
                row.subtitle = constants.TIPS_EMPTY
            }

            this._black_list_group.add (row)
            this.black_list.push (title)
        }

        /** Called when title of item need to changed  */
        on_title_changed (old_title: string, new_title: string): boolean {
            if (this.black_list.includes (new_title)) {
                this.show_err_msg (new_title)
                return false
            }

            const old_idx = this.black_list.indexOf (old_title)
            this.black_list.splice (old_idx, 1, new_title)

            settings ().black_list = this.black_list

            return true
        }
    }
)
