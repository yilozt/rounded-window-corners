import * as Gio from '@gi-types/gio2'

// auto generate by tsc:
// tsc -d --allowJs /path/to/source/of/gnome-shell/js/extensions/*

export class ExtensionBase {
    /**
     * Look up an extension by URL (usually 'import.meta.url')
     *
     * @param {string} url - a file:// URL
     */
    static lookupByURL(url: string): ExtensionBase;
    /**
     * Look up an extension by UUID
     *
     * @param {string} _uuid
     */
    static lookupByUUID(_uuid: string): void;
    /**
     * @param {object} metadata - metadata passed in when loading the extension
     */
    constructor(metadata: object);
    metadata: any;
    /**
     * @type {string}
     */
    get uuid(): string;
    /**
     * @type {Gio.File}
     */
    get dir(): Gio.File;
    /**
     * @type {string}
     */
    get path(): string;
    /**
     * Get a GSettings object for schema, using schema files in
     * extensionsdir/schemas. If schema is omitted, it is taken
     * from metadata['settings-schema'].
     *
     * @param {string=} schema - the GSettings schema id
     *
     * @returns {Gio.Settings}
     */
    getSettings(schema?: string | undefined): Gio.Settings;
    /**
     * Initialize Gettext to load translations from extensionsdir/locale. If
     * domain is not provided, it will be taken from metadata['gettext-domain']
     * if provided, or use the UUID
     *
     * @param {string=} domain - the gettext domain to use
     */
    initTranslations(domain?: string | undefined): void;
    /**
     * Translate `str` using the extension's gettext domain
     *
     * @param {string} str - the string to translate
     *
     * @returns {string} the translated string
     */
    gettext(str: string): string;
    /**
     * Translate `str` and choose plural form using the extension's
     * gettext domain
     *
     * @param {string} str - the string to translate
     * @param {string} strPlural - the plural form of the string
     * @param {number} n - the quantity for which translation is needed
     *
     * @returns {string} the translated string
     */
    ngettext(str: string, strPlural: string, n: number): string;
    /**
     * Translate `str` in the context of `context` using the extension's
     * gettext domain
     *
     * @param {string} context - context to disambiguate `str`
     * @param {string} str - the string to translate
     *
     * @returns {string} the translated string
     */
    pgettext(context: string, str: string): string;
    #private;
}
export class GettextWrapper {
    constructor(extensionClass: any, url: any);
    defineTranslationFunctions(): {
        /**
         * Translate `str` using the extension's gettext domain
         *
         * @param {string} str - the string to translate
         *
         * @returns {string} the translated string
         */
        gettext: any;
        /**
         * Translate `str` and choose plural form using the extension's
         * gettext domain
         *
         * @param {string} str - the string to translate
         * @param {string} strPlural - the plural form of the string
         * @param {number} n - the quantity for which translation is needed
         *
         * @returns {string} the translated string
         */
        ngettext: any;
        /**
         * Translate `str` in the context of `context` using the extension's
         * gettext domain
         *
         * @param {string} context - context to disambiguate `str`
         * @param {string} str - the string to translate
         *
         * @returns {string} the translated string
         */
        pgettext: any;
    };
    #private;
}
