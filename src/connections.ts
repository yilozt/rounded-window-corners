// local modules
import { _log }     from './utils/log'

// Types
import * as GObject from '@gi/GObject'

// ---------------------------------------------------------------- [end import]

/**
 * This class is used to manager signal and handles of a object, one signal
 * only can be registered once.
 */
export class Connections {
    constructor () {
        try {
            throw new Error ()
        } catch (e) {
            _log (
                'Connection created in',
                (e as Error).stack
                    ?.split ('\n')
                    .map ((l) => l.split ('@')[0])
                    .join (',')
            )
        }
    }

    // -------------------------------------------------------- [public methods]

    /**
     * Map object to store signal sources and their handlers
     * @type {Map<GObject.Object, { [signal_name: string]: number }>}
     */
    private connections: _Map = new Map ()

    /**
     * Handler signal for a GObject
     *
     * ### Example:
     *
     * ```typescript
     * const manager = new Connections ()
     * manager.connect (global.window_manager, 'destroy', (wm, actor) =>
     *     console.log (`${actor} has been removed`)
     * )
     * ```
     * @param source - Signal source
     * @param args - Arguments pass into GObject.Object.connect()
     */
    connect<T extends GObject.Object>(source: T, ...args: Handler<T>): void
    connect(source: GObject.Object, ...args: DefaultHandler): void
    connect<T extends GObject.Object> (source: T, ...[signal, cb]: Handler<T>) {
        // Source has been added into manager
        {
            const handlers = this.connections.get (source)
            if (handlers !== undefined) {
                if (handlers[signal] !== undefined) {
                    const msg = `signal ${signal} of ${source} has been handled`
                    throw Error (msg)
                }
                handlers[signal] = source.connect (signal, cb)
                return
            }
        }

        // Source is first time register signal
        const handlers: { [signal: string]: number } = {}
        handlers[signal] = source.connect (signal, cb)
        this.connections.set (source, handlers)
    }

    disconnect<T extends GObject.Object>(
        source: T,
        signal: Parameters<T['connect']>[0]
    ): void
    disconnect(source: GObject.Object, signal: string): void
    /** Disconnect signal for source */
    disconnect<T extends GObject.Object> (
        source: T,
        signal: Parameters<T['connect']>[0]
    ) {
        const handlers = this.connections.get (source)
        if (handlers !== undefined) {
            const handler = handlers[signal]
            if (handler !== undefined) {
                source.disconnect (handler)
                delete handlers[signal]
                if (Object.keys (handler).length == 0) {
                    this.connections.delete (source)
                }
                return
            }
        }
    }

    /** Disconnect **all** signals for object */
    disconnect_all(source: GObject.Object): void

    /** Disconnect **all** signals for **all** objects */
    disconnect_all(): void

    disconnect_all (source?: GObject.Object) {
        // If provide source,  disconnect all signal of it
        if (source !== undefined) {
            const handlers = this.connections.get (source)
            if (handlers !== undefined) {
                Object.keys (handlers).forEach ((signal) => {
                    source.disconnect (handlers[signal])
                    delete handlers[signal]
                })
                this.connections.delete (source)
            }
            return
        }

        // otherwise clear signal for all objects.
        this.connections.forEach ((handlers, source) => {
            Object.keys (handlers).forEach ((signal) => {
                source.disconnect (handlers[signal])
                delete handlers[signal]
            })
        })
        this.connections.clear ()
    }
}

let _connections: Connections | null = null

/** A singleton of connections */
export const connections = () => {
    if (_connections === null) {
        _connections = new Connections ()
    }
    return _connections
}

//              Signal source     signal name            it's handler
type _Map = Map<GObject.Object, { [signal_name: string]: number }>

type Handler<T extends GObject.Object> = Parameters<T['connect']>
type DefaultHandler = [string, (_: unknown[]) => unknown]
