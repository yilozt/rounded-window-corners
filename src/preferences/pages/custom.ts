// imports.gi
import * as GObject                    from '@gi/GObject'
import * as Adw                        from '@gi/Adw'

// local modules
import { list_children, template_url } from '../../utils'
import { _log as log }                 from '../../utils'
import BlacklistRow                    from '../widgets/black-list-row'
import RoundedCornersItem              from '../widgets/rounded-corners-item'

// types
import { Align, Switch }               from '@gi/Gtk'

// --------------------------------------------------------------- [end imports]

export const Custom = GObject.registerClass (
    {
        Template: template_url (import.meta.url, './custom.ui'),
        GTypeName: 'CustomPage',
        InternalChildren: ['custom_group'],
    },
    class extends Adw.PreferencesPage {
        private _custom_group !: Adw.PreferencesGroup

        constructor () {
            super ()

            this.add_row ()
        }

        private add_row () {
            const controls = new RoundedCornersItem ()

            const expanded_row = new BlacklistRow (
                {
                    title: 'Text',
                },
                {
                    on_delete: () => {
                        /***/
                    },
                    on_open: () => {
                        controls.watch ((cfg) => log (cfg))
                    },
                    on_close: () => {
                        controls.unwatch ()
                    },
                }
            )

            this._custom_group.add (expanded_row)

            const enabled_switch = new Switch ({
                valign: Align.CENTER,
                active: true,
            })

            const enabled_row = new Adw.ActionRow ({
                title: 'Enabled',
                subtitle: 'Enable custom settings for this window',
                activatable_widget: enabled_switch,
            })
            enabled_row.add_suffix (enabled_switch)

            expanded_row.add_row (enabled_row)

            list_children (controls).forEach ((child) => {
                controls.remove (child)
                expanded_row.add_row (child)
                enabled_switch.bind_property (
                    'active',
                    child,
                    'sensitive',
                    GObject.BindingFlags.DEFAULT
                )
            })
        }
    }
)
