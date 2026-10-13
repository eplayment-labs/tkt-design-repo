"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { archivo, bricolage, instrument, jetbrains } from "./fonts";
import { eventById } from "@/mocks/events";
import { accentVars } from "@/lib/accent";
import { lowestOpen } from "@/features/fan/pricing";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import s from "./lab.module.css";

/*
 * Design lab: three visual directions on the same content, each as a
 * 375px phone column. Throwaway; nothing here ships until one is picked.
 */

const loader = ({ src, width }: { src: string; width: number }) => `${src}?w=${width}&q=75&auto=format&fit=max`;
const ev = (id: string) => eventById(id) as TktEvent;
const featured = ev("e1");
const smalls = [ev("e7"), ev("e8"), ev("e3"), ev("e10")];

type Dir = { key: "poster" | "pop" | "night"; name: string; refs: string; pitch: string; relaxes: string };

const dirs: Dir[] = [
  {
    key: "poster",
    name: "A · Poster",
    refs: "Like DICE, gig posters, Bandcamp",
    pitch: "Huge condensed type, ink on paper, one acid-lime brand color. Loud, confident, and still flat.",
    relaxes: "Adds a brand color now. Keeps no gradients and sharp corners.",
  },
  {
    key: "pop",
    name: "B · Soft pop",
    refs: "Like Partiful, Luma, Airbnb Experiences",
    pitch: "Chunky rounded type, big soft cards, sticker badges, and surfaces tinted by each event's photo.",
    relaxes: "Allows pills, a large 24px radius, and playful tilted stickers.",
  },
  {
    key: "night",
    name: "C · After hours",
    refs: "Like Posh, Shotgun, RA",
    pitch: "Dark first. Italic serif headlines over mono details, with each event's photo glowing behind its card.",
    relaxes: "Allows a photo-derived glow (a blurred cover), which the current rules call decorative.",
  },
];

function Pic({ e, sizes, className = "" }: { e: TktEvent; sizes: string; className?: string }) {
  return (
    <span className={`${s.pic} ${className}`}>
      <Image loader={loader} src={e.cover.url} alt={e.cover.alt} fill sizes={sizes} className="object-cover" />
    </span>
  );
}

function Phone({ d }: { d: Dir }) {
  const day = f.dayShort(featured.start).split(" ");
  return (
    <div className={`${s.phone} ${s[d.key]}`} data-theme={d.key === "night" ? "dark" : undefined}>
      {/* App bar */}
      <div className={s.bar}>
        <span className={s.logo}>Tickets</span>
        <span className={s.barIcon} aria-hidden>
          <Search size={20} />
        </span>
      </div>

      {/* Discover */}
      <section className={s.pad}>
        <p className={s.kicker}>This weekend</p>
        <h2 className={s.h1}>
          {d.key === "night" ? (
            <>
              Out <em>tonight</em>
            </>
          ) : (
            "What's on"
          )}
        </h2>
        <div className={s.chips}>
          {["All", "Music", "Arts", "Free"].map((c, i) => (
            <span key={c} className={`${s.chip} ${i === 0 ? s.chipOn : ""}`}>
              {c}
            </span>
          ))}
        </div>

        {/* Bento: featured 2×2, then 1×1s */}
        <div className={s.bento}>
          <a className={`${s.card} ${s.feature} event-scope`} style={accentVars(featured.accent)}>
            <Pic e={featured} sizes="340px" className={s.featurePic} />
            {d.key === "pop" && (
              <span className={s.sticker}>
                <b>{day[1]}</b>
                {day[2]}
              </span>
            )}
            {d.key === "night" && <span className={s.glowTag}>{f.time(featured.start)}</span>}
            <span className={s.cardBody}>
              {d.key === "poster" && <span className={s.dateBig}>{day.slice(1).join(" ")}</span>}
              <span className={s.featureTitle}>{featured.title}</span>
              <span className={s.meta}>
                {featured.venue?.name} · From {f.price(lowestOpen(featured))}
              </span>
            </span>
          </a>
          {smalls.map((e) => (
            <a key={e.id} className={`${s.card} event-scope`} style={accentVars(e.accent)}>
              <Pic e={e} sizes="170px" className={s.smallPic} />
              <span className={s.cardBody}>
                <span className={s.smallTitle}>{e.title}</span>
                <span className={s.meta}>{f.dayShort(e.start)}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Event hero */}
      <section className={`${s.hero} event-scope`} style={accentVars(featured.accent)}>
        {d.key === "night" && (
          <span className={s.glow} aria-hidden>
            <Image loader={loader} src={featured.cover.url} alt="" fill sizes="375px" className="object-cover" />
          </span>
        )}
        <Pic e={featured} sizes="375px" className={s.heroPic} />
        <div className={s.heroPanel}>
          <p className={s.kicker}>Sabay Live presents</p>
          <h2 className={s.heroTitle}>{d.key === "night" ? <em>{featured.title}</em> : featured.title}</h2>
          <div className={s.facts}>
            <span>
              <small>When</small>
              {f.dayShort(featured.start)}, {f.time(featured.start)}
            </span>
            <span>
              <small>Where</small>
              {featured.venue?.name}
            </span>
          </div>
          <button type="button" className={s.cta}>
            Get tickets · {f.price(lowestOpen(featured))}
          </button>
        </div>
      </section>

      {/* Ticket */}
      <section className={s.pad}>
        <div className={`${s.ticket} event-scope`} style={accentVars(featured.accent)}>
          <div className={s.ticketMain}>
            <span className={s.kicker}>Admit 1 · General</span>
            <span className={s.ticketTitle}>{featured.title}</span>
            <span className={s.meta}>
              {f.dayShort(featured.start)} · {f.time(featured.start)} · {featured.venue?.name}
            </span>
          </div>
          <div className={s.ticketStub}>
            <span className={s.qr} aria-hidden />
            <span className={s.serial}>No. 0213 / 500</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Lab() {
  return (
    <main className={`${s.page} ${archivo.variable} ${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <header className={s.intro}>
        <h1>Pick a direction</h1>
        <p>
          Same events, same photos, three personalities. All three use a 2-column bento grid on phones. Open this on your phone too.
        </p>
      </header>
      <div className={s.row}>
        {dirs.map((d) => (
          <figure key={d.key} className={s.col}>
            <figcaption className={s.caption}>
              <strong>{d.name}</strong>
              <span>{d.refs}</span>
              <span>{d.pitch}</span>
              <em>{d.relaxes}</em>
            </figcaption>
            <Phone d={d} />
          </figure>
        ))}
      </div>
    </main>
  );
}
