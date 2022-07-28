// local modules
import { General }   from './pages/general.js'
import { Blacklist } from './pages/blacklist.js'
import { Custom }    from './pages/custom.js'
import Connections   from '../utils/connections.js'

// ----------------------------------------------------------------- end imports

export const pages = () => [new General (), new Blacklist (), new Custom ()]
export const connections = Connections
