// =============================================================================
// INHERITOR — dice roller
// Renders nothing; registers the drawer script. The drawer builds its own DOM.
// =============================================================================

import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore — .inline.ts files are loaded as text by Quartz's build
import script from "./scripts/inheritor-dice.inline"

const Dice: QuartzComponent = () => null
Dice.afterDOMLoaded = script

export default (() => Dice) satisfies QuartzComponentConstructor
