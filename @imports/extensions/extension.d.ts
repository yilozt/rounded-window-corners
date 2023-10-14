// auto generate by tsc:
// tsc -d --allowJs /path/to/source/of/gnome-shell/js/extensions/*

export class Extension extends ExtensionBase {
    static lookupByUUID(uuid: any): any;
    static defineTranslationFunctions(url: any): {
        gettext: any;
        ngettext: any;
        pgettext: any;
    };
    enable(): void;
    disable(): void;
    /**
     * Open the extension's preferences window
     */
    openPreferences(): void;
}
export const gettext: any;
export const ngettext: any;
export const pgettext: any;
export class InjectionManager {
    /**
     * @callback CreateOverrideFunc
     * @param {Function?} originalMethod - the original method if it exists
     * @returns {Function} - a function to be used as override
     */
    /**
     * Modify, replace or inject a method
     *
     * @param {object} prototype - the object (or prototype) that is modified
     * @param {string} methodName - the name of the overwritten method
     * @param {CreateOverrideFunc} createOverrideFunc - function to call to create the override
     */
    overrideMethod(prototype: object, methodName: string, createOverrideFunc: (originalMethod: Function | null) => Function): void;
    /**
     * Restore the original method
     *
     * @param {object} prototype - the object (or prototype) that is modified
     * @param {string} methodName - the name of the method to restore
     */
    restoreMethod(prototype: object, methodName: string): void;
    /**
     * Restore all original methods and clear overrides
     */
    clear(): void;
    _saveMethod(prototype: any, methodName: any): any;
    _installMethod(prototype: any, methodName: any, method: any): void;
    #private;
}
import { ExtensionBase } from './sharedInternals.js';
