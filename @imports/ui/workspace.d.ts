import { Window } from '../../@gi/Meta'
import { WindowPreview } from 'windowPreview'
import { Actor } from '@gi/Clutter';

export class Workspace extends Actor {
    _addWindowClone(metaWindow: Window): WindowPreview;
    _removeWindowClone(metaWin: Window): WindowPreview?;
    _windows: WindowPreview[];
}
