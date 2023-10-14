import * as Gtk from 'gi://Gtk'

import { General } from '../preferences/pages/general.js'
import { BlackList } from '../preferences/pages/blacklist.js'
import { Custom } from '../preferences/pages/custom.js'
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

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
