import { Window, WindowActor } from '@gi/Meta'
import { Actor, Clone } from '@gi/Clutter'

export class WorkspaceAnimationController {
    _movingWindow: Window;
    _switchData: {
        monitors: any[];
        gestureActivated: boolean;
        inProgress: boolean;
    };
    _swipeTracker: any;
    _prepareWorkspaceSwitch(workspaceIndices: Array<number>): void;
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
