import { Window, WindowActor } from '@gi/meta'
import { Actor, Clone } from '@gi/clutter'

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
}
