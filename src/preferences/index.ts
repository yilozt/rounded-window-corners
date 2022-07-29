imports.gi.versions.Gtk = '3.0'
imports.gi.versions.Gdk = '3.0'

// imports.gi
import * as Hdy          from '@gi/Handy'
import * as Gdk          from '@gi/Gdk'
import * as Gtk          from '@gi/Gtk'
import * as Notify       from '@gi/Notify'
import { registerClass } from '@gi/GObject'

// local modules
import { General }       from './pages/general.js'
import { Blacklist }     from './pages/blacklist.js'
import { Custom }        from './pages/custom.js'
import { _log }          from '../utils/log.js'

// types
import { imports }       from '@global'

// ----------------------------------------------------------------- end imports

const Prefs = registerClass (
    {},
    class extends Gtk.Application {
        private win !: Hdy.PreferencesWindow

        _init () {
            super._init ()
            this.application_id = 'yi.github.rounded_corners_effect.prefs'
        }

        /** Prepare pages to show.*/
        setup (win: Hdy.PreferencesWindow) {
            win.add (new General ())
            win.add (new Blacklist ())
            win.add (new Custom ())
        }

        vfunc_activate (): void {
            super.vfunc_activate ()
            if (!this.win) {
                this.win = new Hdy.PreferencesWindow ({
                    application: this,
                    title: 'Preferences Page',
                })

                this.setup (this.win)
            }

            this.win.show_all ()
        }

        vfunc_startup (): void {
            super.vfunc_startup ()

            Hdy.init ()

            Notify.init (this.application_id)

            const css = new Gtk.CssProvider ()
            css.load_from_data (`
                .code { padding: 10px 16px;}
                .edit-win { background: #eeeeee; color: black; padding: 32px; }
                .flat { background: none; border: none;}`)
            const screen = Gdk.Screen.get_default ()
            if (screen) {
                Gtk.StyleContext.add_provider_for_screen (
                    screen,
                    css,
                    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
                )
            }
        }
    }
)

new Prefs ().run ([])

_log ('Prefs exited')
