export default function QuestionCard({ text, number, total }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <span className="text-white/25 text-xs font-semibold uppercase tracking-[0.2em]">
          Question {number} of {total}
        </span>
      </div>
      <div className="card-enter bg-white rounded-[28px] px-10 py-14 shadow-[0_8px_40px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)] min-h-[240px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <p className="text-dark text-[1.65rem] font-extrabold text-center leading-snug tracking-tight">
          {text}
        </p>
      </div>
    </div>
  );
}
