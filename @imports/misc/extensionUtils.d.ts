import * as Gio from '../../@gi/Gio'

/**
 * getCurrentExtension:
 *
 * @returns {?object} - The current extension, or null if not called from
 * an extension.
 */
declare function getCurrentExtension(): object | null;
/**
 * initTranslations:
 * @param {string=} domain - the gettext domain to use
 *
 * Initialize Gettext to load translations from extensionsdir/locale.
 * If @domain is not provided, it will be taken from metadata['gettext-domain']
 */
declare function initTranslations(domain?: string | undefined): void;
/**
 * gettext:
 * @param {string} str - the string to translate
 *
 * Translate @str using the extension's gettext domain
 *
 * @returns {string} - the translated string
 *
 */
declare function gettext(str: string): string;
/**
 * ngettext:
 * @param {string} str - the string to translate
 * @param {string} strPlural - the plural form of the string
 * @param {number} n - the quantity for which translation is needed
 *
 * Translate @str and choose plural form using the extension's
 * gettext domain
 *
 * @returns {string} - the translated string
 *
 */
declare function ngettext(str: string, strPlural: string, n: number): string;
/**
 * pgettext:
 * @param {string} context - context to disambiguate @str
 * @param {string} str - the string to translate
 *
 * Translate @str in the context of @context using the extension's
 * gettext domain
 *
 * @returns {string} - the translated string
 *
 */
declare function pgettext(context: string, str: string): string;
declare function callExtensionGettextFunc(func: any, ...args: any[]): any;
/**
 * getSettings:
 * @param {string=} schema - the GSettings schema id
 * @returns {Gio.Settings} - a new settings object for @schema
 *
 * Builds and returns a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is omitted, it is taken from
 * metadata['settings-schema'].
 */
declare function getSettings(schema?: string | undefined): Gio.Settings;
/**
 * openPrefs:
 *
 * Open the preference dialog of the current extension
 */
declare function openPrefs(): void;
declare function isOutOfDate(extension: any): boolean;
declare function serializeExtension(extension: any): {};
declare function deserializeExtension(variant: any): {
    metadata: {};
};
declare function installImporter(extension: any): void;
declare const Gettext: any;
declare const Config: any;
declare namespace ExtensionType {
    const SYSTEM: number;
    const PER_USER: number;
}
declare namespace ExtensionState {
    const ENABLED: number;
    const DISABLED: number;
    const ERROR: number;
    const OUT_OF_DATE: number;
    const DOWNLOADING: number;
    const INITIALIZED: number;
    const UNINSTALLED: number;
}
declare const SERIALIZED_PROPERTIES: string[];
