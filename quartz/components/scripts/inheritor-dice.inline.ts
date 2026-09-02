/* =============================================================================
   INHERITOR — dice roller, ported from publish.js

   WHAT CHANGED FROM publish.js
   ----------------------------
   Deleted, because Obsidian Publish needed them and Quartz doesn't:
     - the MutationObserver + requestAnimationFrame subscriber system.
       That existed because Publish is an SPA that re-renders the DOM out from
       under you. Quartz emits a "nav" event on navigation instead; one listener
       replaces the whole scheduler.
     - the page router that toggled `.inh-home` on <body>.
       Now handled structurally by layout.byPageType in quartz.config.yaml.
     - all sidebar logic (group tints, ancestor marking, auto-collapse).
       Quartz's explorer does active-file highlighting, collapse state, and
       ancestor tracking natively. You were reimplementing what you now get free.
       Only the group tints are a real design decision worth re-adding, and
       that's the small block at the bottom of this file.
     - the stacked-pane back-button handler. Quartz has no stacked panes.
     - the Ko-fi injector. Better as a footer component than a script that
       appends to the DOM after load.

   Kept essentially untouched — the dice engine is dependency-free vanilla JS:
     - rollDie / evaluate / run / renderLog / escapeHtml
     - the roll-under verdict logic (under = success, exactly = cost, over = fail)
     - advantage keeping the LOWER result, which is correct for roll-under and
       is the kind of thing that's easy to break in a rewrite. It isn't broken.

   WHERE THIS FILE GOES
   --------------------
   Quartz components pair a .tsx with an `.inline.ts` script and a .scss.
   See quartz.jzhao.xyz/advanced/creating-components. The lowest-effort path is
   a small component that renders nothing and just registers this script; the
   drawer builds its own DOM anyway.

   The dice CSS is already in custom.scss section 11, unchanged.

   Also: drop the "Desktop Only" callout from your Home page. Nothing here is
   desktop-only — the drawer goes full-width under 800px and the presets and
   target field are all tappable. The keyboard shortcut is a bonus, not the
   entry point.

   FIX — drawer vanishing on navigation
   ------------------------------------
   Quartz's SPA router replaces body content on every navigation, which took
   the drawer with it. The old `built` flag stayed true, so build() returned
   early and never re-created it: gone until a full refresh.

   Now open state lives in `isOpen` rather than being read back off the body
   class, and ensureMounted() checks the DOM on every nav instead of trusting
   a flag. Listeners registered on `document` are torn down via addCleanup so
   they can't stack if the drawer is rebuilt.

   The drawer also stays open across navigation now, which is the better
   behaviour here: roll, follow a link, keep your log.
   ============================================================================= */

const DICE_PAGES = ["Creating an Inheritor", "Dice Commands"]
const LOG_KEY = "inh-dice-log"

type Entry = { cmd: string; breakdown: string; total: string; verdict: string }

let log: Entry[] = []
try {
  log = JSON.parse(sessionStorage.getItem(LOG_KEY) || "[]")
} catch {
  log = []
}

let mode: "adv" | "dis" | null = null
let lastCommand = ""
let built = false
let isOpen = false

let handle: HTMLElement
let drawer: HTMLElement
let logBox: HTMLElement
let input: HTMLInputElement
let targetField: HTMLInputElement

function el(tag: string, cls?: string, html?: string): HTMLElement {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (html != null) n.innerHTML = html
  return n
}

/* --- dice engine — unchanged from publish.js ------------------------------ */

function rollDie(sides: number): number {
  return 1 + Math.floor(Math.random() * sides)
}

function evaluate(expr: string): { total: number; breakdown: string } {
  const tokens = expr.match(/[+-]?[^+-]+/g) || []
  let total = 0
  const parts: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i].trim()
    const negative = token.charAt(0) === "-"
    token = token.replace(/^[+-]/, "").trim()

    const dice = token.match(/^(\d*)d(\d+)(!)?$/)
    if (dice) {
      const count = parseInt(dice[1], 10) || 1
      const sides = parseInt(dice[2], 10)
      if (count > 100 || sides > 1000 || sides < 2) throw new Error("out of range")

      const rolls: number[] = []
      for (let d = 0; d < count; d++) {
        let value = rollDie(sides)
        if (dice[3]) {
          let last = value
          let bursts = 0
          while (last === sides && bursts < 100) {
            last = rollDie(sides)
            value += last
            bursts++
          }
        }
        rolls.push(value)
      }
      const sum = rolls.reduce((a, b) => a + b, 0)
      total += negative ? -sum : sum
      parts.push((negative ? "\u2212" : parts.length ? "+" : "") + "[" + rolls.join(", ") + "]")
    } else if (/^\d+$/.test(token)) {
      const flat = parseInt(token, 10)
      total += negative ? -flat : flat
      parts.push((negative ? "\u2212" : "+") + flat)
    } else {
      throw new Error("unreadable token")
    }
  }

  return { total, breakdown: parts.join("").replace(/^\+/, "") }
}

function run(raw: string) {
  lastCommand = raw
  let command = raw.toLowerCase().replace(/^\/r\s*/, "").trim()

  let target: number | null = null
  const vs = command.match(/\s+vs\s+(\d+)/)
  if (vs) {
    target = parseInt(vs[1], 10)
    command = command.replace(/\s+vs\s+\d+/, "").trim()
  }

  let advantage: "adv" | "dis" | null = null
  if (/\s+adv$/.test(command)) {
    advantage = "adv"
    command = command.replace(/\s+adv$/, "").trim()
  } else if (/\s+dis$/.test(command)) {
    advantage = "dis"
    command = command.replace(/\s+dis$/, "").trim()
  }

  let entry: Entry
  try {
    let total: number, breakdown: string
    if (advantage) {
      const a = evaluate(command)
      const b = evaluate(command)
      // Roll-under, so advantage keeps the LOWER result.
      const keep = advantage === "adv" ? (a.total <= b.total ? a : b) : a.total >= b.total ? a : b
      const drop = keep === a ? b : a
      total = keep.total
      breakdown = keep.breakdown + " \u2715 " + drop.total
    } else {
      const r = evaluate(command)
      total = r.total
      breakdown = r.breakdown
    }

    let verdict = ""
    if (target !== null) {
      verdict = total < target ? "success" : total === target ? "cost" : "failure"
    }
    entry = { cmd: raw, breakdown, total: String(total), verdict }
  } catch {
    entry = { cmd: raw, breakdown: "unreadable command", total: "\u2014", verdict: "failure" }
  }

  log.push(entry)
  if (log.length > 40) log.shift()
  try {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(log))
  } catch {
    /* private mode */
  }
  renderLog()
  setOpen(true)
}

const VERDICT_LABEL: Record<string, string> = {
  success: "success",
  failure: "failure",
  cost: "success at a cost",
}

function escapeHtml(s: string): string {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  )
}

function renderLog() {
  if (!log.length) {
    logBox.innerHTML =
      '<div class="inh-dice-empty">Nothing rolled yet. Try ' +
      "<code>3d6 vs 12</code>, <code>2d6+1d8+5</code>, or <code>d20! adv</code>.</div>"
    return
  }
  logBox.innerHTML = log
    .map(
      (e) =>
        '<div class="inh-dice-entry" data-verdict="' +
        e.verdict +
        '">' +
        '<div class="inh-dice-entry-top">' +
        '<span class="inh-dice-cmd">' +
        escapeHtml(e.cmd) +
        "</span>" +
        '<span class="inh-dice-verdict">' +
        (VERDICT_LABEL[e.verdict] || "") +
        "</span>" +
        "</div>" +
        '<div class="inh-dice-entry-body">' +
        '<span class="inh-dice-breakdown">' +
        escapeHtml(e.breakdown) +
        "</span>" +
        '<span class="inh-dice-total">' +
        escapeHtml(e.total) +
        "</span>" +
        "</div>" +
        "</div>",
    )
    .join("")
}

function setOpen(open: boolean) {
  isOpen = open
  document.body.classList.toggle("inh-dice-open", open)
  if (open) input.focus()
}

/* --- build once ----------------------------------------------------------- */

function build() {
  if (built) return
  built = true

  handle = el(
    "div",
    "inh-dice-handle",
    '<span class="inh-dice-handle-label">Roll</span><span class="inh-dice-handle-key">R</span>',
  )
  handle.setAttribute("role", "button")
  handle.setAttribute("tabindex", "0")
  handle.setAttribute("aria-label", "Open the dice roller")

  drawer = el(
    "div",
    "inh-dice-drawer",
    '<div class="inh-dice-head">' +
      '<span class="inh-dice-head-title">Dice</span>' +
      '<button class="inh-dice-close" type="button">esc</button>' +
      "</div>" +
      '<div class="inh-dice-tests">' +
      '<div class="inh-dice-legend">Test</div>' +
      '<div class="inh-dice-presets">' +
      '<button class="inh-dice-preset" type="button" data-dice="2">2d6</button>' +
      '<button class="inh-dice-preset" type="button" data-dice="3">3d6</button>' +
      '<button class="inh-dice-preset" type="button" data-dice="4">4d6</button>' +
      "</div>" +
      '<div class="inh-dice-target-row">' +
      '<span class="inh-dice-target-label">roll under</span>' +
      '<input class="inh-dice-target" type="text" inputmode="numeric" value="12" maxlength="2" aria-label="Target number" />' +
      '<div class="inh-dice-modes">' +
      '<button class="inh-dice-mode" type="button" data-mode="adv" aria-pressed="false" aria-label="Advantage">[+]</button>' +
      '<button class="inh-dice-mode" type="button" data-mode="dis" aria-pressed="false" aria-label="Disadvantage">[\u2212]</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="inh-dice-log" aria-live="polite"></div>' +
      '<div class="inh-dice-foot">' +
      '<input class="inh-dice-input" type="text" placeholder="3d6 vs 12" autocomplete="off" spellcheck="false" aria-label="Dice command" />' +
      '<div class="inh-dice-hint"><span>vs \u00b7 adv \u00b7 dis \u00b7 ! explodes</span><span>Enter to roll</span></div>' +
      "</div>",
  )

  document.body.appendChild(handle)
  document.body.appendChild(drawer)

  logBox = drawer.querySelector(".inh-dice-log") as HTMLElement
  input = drawer.querySelector(".inh-dice-input") as HTMLInputElement
  targetField = drawer.querySelector(".inh-dice-target") as HTMLInputElement

  handle.addEventListener("click", () => setOpen(!isOpen))
  handle.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(true)
    }
  })

  drawer.querySelector(".inh-dice-close")!.addEventListener("click", () => setOpen(false))

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false)
      return
    }
    const tag = (e.target as HTMLElement)?.tagName || ""
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === "r" || e.key === "R") {
      e.preventDefault()
      setOpen(true)
    }
  }

  document.addEventListener("keydown", onKeydown)

  // Quartz tears these down between navigations; without it, a rebuild would
  // stack a second listener and every keypress would fire twice.
  if (typeof window !== "undefined" && window.addCleanup) {
    window.addCleanup(() => document.removeEventListener("keydown", onKeydown))
  }

  targetField.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "").slice(0, 2)
  })

  drawer.querySelectorAll(".inh-dice-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = btn.getAttribute("data-dice")
      const t = parseInt(targetField.value, 10)
      run(n + "d6" + (isNaN(t) ? "" : " vs " + t) + (mode ? " " + mode : ""))
    })
  })

  drawer.querySelectorAll(".inh-dice-mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      const which = btn.getAttribute("data-mode") as "adv" | "dis"
      mode = mode === which ? null : which
      drawer.querySelectorAll(".inh-dice-mode").forEach((b) => {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === mode))
      })
    })
  })

  input.addEventListener("keydown", function (this: HTMLInputElement, e: KeyboardEvent) {
    if (e.key !== "Enter") return
    let value = this.value.trim()
    if (!value) value = lastCommand // Enter on an empty field repeats
    if (!value) return
    run(value)
    this.value = ""
  })

  renderLog()
}

/* --- Quartz navigation hook ----------------------------------------------
   Replaces the entire MutationObserver scheduler from publish.js. Quartz fires
   "nav" on every SPA navigation, including the initial load. */

/* =============================================================================
   ROLL ON THIS TABLE

   In the design this was a button hardcoded to the Origins array. Here it's
   generic: any table whose first-column header is a die expression gets a
   button under it.

       | 1d10 | Starsign | Gain |

   The header is the opt-in — write `1d10`, `2d6`, `d20`, `3d6` and the table
   becomes rollable. Tables with a normal first-column header are left alone,
   so this never fires on a reference table by accident.

   Row cells may be single values (`7`) or ranges (`1-3`, `4–6`, en dash fine).
   Rolls also land in the drawer log, so the history is one list rather than
   two.
   ============================================================================= */

const DIE_RE = /^\s*(\d*)\s*d\s*(\d+)\s*$/i

function parseRowRange(text: string): [number, number] | null {
  const t = text.trim().replace(/[\u2013\u2014]/g, "-")
  const range = t.match(/^(\d+)\s*-\s*(\d+)/)
  if (range) return [parseInt(range[1], 10), parseInt(range[2], 10)]
  const single = t.match(/^(\d+)/)
  if (single) {
    const n = parseInt(single[1], 10)
    return [n, n]
  }
  return null
}

function decorateTables() {
  const tables = document.querySelectorAll<HTMLTableElement>(".markdown-rendered table")

  tables.forEach((table) => {
    const container = table.closest(".table-container") ?? table
    if ((container as HTMLElement).dataset.inhRollable) return

    const th = table.querySelector("thead th")
    if (!th) return
    const die = (th.textContent || "").match(DIE_RE)
    if (!die) return

    const count = parseInt(die[1] || "1", 10)
    const sides = parseInt(die[2], 10)
    if (!sides || sides < 2 || count < 1 || count > 20) return

    // Rows we can actually match a result against
    const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr")).filter((tr) => {
      const cell = tr.cells[0]
      if (!cell) return false
      const range = parseRowRange(cell.textContent || "")
      if (!range) return false
      tr.dataset.inhLow = String(range[0])
      tr.dataset.inhHigh = String(range[1])
      return true
    })
    if (!rows.length) return

    ;(container as HTMLElement).dataset.inhRollable = "1"

    const bar = el("div", "inh-roll-bar")
    const label = (die[1] || "1") + "d" + sides
    const button = el("button", "inh-roll-button", "roll " + label + " on this table")
    button.setAttribute("type", "button")
    const note = el("span", "inh-roll-note")
    bar.appendChild(button)
    bar.appendChild(note)
    container.parentNode?.insertBefore(bar, container.nextSibling)

    button.addEventListener("click", () => {
      const rolls: number[] = []
      let total = 0
      for (let i = 0; i < count; i++) {
        const r = rollDie(sides)
        rolls.push(r)
        total += r
      }

      let hit: HTMLTableRowElement | null = null
      for (const tr of rows) {
        const low = parseInt(tr.dataset.inhLow!, 10)
        const high = parseInt(tr.dataset.inhHigh!, 10)
        tr.classList.remove("inh-roll-hit")
        if (total >= low && total <= high) hit = tr
      }

      if (hit) {
        hit.classList.add("inh-roll-hit")
        hit.scrollIntoView({ block: "nearest", behavior: "smooth" })
        // Second cell is the result name in every roll table on this site.
        const name = (hit.cells[1]?.textContent || "").trim().split(/\s{2,}|\. /)[0]
        note.textContent = "You rolled " + total + (name ? " \u2014 " + name : "")
      } else {
        note.textContent = "You rolled " + total + " \u2014 no matching row"
      }

      log.push({
        cmd: label,
        breakdown: "[" + rolls.join(", ") + "]",
        total: String(total),
        verdict: "",
      })
      if (log.length > 40) log.shift()
      try {
        sessionStorage.setItem(LOG_KEY, JSON.stringify(log))
      } catch {
        /* private mode */
      }
      if (built) renderLog()
    })
  })
}


/* =============================================================================
   INLINE TERM COLOURING

   CSS can't select text, so this walks the rendered prose and wraps matches in
   spans. Runs on every nav. Handles:

     [+] [-]                 verdigris / blood
     Inheritors  Wardens     verdigris / violet

   Skips <code>, <pre> and <a>: a [-] in a code sample is sample text, and
   recolouring inside a link label fights the link's own colour.

   Word-boundary anchored, so "Inheritor's Guide" and the singular "Warden"
   are left alone. Add them to TERMS below if you want those too.
   ============================================================================= */

const TERMS: Record<string, string> = {
  Inheritors: "inh-term-inheritor",
  Wardens: "inh-term-warden",
}

const TOKEN_RE = new RegExp("\\[([+-])\\]|\\b(" + Object.keys(TERMS).join("|") + ")\\b", "g")

function decorateTerms() {
  const root = document.querySelector(".markdown-rendered")
  if (!root || (root as HTMLElement).dataset.inhTerms) return
  ;(root as HTMLElement).dataset.inhTerms = "1"

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT
      TOKEN_RE.lastIndex = 0
      if (!TOKEN_RE.test(node.nodeValue)) return NodeFilter.FILTER_REJECT
      const parent = node.parentElement?.closest("code, pre, a, .inh-dice-drawer") ?? null
      return parent ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    },
  })

  const targets: Text[] = []
  let n = walker.nextNode()
  while (n) {
    targets.push(n as Text)
    n = walker.nextNode()
  }

  for (const node of targets) {
    const text = node.nodeValue!
    const frag = document.createDocumentFragment()
    let last = 0
    let m: RegExpExecArray | null
    TOKEN_RE.lastIndex = 0
    while ((m = TOKEN_RE.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))
      const span = document.createElement("span")
      if (m[1]) {
        span.className = m[1] === "+" ? "inh-plus" : "inh-minus"
      } else {
        span.className = TERMS[m[2]]
      }
      span.textContent = m[0]
      frag.appendChild(span)
      last = m.index + m[0].length
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
    node.parentNode?.replaceChild(frag, node)
  }
}


/* Re-attach if the router took our elements, and reassert the open state it
   may have wiped off <body>. Cheap enough to run on every navigation. */
function ensureMounted() {
  if (built && handle && document.body.contains(handle) && document.body.contains(drawer)) {
    document.body.classList.toggle("inh-dice-open", isOpen)
    return
  }
  built = false
  build()
  document.body.classList.toggle("inh-dice-open", isOpen)
}

document.addEventListener("nav", () => {
  ensureMounted()
  decorateTables()
  decorateTerms()

  // Attention pulse, once per session, on the pages that teach rolling.
  if (sessionStorage.getItem("inh-dice-hinted")) return
  const title = document.querySelector("h1.article-title")?.textContent?.trim() || ""
  if (!title) return
  if (!DICE_PAGES.some((p) => title.indexOf(p) !== -1)) return
  sessionStorage.setItem("inh-dice-hinted", "1")
  handle.classList.add("inh-attention")
  setTimeout(() => handle.classList.remove("inh-attention"), 7000)
})