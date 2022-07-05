import { log, logError } from '@global'

// https://patorjk.com/software/taag
export const loadedMsg = `
╦═╗┌─┐┬ ┬┌┐┌┌┬┐┌─┐┌┬┐╔═╗┌─┐┬─┐┌┬┐┌─┐┬─┐┌─┐╔═╗┌─┐┌─┐┌─┐┌─┐┌┬┐┌─┐
╠╦╝│ ││ ││││ ││├┤  ││║  │ │├┬┘ ││├┤ ├┬┘└─┐║╣ ├┤ ├┤ ├┤ │   │ └─┐
╩╚═└─┘└─┘┘└┘─┴┘└─┘─┴┘╚═╝└─┘┴└──┴┘└─┘┴└─└─┘╚═╝└  └  └─┘└─┘ ┴ └─┘

[RoundedCordersEffect] Loaded successfully.`

export function loadFile (): string {
  log ('Module' + import.meta.url)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  aaaaaabbbccc
  return ''
}

export default { loadedMsg, loadFile }
