import * as Adw       from '@gi/Adw'

import { General }    from './pages/general.js'
import { Blacklist }  from './pages/blacklist.js'
import { Custom }     from './pages/custom.js'
import { BlurEffect } from './pages/blureffect.js'
import * as Client    from '../dbus/client.js'

// ----------------------------------------------------------------- end imports

/**
 * Prepare pages to show.
 * @returns PreferencesPages to shown in preferences window
 */
export const setup = (win: Adw.PreferencesWindow) => {
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
