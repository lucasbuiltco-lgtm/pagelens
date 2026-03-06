"use client";

import { useState } from "react";

export function AuditSection({
  title,
  score,
  summary,
  details,
  scoreColor,
}: {
  title: string;
  score: number;
  summary: string;
  details: string[];
  scoreColor: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-5 bg-navy-800/50 border border-slate-800 rounded-2xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-slate-400 text-sm">{summary}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <ul className="mt-4 space-y-2 pl-14">
          {details.map((d, i) => (
            <li key={i} className="text-slate-300 text-sm flex gap-2">
              <span className="text-electric-400 mt-0.5">&#8226;</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
