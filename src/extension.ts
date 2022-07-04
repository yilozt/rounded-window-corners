import { global, log } from 'mod'

import { Workspace } from '@ui/workspace'
import { Window } from '@gi/meta'
import { Bin } from '@gi/st'
import { Point } from '@gi/graphene'
import { BindConstraint, BindCoordinate, Clone } from '@gi/clutter'

import { WindowPreview } from '@ui/windowPreview'
import { WorkspaceGroup } from '@ui/workspaceAnimation'

import { GrayEffect } from '@me/effect/GrayEffect'
import { RoundedCornersEffect } from '@me/effect/RoundedCornersEffect'

class Extension {
  private _uuid: string

  private _origAddWindowClone!: (arg0: Window) => WindowPreview
  private _origCreateWindows!: () => void
  private _origRemoveWindows!: () => void

  private _maps: Map<Window, {
    shadow: Bin,
    shadowOverview: Clone | null, shadowSwitching: Clone | null
  }> = new Map ()

  constructor (uuid: string) {
    this._uuid = uuid
  }

  enable () {
    const extensionThis = this

    log (RoundedCornersEffect)

    extensionThis._origAddWindowClone = Workspace.prototype._addWindowClone
    extensionThis._origCreateWindows  = WorkspaceGroup.prototype._createWindows
    extensionThis._origRemoveWindows  = WorkspaceGroup.prototype._removeWindows

    Workspace.prototype._addWindowClone = function (metaWindow) {
      const clone: WindowPreview =
        extensionThis._origAddWindowClone.apply (this, [metaWindow])
      const windowContainer = clone.window_container

      const shadowActor = new Bin ({
        pivot_point: new Point ({ x: 0.5, y: 0.5 })
      })
      shadowActor.style = 'background: rgba(1.0, 0.0, 0.0, 0.0);'

      windowContainer.bind_property ('size', shadowActor, 'size', 0)
      windowContainer.bind_property ('scale-x', shadowActor, 'scale-x', 0)
      windowContainer.bind_property ('scale-y', shadowActor, 'scale-y', 0)

      clone.insert_child_above (shadowActor, windowContainer)

      if (metaWindow != undefined) {
        extensionThis._maps.set (metaWindow, {
          shadow: shadowActor, shadowOverview: null, shadowSwitching: null
        })
      }

      return clone
    }

    WorkspaceGroup.prototype._createWindows = function () {
      extensionThis._origCreateWindows.apply (this)

      this._windowRecords.forEach (({ windowActor, clone }) => {
        const shadows = extensionThis._maps.get (windowActor.meta_window)
        if (shadows) {
          shadows.shadowSwitching = new Clone ({
            source: shadows.shadow,
            x: windowActor.x,
            y: windowActor.y
          })

          clone.get_parent ()?.insert_child_above (shadows.shadowSwitching, clone)
        }
      })
    }

    WorkspaceGroup.prototype._removeWindows = function () {
      for (const { windowActor, clone } of this._windowRecords) {
        const metaWindow = windowActor.metaWindow

        const parent = clone.get_parent ()
        const item = extensionThis._maps.get (metaWindow)
        if (parent && item) {
          if (item.shadowSwitching) {
            clone.remove_child (item.shadowSwitching)
          }
        }
        extensionThis._maps.delete (metaWindow)
      }
      extensionThis._origRemoveWindows.apply (this)
    }

    global.window_manager.connect ('map', (shellWm, actor) => {
      actor.first_child.add_effect (new GrayEffect ())

      const shadowActor = new Bin ({
        pivot_point: new Point ({ x: 0.5, y: 0.5 })
      })
      shadowActor.style =
      'background: rgba(${Math.random()}, ${Math.random()}, ${Math.random()}, 0.5);'

      const frameRect = actor.metaWindow.get_frame_rect ()

      log (`frame_rect = ${frameRect.x} | actor.x = ${actor.x}`)

      shadowActor.add_constraint (new BindConstraint ({
        source: actor, coordinate: BindCoordinate.X, offset: frameRect.x - actor.x
      }))
      shadowActor.add_constraint (new BindConstraint ({
        source: actor, coordinate: BindCoordinate.Y, offset: frameRect.y - actor.y
      }))
      shadowActor.add_constraint (new BindConstraint ({
        source: actor, coordinate: BindCoordinate.WIDTH,
        offset: frameRect.width - actor.width
      }))
      shadowActor.add_constraint (new BindConstraint ({
        source: actor, coordinate: BindCoordinate.HEIGHT,
        offset: frameRect.height - actor.height
      }))
      shadowActor.bind_property ('visible', actor, 'visible', 0)

      actor.connect ('destroy', () => shadowActor.destroy ())
      shadowActor.visible = actor.visible

      actor.get_parent ()?.insert_child_above (shadowActor, actor)

      actor.bind_property ('scale-x', shadowActor, 'scale-x', 0)
      actor.bind_property ('scale-y', shadowActor, 'scale-y', 0)
    })
  }

  disable () {
    Workspace.prototype._addWindowClone = this._origAddWindowClone
    WorkspaceGroup.prototype._createWindows = this._origCreateWindows
    WorkspaceGroup.prototype._removeWindows = this._origRemoveWindows
  }
}

export function init (meta: {uuid: string}): Extension {
  return new Extension (meta.uuid)
}
