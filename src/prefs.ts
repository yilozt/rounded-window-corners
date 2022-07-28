import * as Adw from '@gi/Adw'

export function init () {
    // TODO: Add i18n initialize in here
}

/**
 * Loader of preferences pages, we will fill `window` with pages export
 * from ./preferences/index.ts
 * @param window Preferences Window to show
 */
export function fillPreferencesWindow (window: Adw.PreferencesWindow) {
    // Loading text...
    const loading = new Adw.PreferencesPage ()
    const group = new Adw.PreferencesGroup ({ title: 'Loading....' })
    loading.add (group)
    window.add (loading)

    window.search_enabled = true

    // Load module async
    import ('./preferences/index.js').then ((index) => {
        window.remove (loading)
        index.pages ().forEach ((page) => {
            window.add (page)
        })
        window.connect ('close-request', () => {
            index.connections.get ().disconnect_all ()
            index.connections.del ()
        })
    })
}
