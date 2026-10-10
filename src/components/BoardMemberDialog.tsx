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
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-cream transition-colors hover:border-coral hover:bg-white/10 hover:text-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-coral";

/** A board member's profile: portrait, role, and name in a dark column beside the bio. Arrows step through the board. */
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
            {/* Dark column: the portrait in a fixed 4:5 frame (filling a tall column
                zoomed a square portrait until the face filled it), then who this is —
                role, name, website — with the arrows pinned to its foot. It stretches
                with the bio, so its own content fills the height instead of empty
                space, and the name stays in view while the bio scrolls. */}
            <div className="flex shrink-0 flex-col bg-ocean-950 text-cream">
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden md:aspect-[4/5]">
                {member.portrait ? (
                  <Image
                    src={assetPath(`/board/${member.portrait}`)}
                    alt={member.portraitAlt}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 22rem, 100vw"
                    // Portraits are framed head and shoulders; every crop keeps the face.
                    className="object-cover object-[50%_25%]"
                  />
                ) : (
                  // Until a portrait exists: a monogram, plainly marked as a placeholder.
                  <div
                    role="img"
                    aria-label={`${member.name} — ${boardContent.portraitPlaceholderNote}`}
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
                {/* Melts the photo's lower edge into the panel beneath. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-ocean-950 to-transparent"
                />
              </div>

              <div className="relative flex flex-1 flex-col px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-coral/15 blur-3xl"
                />
                <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-coral">
                  {member.role}
                </p>
                <h3
                  id={titleId}
                  className="relative mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                >
                  {member.name}
                </h3>

                {member.website ? (
                  <p className="relative mt-4 text-sm">
                    <span className="sr-only">
                      {boardContent.websiteLabel}:{" "}
                    </span>
                    <a
                      href={member.website.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded font-semibold text-cream underline decoration-coral decoration-2 underline-offset-4 transition-colors hover:text-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
                    >
                      {member.website.label}
                      <span aria-hidden="true">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </p>
                ) : null}

                <div className="relative mt-6 flex items-center gap-2 pt-2 md:mt-auto">
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

            {/* White column: the bio alone, scrolling within itself on wide screens.
                my-auto centres a short bio in the column, and collapses to 0 once a
                long one overflows, so the start of the text is never cut off. */}
            <div className="flex min-h-0 flex-col p-6 sm:p-8 md:overflow-y-auto md:p-10 md:pr-16">
              <div className="space-y-4 text-base leading-relaxed text-ocean-700 md:my-auto">
                {member.bio.length > 0 ? (
                  member.bio.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))
                ) : (
                  <div className="flex flex-col items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="font-display text-6xl leading-none text-coral/60"
                    >
                      “
                    </span>
                    <p className="-mt-4 font-display text-2xl italic text-ocean-600">
                      {boardContent.bioPlaceholder}
                    </p>
                    <span
                      aria-hidden="true"
                      className="block h-px w-12 bg-coral"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
