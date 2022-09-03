import * as Gtk      from '@gi/Gtk'

import { General }   from '@me/preferences/pages/general'
import { BlackList } from '@me/preferences/pages/blacklist'
import { Custom }    from '@me/preferences/pages/custom'

type Page = { title: string; icon_name: string; widget: Gtk.Widget }

export const pages = (): Page[] => [
    {
        title: 'General',
        icon_name: 'emblem-system-symbolic',
        widget: new General (),
    },
    {
        title: 'Blacklist',
        icon_name: 'action-unavailable-symbolic',
        widget: new BlackList (),
    },
    {
        title: 'Custom',
        icon_name: 'document-edit-symbolic',
        widget: new Custom (),
    },
]
