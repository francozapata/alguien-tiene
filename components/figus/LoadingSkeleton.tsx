"use client";

export default function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[2rem] bg-white p-5 ring-1 ring-slate-200">
          <div className="h-4 w-1/3 rounded-full bg-slate-200" />
          <div className="mt-4 h-8 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="h-20 rounded-3xl bg-slate-100" />
            <div className="h-20 rounded-3xl bg-slate-100" />
            <div className="h-20 rounded-3xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
