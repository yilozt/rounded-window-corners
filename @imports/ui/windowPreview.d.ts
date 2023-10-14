import * as Shell from 'gi://Shell'
import * as Meta from 'gi://Meta'

export class WindowPreview extends Shell.WindowPreview  {
    [x: string]: any
    _addWindow (_: Meta.Window): void;
    _windowActor: Meta.WindowActor
}
