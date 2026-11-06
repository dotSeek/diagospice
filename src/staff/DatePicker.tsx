import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

// Custom date field for the admin. Browsers do not allow the calendar of <input type="date"> to be
// styled, so this draws its own: a field showing the date, and a calendar in the Diago style.
// Values are plain ISO dates (YYYY-MM-DD) built from local parts, never through UTC, so a date
// never shifts by a day. Keyboard: arrows move by day or week, Page Up and Down by month,
// Home and End to the week's start and end, Enter picks, Escape closes.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parse = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
};
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const addMonths = (date: Date, months: number) => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last));
};
const shown = (value?: string) => parse(value)?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = "No date",
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<Date>(() => parse(value) ?? new Date());
  const [alignRight, setAlignRight] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const today = iso(new Date());
  const allowed = (date: Date) => (!min || iso(date) >= min) && (!max || iso(date) <= max);

  // Close when clicking or tapping anywhere else.
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => !root.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the calendar on screen, and move keyboard focus to the highlighted day.
  useLayoutEffect(() => {
    if (!open) return;
    const panel = root.current?.querySelector<HTMLElement>(".dp__panel");
    if (panel && !alignRight && panel.getBoundingClientRect().right > window.innerWidth - 8) setAlignRight(true);
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${iso(focus)}"]`)?.focus({ preventScroll: true });
  }, [open, focus, alignRight]);

  const show = () => {
    setFocus(parse(value) ?? (min && today < min ? parse(min)! : new Date()));
    setAlignRight(false);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const pick = (date: Date) => {
    if (!allowed(date)) return;
    onChange(iso(date));
    close();
  };

  const onKey = (event: KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
      Home: () => addDays(focus, -((focus.getDay() + 6) % 7)),
      End: () => addDays(focus, 6 - ((focus.getDay() + 6) % 7)),
    };
    if (moves[event.key]) {
      event.preventDefault();
      setFocus(moves[event.key]());
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  // Six weeks starting on the Monday on or before the 1st.
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const prevAllowed = !min || iso(new Date(focus.getFullYear(), focus.getMonth(), 0)) >= min;
  const nextAllowed = !max || iso(new Date(focus.getFullYear(), focus.getMonth() + 1, 1)) <= max;

  return (
    <div className="dp" ref={root}>
      <span className="dp__label" id={`${id}-label`}>
        {label}
      </span>
      <div className="dp__field">
        <button
          ref={trigger}
          type="button"
          className={`dp__trigger${value ? "" : " is-empty"}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}-value`}
          onClick={() => (open ? close() : show())}
        >
          <svg className="dp__icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span id={`${id}-value`}>{shown(value) ?? placeholder}</span>
        </button>
        {value ? (
          <button type="button" className="dp__clear" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => onChange(undefined)}>
            ×
          </button>
        ) : null}
      </div>

      {open ? (
        <div className={`dp__panel${alignRight ? " is-right" : ""}`} role="dialog" aria-modal="false" aria-label={`Choose ${label.toLowerCase()}`} onKeyDown={onKey}>
          <div className="dp__head">
            <button type="button" className="dp__nav" aria-label="Previous month" disabled={!prevAllowed} onClick={() => setFocus(addMonths(focus, -1))}>
              ‹
            </button>
            <b aria-live="polite">
              {MONTHS[focus.getMonth()]} {focus.getFullYear()}
            </b>
            <button type="button" className="dp__nav" aria-label="Next month" disabled={!nextAllowed} onClick={() => setFocus(addMonths(focus, 1))}>
              ›
            </button>
          </div>
          <div className="dp__grid" role="grid" ref={grid}>
            {DAYS.map((day) => (
              <span key={day} className="dp__dow" role="columnheader">
                {day.slice(0, 2)}
              </span>
            ))}
            {days.map((day) => {
              const key = iso(day);
              const other = day.getMonth() !== focus.getMonth();
              const ok = allowed(day);
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-day={key}
                  tabIndex={key === iso(focus) ? 0 : -1}
                  className={`dp__day${other ? " is-other" : ""}${key === today ? " is-today" : ""}${key === value ? " is-on" : ""}`}
                  aria-selected={key === value}
                  aria-label={day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  disabled={!ok}
                  onClick={() => pick(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="dp__foot">
            <button type="button" className="mini-btn" disabled={!allowed(new Date())} onClick={() => pick(new Date())}>
              Today
            </button>
            <button
              type="button"
              className="mini-btn"
              disabled={!value}
              onClick={() => {
                onChange(undefined);
                close();
              }}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
