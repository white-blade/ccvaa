"use client";

import Image from "next/image";

import { Modal } from "@/components/Modal";
import { assetPath } from "@/lib/asset";
import { boardContent, type BoardMember } from "@/lib/site";

type BoardMemberDialogProps = {
  member: BoardMember;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

const stepButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-ocean-200 text-ocean-700 transition-colors hover:border-ocean-400 hover:bg-ocean-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral";

/** A board member's profile: portrait beside role, name, and bio. Arrows step through the board. */
export function BoardMemberDialog({
  member,
  onClose,
  onNext,
  onPrevious,
}: BoardMemberDialogProps) {
  const titleId = `board-${member.id}-title`;

  return (
    <Modal
      labelledBy={titleId}
      onClose={onClose}
      onNext={onNext}
      onPrevious={onPrevious}
      widthClass="max-w-4xl"
    >
      {(initialFocusRef) => (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* One close button for every width, outside the scrolling area so it
              never scrolls away: solid, so it reads over the dark portrait on
              phones and the white text column on wider screens. */}
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            aria-label={boardContent.closeLabel}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ocean-900 text-cream shadow-md transition-colors hover:bg-ocean-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">✕</span>
          </button>

          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:overflow-hidden">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-ocean-950 md:aspect-auto md:min-h-[28rem]">
              {member.portrait ? (
                <Image
                  src={assetPath(`/board/${member.portrait}`)}
                  alt={member.portraitAlt}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 22rem, 100vw"
                  className="object-cover"
                />
              ) : (
                // Until a portrait exists: a monogram, plainly marked as a placeholder.
                <div
                  role="img"
                  aria-label={`${member.portraitAlt} — ${boardContent.portraitPlaceholderNote}`}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-coral/30 blur-3xl"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-ocean-600/40 blur-3xl"
                  />
                  <span
                    aria-hidden="true"
                    className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-dark font-display text-5xl italic text-white shadow-2xl shadow-black/30 sm:h-40 sm:w-40 sm:text-6xl"
                  >
                    {initials(member.name)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative text-xs uppercase tracking-[0.25em] text-ocean-200"
                  >
                    {boardContent.portraitPlaceholderNote}
                  </span>
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-col p-6 sm:p-8 md:overflow-y-auto md:p-10">
              <div className="md:pr-12">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-coral-dark">
                  {member.role}
                </p>
                <h3
                  id={titleId}
                  className="mt-2 font-display text-3xl font-semibold tracking-tight text-ocean-900 sm:text-4xl"
                >
                  {member.name}
                </h3>
              </div>

              <span
                aria-hidden="true"
                className="mt-6 block h-px w-12 bg-coral"
              />

              <div className="mt-6 flex-1 space-y-4 text-base leading-relaxed text-ocean-700">
                {member.bio.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-end gap-2 border-t border-ocean-100 pt-6">
                <button
                  type="button"
                  onClick={onPrevious}
                  aria-label={boardContent.previousLabel}
                  className={stepButtonClass}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label={boardContent.nextLabel}
                  className={stepButtonClass}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
