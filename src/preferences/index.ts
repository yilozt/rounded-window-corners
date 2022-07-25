imports.gi.versions.Gtk = '4.0'
imports.gi.versions.Gdk = '4.0'

// imports.gi
import * as Adw          from '@gi/Adw'
import * as Gdk          from '@gi/Gdk'
import * as Gtk          from '@gi/Gtk'
import * as Notify       from '@gi/Notify'
import { registerClass } from '@gi/GObject'

// local modules
import { General }       from './pages/general.js'
import { Blacklist }     from './pages/blacklist.js'
import { Custom }        from './pages/custom.js'
import { BlurEffect }    from './pages/blureffect.js'
import * as Client       from '../dbus/client.js'
import { _log }          from '../utils/log.js'

// types
import { imports }       from '@global'

// ----------------------------------------------------------------- end imports

const Prefs = registerClass (
    {},
    class extends Adw.Application {
        private win !: Adw.PreferencesWindow

        _init () {
            super._init ()
            this.application_id = 'yi.github.rounded_corners_effect.prefs'
        }

        /** Prepare pages to show.*/
        setup (win: Adw.PreferencesWindow) {
            const general = new General ()
            win.add (general)
            win.add (new Blacklist ())
            win.add (new Custom ())

            // dynamic load pages according to the status of
            // blur effect

            const loaded = () => {
                win.add (new BlurEffect ())
                general.on_blur_loaded ()
            }

            if (Client.has_blur_loaded ()) {
                loaded ()
            } else {
                Client.on_blur_loaded (() => loaded ())
            }
        }

        vfunc_activate (): void {
            super.vfunc_activate ()
            if (!this.win) {
                this.win = new Adw.PreferencesWindow ({
                    application: this,
                    title: 'Preferences Page',
                })
                this.setup (this.win)
            }
            this.win.present ()
        }

        vfunc_startup (): void {
            super.vfunc_startup ()

            Notify.init (this.application_id)

            const css = new Gtk.CssProvider ()
            css.load_from_data (
                '' +
                    '.code { padding: 10px 16px;}' +
                    '.edit-win { background: #eeeeee; color: black; }'
            )
            const display = Gdk.Display.get_default ()
            if (display) {
                Gtk.StyleContext.add_provider_for_display (display, css, 1024)
            }
        }
    }
)

new Prefs ().run ([])

_log ('Hello')
