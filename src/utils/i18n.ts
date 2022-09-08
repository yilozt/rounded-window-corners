import * as extUtils from '@imports/misc/extensionUtils'

const { uuid } = extUtils.getCurrentExtension ()
export const init_translations = () => {
    extUtils.initTranslations (uuid)
}

imports.gettext.textdomain (uuid)
export const _ = imports.gettext.domain (uuid).gettext
export const ngettext = imports.gettext.domain (uuid).ngettext

declare const imports: {
    gettext: {
        textdomain(str: string): void
        domain: (str: string) => {
            gettext(str: string): string
            ngettext(str: string, strPlural: string, n: number): string
        }
        bindtextdomain(domain: string, path: string): void
    }
}
