# Inheritor — content cheatsheet

Everything below is a plain Obsidian callout. It renders as a normal callout
in Obsidian and as the designed component on the site. No HTML anywhere.

The rules for all of them: `**bold**` is the label, `` `code` `` is the small
tag, everything else on the line is the description.

---

## Attribute cards

```markdown
> [!attrs]
> - **Physique** `PHY` Physical prowess and health. Inventory slots equal PHY. A starting PHY of 15+ grants an additional Hit Die.
> - **Intellect** `INT` Mental tenacity and learnedness. Known proficiencies must have values at or below INT.
> - **Ego** `EGO` Metaphysical keenness and understanding. Attunements must have values at or below EGO.
```

Cards flow into as many columns as fit. Accent colours cycle blood → bronze →
gold by position; add a fourth and it starts over. Works for anything with a
name, a tag, and a blurb — Foundations, Attunement schools, whatever.

---

## Difficulty pills

```markdown
> [!tiers]
> - **Normal** 2d6
> - **Challenging** 3d6
> - **Difficult** 4d6
```

Always three across. Verdigris → bronze → blood.

---

## Legend chips

```markdown
> [!legend]
> - **E** Edged — incisionary injuries
> - **P** Pointed — penetrating injuries
> - **B** Blunt — blunt trauma
```

Inline chips that wrap. The bold part is the badge letter. Colours cycle
blood → copper → bronze.

---

## Feature list

```markdown
> [!features]
> - **Sunder** `edged · blunt` On max damage, ignore 2 DR against metal armor.
> - **Reach** `pointed` Strike first against any opponent closing distance.
> - **Brutal** `blunt` On a hit, the target must test PHY or be knocked prone.
```

Name and tag in a narrow left column, description on the right. Stacks to
one column on phones. The tag is optional — leave the backticks out and the
name just sits alone.

---

## Statblock

```markdown
> [!statblock] Blackhand Reaver
> *across the Misted Sea*
>
> | HD  | DR | MR | Damage |
> | --- | -- | -- | ------ |
> | 3d6 | 3  | 9  | 1d6    |
>
> **Sunder.** On max damage, ignore 2 DR against metal armor. If DR is reduced to 0 this way, the armor breaks.
```

A table directly inside a statblock becomes the stat grid: header row → labels,
value row → big monospace numbers. Any number of columns. An italic line on
its own directly under the title becomes the subtitle.

---

## Everything else is already automatic

- Ordinary tables: first column styled as a die result (bronze monospace).
- `[!rule]`, `[!warden]`, `[!example]`, `[!side]`, `[!info]`, `[!question]`,
  `[!warning]`, `[!success]` all styled.
- Breadcrumb kicker above every title. Delete the hand-written
  `<sup>Guide / [[Page]]</sup>` lines whenever — they're hidden meanwhile.
- The `<span style="font-variant-caps:all-small-caps">` treatment still works,
  but `<span class="caps">INHERITOR</span>` is shorter and does the same.
