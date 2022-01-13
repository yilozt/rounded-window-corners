/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = "my-indicator-extension";

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const { GObject, Clutter, Cogl, St, GLib } = imports.gi;
const { Log } = Me.imports.utils;

const _ = ExtensionUtils.gettext;

var COGL_CTX = null;

const EmptyActor = GObject.registerClass(
  class EmptyActor extends Clutter.Actor {
    _init(constructorProperis = {}) {
      super._init(constructorProperis);
    }

    vfunc_paint(paint_ctx) {
      if (COGL_CTX === null) {
        COGL_CTX = paint_ctx.get_framebuffer().get_context();
      }
      super.vfunc_paint(paint_ctx);
    }
  }
);

class Extension {
  constructor(uuid) {
    this._uuid = uuid;
    this.connections = [];
    ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
  }

  enable() {
    Log("enabled");
    this.empty_actor = new EmptyActor();
    global.stage.add_actor(this.empty_actor);
    this.empty_actor.show();

    this.handler = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
      if (COGL_CTX != null) {
        Log("!!!" + COGL_CTX);
        return false;
      }
      return true;
    });
  }

  disable() {
    Log("disable");
    global.stage.remove_actor(this.empty_actor);
    this.empty_actor.destroy();
    this.empty_actor = null;
    COGL_CTX = null;
  }
}

function init(meta) {
  return new Extension(meta.uuid);
}
