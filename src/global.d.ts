// @ts-ignore

import { Global, BlurMode } from '@gi/Shell'
import { Effect }           from '@gi/Clutter'

declare const global: Global,
    log: any,
    logError: any,
    imports: any,
    _: (arg: string) => string

declare class BlurEffect extends Effect {
    get_brightness(): number
    set_brightness(n: number)

    get_radius(): number
    set_radius(n: number)

    get_sigma(): number
    set_sigma(n: number)

    get_mode(): BlurMode
    set_mode(mode: BlurMode)

    // properties
    brightness: number
    mode: BlurMode
    sigma: number
    radius: number
}
