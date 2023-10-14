import * as St from 'gi://St'
import * as Clutter from 'gi://Clutter'
export class Inspector extends Clutter.Actor {
    constructor(looking_glass: any)
    connect(signal: 'closed', cb: any);
    open();
    connect(signal: 'target', cb: (me: Inspector, target: Clutter.Actor, stageX: number, stageY: number) => void);
}