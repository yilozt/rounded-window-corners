import * as St from '../../@gi/St'
import * as Clutter from '../../@gi/Clutter'

export class LookingGlass extends St.BoxLayout { }
export class Inspector extends Clutter.Actor {
    connect(signal: 'target', cb: (me: Inspector, target: Clutter.Actor, stageX: number, stageY: number) => void);
}