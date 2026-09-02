// =============================================================================
// INHERITOR — home page components
//
// Two components that render only on the index page, so index.md can be
// plain prose with no HTML in it.
//
//   InheritorHero   → beforeBody   (renders inside .page-header, above prose)
//   InheritorCards  → afterBody    (renders below the article)
//
// Copy lives here rather than in frontmatter so it's one place to edit and
// it never gets mangled by markdown. Change the strings below freely.
// =============================================================================

import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const HERO = {
  eyebrow: "A dark science-fantasy game",
  title: "inheritor",
  rule: "Playtest Edition 0.5.5",
  // epigraph:
  //   "Now, under the fading sun, the starless sky, and the moonless night the world festers under the weight of history. The world that remains is yours.",
  // aside: "What's left of it, anyway.",
}

const CARDS = [
  {
    label: "First time here",
    title: "Start Here",
    desc: "What the game is, and how to read this site.",
    href: "./begin-here/start-here",
  },
  {
    label: "Make a character",
    title: "Creating an Inheritor",
    desc: "Three attributes, rolled on 3d6. Then your Foundations.",
    href: "./inheritor's-guide/creating-an-inheritor",
  },
  {
    label: "Roll on this site",
    title: "Dice Commands",
    desc: "Press R anywhere to open the roller.",
    href: "./begin-here/dice-commands",
  },
]

const isHome = (p: QuartzComponentProps) => p.fileData.slug === "index"

const Hero: QuartzComponent = (props: QuartzComponentProps) => {
  if (!isHome(props)) return null
  return (
    <div class="inh-hero">
      <div class="inh-hero-eyebrow">{HERO.eyebrow}</div>
      <div class="inh-hero-title">{HERO.title}</div>
      <div class="inh-hero-rule">
        <span>{HERO.rule}</span>
      </div>
      <p class="inh-hero-epigraph">{HERO.epigraph}</p>
      <p class="inh-hero-epigraph">{HERO.aside}</p>
    </div>
  )
}

const Cards: QuartzComponent = (props: QuartzComponentProps) => {
  if (!isHome(props)) return null
  return (
    <div class="inh-home-cards">
      <div class="inh-divider">
        <span>Where to begin</span>
      </div>
      <div class="inh-cards">
        {CARDS.map((c) => (
          <a class="inh-card" href={c.href}>
            <div class="inh-card-label">{c.label}</div>
            <div class="inh-card-title">{c.title}</div>
            <div class="inh-card-desc">{c.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}

export const InheritorHero = (() => Hero) satisfies QuartzComponentConstructor
export const InheritorCards = (() => Cards) satisfies QuartzComponentConstructor
