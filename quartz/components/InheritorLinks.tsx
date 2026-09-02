// =============================================================================
// INHERITOR — sidebar links (Discord, Itch, Ko-fi)
// Renders at the foot of the left sidebar. Edit the URLs here.
// =============================================================================

import { QuartzComponent, QuartzComponentConstructor } from "./types"

const LINKS = [
  { label: "Discord", href: "https://discord.gg/GwSV9qcEYa" },
  { label: "Itch.io", href: "https://grinningrat.itch.io/inheritor" },
]

const KOFI = { label: "Support the game", href: "https://ko-fi.com/V7V42V689" }

const Links: QuartzComponent = () => (
  <div class="inh-links">
    {LINKS.map((l) => (
      <a href={l.href} target="_blank" rel="noreferrer">
        {l.label}
        <span class="inh-arrow">↗</span>
      </a>
    ))}
    <a class="inh-kofi" href={KOFI.href} target="_blank" rel="noreferrer">
      {KOFI.label}
    </a>
  </div>
)

export default (() => Links) satisfies QuartzComponentConstructor
