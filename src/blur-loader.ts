import * as GLib       from '@gi/GLib'
import * as GObject    from '@gi/GObject'
import * as Gio        from '@gi/Gio'
import { Repository }  from '@gi/GIRepository'
import { _log }        from './utils/log'
import { connections } from './connections'

// types
import { imports }     from '@global'

const home_dir = GLib.get_home_dir ()

/**
 * Path to search blur effect.
 */
const search_paths = [
    `${home_dir}/.local/lib/patched-blur-effect`,
    `${home_dir}/.local/lib64/patched-blur-effect`,
    '/usr/lib64/patched-blur-effect',
]

/**
 * This class is used Load and watch the patched blur effect
 */
export default GObject.registerClass (
    { Signals: { loaded: {} } },
    class extends GObject.Object {
        monitors: Gio.FileMonitor[] = []

        enable () {
            // Load third party library by add them into search path of
            // GIRepository.Repository. this method is according to this
            // github gist:
            // https://gist.github.com/buzztaiki/1492431

            const path = '/usr/lib64/patched-blur-effect'
            if (!Repository.get_search_path ().includes (path)) {
                for (const search_path of search_paths) {
                    Repository.prepend_library_path (search_path)
                    Repository.prepend_search_path (search_path)
                }
            }

            // test imports
            try {
                this.test_imports ()
            } catch (e) {
                // if loaded failed, watch those paths to waiting user
                // setup effect
                this.watch ()
            }
        }

        private test_imports () {
            _log ('Testing....')
            const lib = imports.gi.Patched
            _log (lib)
            _log ('imports.gi.Patched.BlurEffect has been loaded')
            // emit loaded signal,
            this.emit ('loaded')
        }

        /** Watch files, until effect has been loaded  */
        private watch () {
            _log ('Failed to load imports.gi.Patched.BlurEffect, watching ....')
            const flag = Gio.FileMonitorFlags.WATCH_MOVES
            this.monitors = search_paths.map ((p) =>
                Gio.File.new_for_path (p).monitor (flag, null)
            )
            for (const monitor of this.monitors) {
                connections ().connect (monitor, 'changed', () => {
                    _log ('Changed.....')
                    try {
                        this.test_imports ()
                        for (const m of this.monitors) {
                            connections ().disconnect_all (m)
                        }
                        this.monitors.length = 0
                    } catch (e) {
                        /** do nothing */
                    }
                })
            }
        }
    }
)
