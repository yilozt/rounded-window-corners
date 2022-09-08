import * as Gtk      from '@gi/Gtk'

import { General }   from '@me/preferences/pages/general'
import { BlackList } from '@me/preferences/pages/blacklist'
import { Custom }    from '@me/preferences/pages/custom'
import { _ }         from '@me/utils/i18n'

type Page = { title: string; icon_name: string; widget: Gtk.Widget }

export const pages = (): Page[] => [
    {
        title: _ ('General'),
        icon_name: 'emblem-system-symbolic',
        widget: new General (),
    },
    {
        title: _ ('Blacklist'),
        icon_name: 'action-unavailable-symbolic',
        widget: new BlackList (),
    },
    {
        title: _ ('Custom'),
        icon_name: 'document-edit-symbolic',
        widget: new Custom (),
    },
]
