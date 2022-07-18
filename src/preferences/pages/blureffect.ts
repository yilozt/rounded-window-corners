// imports.gi
import * as GObject     from '@gi/GObject'
import * as Adw         from '@gi/Adw'

// local modules
import { template_url } from '../../utils'

// ----------------------------------------------------------------- end imports

export const BlurEffect = GObject.registerClass (
    {
        Template: template_url (import.meta.url, './blureffect.ui'),
        GTypeName: 'BlurEffect',
    },
    class extends Adw.PreferencesPage {}
)
