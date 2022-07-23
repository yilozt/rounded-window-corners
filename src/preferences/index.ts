import { General }    from './pages/general.js'
import { Blacklist }  from './pages/blacklist.js'
import { Custom }     from './pages/custom.js'
import { BlurEffect } from './pages/blureffect.js'

// ----------------------------------------------------------------- end imports

/**
 * Prepare pages to show.
 * @returns PreferencesPages to shown in preferences window
 */
export const pages = () => [
    new General (),
    new Blacklist (),
    new Custom (),
    new BlurEffect (),
]
