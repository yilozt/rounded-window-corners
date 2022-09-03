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
    __modulePath__: string,
    __moduleName__: string,
    __parentModule__: string,
}

declare const Me: {
    path: string
}

type PreferencesWindow = Adw.PreferencesWindow
