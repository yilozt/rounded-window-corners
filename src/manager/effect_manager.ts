// imports.gi
import * as Clutter              from '@gi/Clutter'
import { Source, timeout_add }   from '@gi/GLib'
import * as Graphene             from '@gi/Graphene'

// local modules
import { _log }                  from '@me/utils/log'
import { settings }              from '@me/utils/settings'
import { Connections }           from '@me/utils/connections'
import { RoundedCornersManager } from '@me/manager/rounded_corners_manager'

// types, those import statements will be removed in output javascript files.
import { SchemasKeys }           from '@me/utils/settings'
import { EffectManager }         from '@me/utils/types'
import { ExtensionsWindowActor } from '@me/utils/types'
import { WindowActor, Window }   from '@gi/Meta'
import { WM }                    from '@gi/Shell'
import { global }                from '@global'
import * as Gio                  from '@gi/Gio'
import { Display }               from '@gi/Meta'

// --------------------------------------------------------------- [end imports]

export class WindowActorTracker {
  private effect_managers: EffectManager[] = []

  /**
   * connections store connect handles of GObject, so that we can call
   * disconnect_all() to disconnect all signals when extension disabled
   */
  private connections: Connections | null = null
  private timeout_id = 0

  // ---------------------------------------------------------- [public methods]

  private run (exec: (m: EffectManager) => void) {
    this.effect_managers.filter ((m) => m.enabled).forEach ((m) => exec (m))
  }

  /** Call When enable extension */
  enable () {
    this.connections = new Connections ()
    this.effect_managers = [new RoundedCornersManager ()]

    // watch settings
    this.connections.connect (
      settings ().g_settings,
      'changed',
      (_: Gio.Settings, key: string) =>
        this.run ((m) => m.on_settings_changed (key as SchemasKeys))
    )

    const wm = global.window_manager

    // Add effects to all windows when extensions enabled
    const window_actors = global.get_window_actors ()
    _log (`Windows count when enable: ${window_actors.length}`)
    for (const actor of window_actors) {
      this._add_effect (actor)
    }

    // Add effects when window opened
    this.connections.connect (
      global.display,
      'window-created',
      (_: Display, win: Window) => {
        const actor: WindowActor = win.get_compositor_private ()

        // If wm_class_instance of Meta.Window is null, try to add rounded
        // corners when wm_class_instance is set
        if (win?.get_wm_class_instance () == null) {
          const notify_id = win.connect ('notify::wm-class', () => {
            this._add_effect (actor)
            win.disconnect (notify_id)
          })
        } else {
          this._add_effect (actor)
        }
      }
    )

    // Connect 'minimized' signal
    this.connections.connect (wm, 'minimize', (_: WM, actor: WindowActor) => {
      this.run ((m) => m.on_minimize (actor))
    })

    // Restore visible of shadow when un-minimized
    this.connections.connect (wm, 'unminimize', (_: WM, actor: WindowActor) => {
      // Handle visible of shader with Compiz alike magic lamp effect
      // After MagicLampUnminimizeEffect completed, then show shadow
      //
      // https://github.com/hermes83/compiz-alike-magic-lamp-effect
      const effect = actor.get_effect ('unminimize-magic-lamp-effect')
      if (effect) {
        type Effect = Clutter.Effect & { timerId: Clutter.Timeline }
        const timer_id = (effect as Effect).timerId

        const id = timer_id.connect ('new-frame', (source) => {
          // Effect completed when get_process() touch 1.0
          // Need show shadow here
          if (source.get_progress () > 0.98) {
            _log ('Handle Unminimize with Magic Lamp Effect')

            this.run ((m) => m.on_unminimize (actor))
            source.disconnect (id)
          }
        })
        return
      }

      this.run ((m) => m.on_unminimize (actor))
    })

    // Disconnect all signals of window when closed
    this.connections.connect (wm, 'destroy', (_: WM, actor: WindowActor) =>
      this._remove_effect (actor)
    )

    // When windows restacked, change order of shadow actor too
    this.connections.connect (global.display, 'restacked', () => {
      global.get_window_actors ().forEach ((actor) => {
        if (!actor.visible) {
          return
        }
        this.run ((m) => m.on_restacked (actor))
      })
    })
  }

  /** Call when extension is disabled */
  disable () {
    // Remove rounded effect and shadow actor for all windows
    global.get_window_actors ().forEach ((actor) => this._remove_effect (actor))

    // Disconnect all signal
    this.connections?.disconnect_all ()
    this.connections = null

    // Remove main loop resource
    Source.remove (this.timeout_id)
  }

  // ------------------------------------------------------- [private methods]
  /**
   * Add rounded corners effect and setup shadow actor for a window actor
   * @param actor - window to add effect
   */
  private _add_effect (actor: ExtensionsWindowActor) {
    const actor_is_ready = () => {
      if (!this.connections) {
        return
      }

      this.connections.connect (actor.get_texture (), 'size-changed', () => {
        this.run ((m) => m.on_size_changed (actor))
      })

      actor.__rwc_last_size = Graphene.Size.zero ()
      this.connections.connect (actor, 'notify::size', () => {
        const last_size = actor.__rwc_last_size as Graphene.Size
        if (!last_size.equal (actor.size)) {
          last_size.width = actor.size.width
          last_size.height = actor.size.height

          _log ('Size changed')
          this.run ((m) => m.on_size_changed (actor))
        }
      })

      // Update shadow actor when focus of window has changed.
      this.connections.connect (
        actor.meta_window,
        'notify::appears-focused',
        () => {
          this.run ((m) => m.on_focus_changed (actor))
        }
      )

      // When window is switch between different monitor,
      // 'workspace-changed' signal emit.
      this.connections.connect (actor.meta_window, 'workspace-changed', () => {
        this.run ((m) => m.on_focus_changed (actor))
      })

      // Update shadows and rounded corners bounds
      this.run ((m) => {
        m.on_add_effect (actor)
        m.on_size_changed (actor)
        m.on_focus_changed (actor)
      })
    }

    if (actor.first_child) {
      this.timeout_id = timeout_add (0, 500, () => {
        actor_is_ready ()
        return false
      })
    } else {
      // In wayland session, Surface Actor of XWayland client not ready when
      // window created, waiting it
      const id = actor.connect ('notify::first-child', () => {
        // now it's ready
        actor_is_ready ()
        actor.disconnect (id)
      })
    }
  }

  private _remove_effect (actor: ExtensionsWindowActor) {
    delete actor.__rwc_last_size

    if (this.connections) {
      this.connections.disconnect_all (actor.get_texture ())
      this.connections.disconnect_all (actor)
      this.connections.disconnect_all (actor.meta_window)
    }
    this.run ((m) => m.on_remove_effect (actor))
  }
}
