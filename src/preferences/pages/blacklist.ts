// imports.gi
import * as GObject     from '@gi/GObject'
import * as Adw         from '@gi/Adw'

// Local Modules
import { template_url } from '../../utils'
import settings         from '../../settings'
import blackListRow     from '../widgets/black-list-row'

// ---------------------------------------------------------------- End imports

/** Black list Preferences Page */
export const Blacklist = GObject.registerClass (
    {
        Template: template_url (import.meta.url, './blacklist.ui'),
        GTypeName: 'Blacklist',
        InternalChildren: ['black_list_group'],
    },
    class extends Adw.PreferencesPage {
        private _black_list_group !: Adw.PreferencesGroup

        constructor () {
            super ()

            // Read blacklist from settings
            settings ().black_list.forEach ((wm_instance) =>
                this._black_list_group.add (
                    new blackListRow ({ title: wm_instance })
                )
            )
        }
    }
)
