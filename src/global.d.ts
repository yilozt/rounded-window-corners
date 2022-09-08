// @ts-ignore

import { Global, BlurMode } from '@gi/Shell'
import { Effect }           from '@gi/Clutter'
import * as Adw             from '@gi/Adw'
import * as windowPreview   from '@imports/ui/windowPreview'
declare const global: Global,
    log: any,
    logError: any,
    _: (arg: string) => string

declare const imports = {
    gi: { Adw },
    ui: { windowPreview },
}

declare const Me: {
    path: string
}

type PreferencesWindow = Adw.PreferencesWindow
