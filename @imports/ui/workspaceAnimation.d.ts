import { Window, WindowActor } from 'gi://Meta'
import { Actor, Clone } from 'gi://Clutter'
import * as St from 'gi://St'

export class WorkspaceAnimationController {
    _movingWindow: Window;
    _switchData: {
        monitors: MonitorGroup[];
    };
    _swipeTracker: any;
    _prepareWorkspaceSwitch(workspaceIndices: Array<number>): void;
    _finishWorkspaceSwitch(switchData: typeof this._switchData): void;

}

export class WorkspaceGroup extends Actor {
    _windowRecords: Array<{
        windowActor: WindowActor,
        clone: Clone,
    }>
    _createWindows(): void;
    _removeWindows(): void;
    _syncStacking(): void;
    _shouldShowWindow(win: Window): boolean;
}

export class MonitorGroup extends St.Widget {
    _workspaceGroups: WorkspaceGroup []
}