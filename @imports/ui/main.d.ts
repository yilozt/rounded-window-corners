import { LookingGlass } from "./lookingGlass";
import * as GObject from 'gi://GObject'

export const createLookingGlass: () => LookingGlass;

export const sessionMode = {
    isLocked: boolean,
    isGreeter: boolean
}

declare const layoutManager: {
    _startingUp: boolean,
    connect (_: 'startup-complete', cb: () => void)
} & GObject.Object

declare const overview: {
    _overview: {
        controls: {
            _workspacesDisplay: {
                _leavingOverview: boolean
            }
        }
    }
}