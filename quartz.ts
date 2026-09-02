import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypes } from "./quartz/plugins"
import { InheritorHero, InheritorCards } from "./quartz/components/InheritorHome"
import InheritorLinks from "./quartz/components/InheritorLinks"
import InheritorDice from "./quartz/components/InheritorDice"

// -----------------------------------------------------------------------------
// Standard load. Note: loadQuartzConfig() builds its own layout internally and
// hands it to the PageTypeDispatcher emitter, so the `layout` export from this
// file is NOT what gets rendered. To add local components we rebuild the
// layout, append to it, and swap the dispatcher.
// -----------------------------------------------------------------------------
const config = await loadQuartzConfig()

const layout = await loadQuartzLayout()

const hero = InheritorHero()
const cards = InheritorCards()
const links = InheritorLinks()
const dice = InheritorDice()

for (const slot of [layout.defaults, ...Object.values(layout.byPageType)]) {
  slot.beforeBody = [...(slot.beforeBody ?? []), hero]
  slot.afterBody = [...(slot.afterBody ?? []), cards]
  slot.left = [...(slot.left ?? []), links]
  slot.header = [...(slot.header ?? []), dice]
}

const i = config.plugins.emitters.findIndex((e) => e.name === "PageTypeDispatcher")
const dispatcher = PageTypes.PageTypeDispatcher({
  defaults: layout.defaults,
  byPageType: layout.byPageType,
})
if (i >= 0) config.plugins.emitters[i] = dispatcher
else config.plugins.emitters.push(dispatcher)

export default config
export { layout }
