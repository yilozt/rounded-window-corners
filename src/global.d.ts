// @ts-ignore

import { Global, BlurMode } from '@gi/Shell'
import { Effect }           from '@gi/Clutter'
import * as Adw             from '@gi/Adw'
declare const global: Global,
    log: any,
    logError: any,
    _: (arg: string) => string

declare const imports = {
    gi: {
        Adw: Adw,
    },
}

type PreferencesWindow = Adw.PreferencesWindow
