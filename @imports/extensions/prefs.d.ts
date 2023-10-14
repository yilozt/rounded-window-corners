import * as Gtk from '@gi-types/gtk4'
import * as Adw from '@gi-types/adw1'

// auto generate by tsc:
// tsc -d --allowJs /path/to/source/of/gnome-shell/js/extensions/*

export class ExtensionPreferences extends ExtensionBase {
    static lookupByUUID(uuid: any): any;
    static defineTranslationFunctions(url: any): {
        gettext: any;
        ngettext: any;
        pgettext: any;
    };
    /**
     * Get the single widget that implements
     * the extension's preferences.
     *
     * @returns {Gtk.Widget}
     */
    getPreferencesWidget(): Gtk.Widget;
    /**
     * Fill the preferences window with preferences.
     *
     * The default implementation adds the widget
     * returned by getPreferencesWidget().
     *
     * @param {Adw.PreferencesWindow} window - the preferences window
     */
    fillPreferencesWindow(window: Adw.PreferencesWindow): void;
    _wrapWidget(widget: any): any;
}
export const gettext: any;
export const ngettext: any;
export const pgettext: any;
import { ExtensionBase } from './sharedInternals.js';
