// imports.gi
import * as GObject                    from '@gi/GObject'
import * as Gtk                        from '@gi/Gtk'

// local modules
import { list_children, show_err_msg } from '@me/utils/prefs'
import { constants }                   from '@me/utils/constants'
import { settings }                    from '@me/utils/settings'
import { connections }                 from '@me/utils/connections'
import { _ }                           from '@me/utils/i18n'
import { AppRowHandler, AppRow }       from '@me/preferences/widgets/app_row'
import { RoundedCornersItem }          from '@me/preferences/widgets/rounded_corners_item'

// types
import { Align, Switch }               from '@gi/Gtk'
import { Button, Widget }              from '@gi/Gtk'

// import { AppRowHandler }               from '../../../widgets/app-row'
import { CustomRoundedCornersCfg }     from '../../utils/types'
import { RoundedCornersCfg }           from '../../utils/types'
import { Me }                          from '@global'

// --------------------------------------------------------------- [end imports]

export const Custom = GObject.registerClass (
  {
    Template: `file://${Me.path}/preferences/pages/custom.ui`,
    GTypeName: 'RoundedWindowCornersPrefsCustomPage',
    InternalChildren: ['custom_group', 'add_row_btn'],
  },
  class extends Gtk.Box {
    private _custom_group !: Gtk.ListBox
    private _add_row_btn  !: Button

    private _settings_cfg !: CustomRoundedCornersCfg

    _init () {
      super._init ()
      this._settings_cfg = settings ().custom_rounded_corner_settings

      for (const k in this._settings_cfg) {
        this.add_row (k, this._settings_cfg[k])
      }

      connections.get ().connect (this._add_row_btn, 'clicked', () => {
        const title = ''

        if (this._settings_cfg[title]) {
          this.show_exists_error_toast (title)
          return
        }

        const cfg = settings ().global_rounded_corner_settings
        this.add_row (title, cfg)

        this._settings_cfg[title] = cfg
      })
    }

    private add_row (
      title: string,
      cfg: RoundedCornersCfg
    ): InstanceType<typeof AppRow> {
      let rounded_corners_item: RoundedCornersItemType | null =
        new RoundedCornersItem ()

      const enabled_switch = new Switch ({
        valign: Align.CENTER,
        active: true,
        visible: true,
      })
      ;(rounded_corners_item as RoundedCornersItemType).cfg = cfg
      enabled_switch.active = cfg.enabled

      const handler = {
        on_delete: (row, title) => {
          if (rounded_corners_item != null) {
            const paddings_row = rounded_corners_item._paddings_row
            connections.get ().disconnect_all (paddings_row)
            rounded_corners_item.unwatch ()
            connections.get ().disconnect_all (enabled_switch)
            this._custom_group.remove (row)

            delete this._settings_cfg[title]
            settings ().custom_rounded_corner_settings = this._settings_cfg
          }
          rounded_corners_item = null
        },
        on_title_changed: (old_title, new_title) => {
          if (this._settings_cfg[new_title] !== undefined) {
            this.show_exists_error_toast (new_title)
            return false
          }

          const cfg = this._settings_cfg[old_title]
          delete this._settings_cfg[old_title]
          this._settings_cfg[new_title] = cfg

          settings ().custom_rounded_corner_settings = this._settings_cfg

          return true
        },
        on_open: (row) => {
          if (!rounded_corners_item) {
            return
          }
          const app_row = row as InstanceType<typeof AppRow>
          rounded_corners_item.watch ((cfg) => {
            cfg.enabled = enabled_switch.active
            this._on_cfg_changed (app_row.title, cfg)
          })
          connections.get ().connect (enabled_switch, 'state-set', () => {
            if (!rounded_corners_item) {
              return
            }
            const cfg = rounded_corners_item.cfg
            cfg.enabled = enabled_switch.active
            this._on_cfg_changed (app_row.title, cfg)
            return false
          })
          connections
            .get ()
            .connect (
              app_row._expanded_list_box,
              'row-activated',
              (me: Gtk.ListBox, row: Gtk.ListBoxRow) => {
                if (!rounded_corners_item) {
                  return
                }
                if (row == rounded_corners_item._paddings_row) {
                  rounded_corners_item.update_revealer ()
                }
              }
            )
        },
        on_close: () => {
          if (!rounded_corners_item) {
            return
          }
          connections.get ().disconnect_all (rounded_corners_item._paddings_row)
          rounded_corners_item.unwatch ()
          connections.get ().disconnect_all (enabled_switch)
        },
      } as AppRowHandler

      const expanded_row = new AppRow (handler)
      expanded_row.title = title
      expanded_row.activatable = false

      if (title == '') {
        expanded_row.description = constants.TIPS_EMPTY ()
      }

      this._custom_group.append (expanded_row)

      const enabled_row = this.create_enabled_row (enabled_switch)

      add_row (expanded_row, enabled_row)

      list_children (rounded_corners_item)
        .filter ((child) => child.name != constants.DON_T_CONFIG)
        .forEach ((child) => {
          rounded_corners_item?.remove (child)
          add_row (expanded_row, child)
          enabled_switch.bind_property (
            'active',
            child,
            'sensitive',
            GObject.BindingFlags.SYNC_CREATE
          )
        })

      return expanded_row
    }

    private show_exists_error_toast (title: string) {
      const tip =
        `'${title}': ` + 'can\'t add into list, because this item has exists'
      show_err_msg (tip)
    }

    private _on_cfg_changed (k: string, v: RoundedCornersCfg) {
      this._settings_cfg[k] = v
      settings ().custom_rounded_corner_settings = this._settings_cfg
    }

    private create_enabled_row (active_widget: Widget): Gtk.ListBoxRow {
      const row = new Gtk.ListBoxRow ()
      const title = new Gtk.Label ({
        label: _ ('Enable'),
        halign: Gtk.Align.START,
      })
      const description = new Gtk.Label ({
        label: _ ('Enable custom settings for this window'),
        halign: Gtk.Align.START,
        css_classes: ['caption'],
      })
      const hbox = new Gtk.Box ({
        valign: Gtk.Align.CENTER,
      })
      const vbox = new Gtk.Box ({
        orientation: Gtk.Orientation.VERTICAL,
        hexpand: true,
      })

      vbox.append (title)
      vbox.append (description)
      hbox.append (vbox)
      hbox.append (active_widget)
      row.set_child (hbox)

      return row
    }
  }
)

function add_row (parent: InstanceType<typeof AppRow>, child: Widget) {
  parent.add_row (child)
}

type RoundedCornersItemType = InstanceType<typeof RoundedCornersItem>
