"use client";

import { useCallback, useState } from "react";

import { BoardMemberDialog, initials } from "@/components/BoardMemberDialog";
import { CoastToCoastLogo } from "@/components/CoastToCoastLogo";
import { subsectionRuleClass, subsectionTitleClass } from "@/components/Disclosure";
import { boardContent } from "@/lib/site";

const members = boardContent.members;

export function BoardSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? current : (current + delta + members.length) % members.length,
      ),
    [],
  );
  const close = useCallback(() => setOpenIndex(null), []);
  const goNext = useCallback(() => step(1), [step]);
  const goPrevious = useCallback(() => step(-1), [step]);

  return (
    <div className="mt-20">
      <h3 className={`${subsectionRuleClass} ${subsectionTitleClass}`}>{boardContent.title}</h3>

      <figure className="mt-8">
        <div
          role="img"
          aria-label={`${boardContent.photoAlt} — ${boardContent.photoPlaceholderNote}`}
          className="relative mx-auto flex aspect-[21/9] w-full max-w-4xl flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-ocean-950 px-6"
        >
          <div
            aria-hidden="true"
            className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-coral/25 blur-3xl"
          />
          <CoastToCoastLogo className="relative h-auto w-full max-w-[12rem] sm:max-w-[16rem]" />
          <p aria-hidden="true" className="relative text-center text-sm text-ocean-200">
            {boardContent.photoPlaceholderNote}
          </p>
        </div>
      </figure>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {members.map((member, index) => (
          <li key={member.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-haspopup="dialog"
              className="group flex w-full items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-ocean-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-coral/10 hover:ring-coral/50 pointer-coarse:active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-dark font-display text-lg italic text-white shadow-md shadow-coral/30 transition-transform duration-300 group-hover:scale-105"
              >
                {initials(member.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-widest text-coral-dark">
                  {member.role}
                </span>
                <span className="mt-0.5 block font-display text-xl font-semibold text-ocean-900">
                  {member.name}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ocean-600 transition-colors group-hover:text-coral-dark">
                  {boardContent.profileLabel}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null ? (
        <BoardMemberDialog
          member={members[openIndex]}
          onClose={close}
          onNext={goNext}
          onPrevious={goPrevious}
        />
      ) : null}
    </div>
  );
}
