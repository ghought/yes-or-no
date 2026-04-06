export default function QuestionCard({ text, number, total }) {
  return (
    <div className="w-full max-w-md mx-auto" style={{ padding: '0 24px' }}>
      <div className="text-center" style={{ marginBottom: '24px' }}>
        <span className="text-white/25 text-xs font-semibold uppercase tracking-[0.2em]">
          Question {number} of {total}
        </span>
      </div>
      <div className="card-enter bg-white rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)] min-h-[240px] flex items-center justify-center relative overflow-hidden" style={{ padding: '56px 40px' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <p className="text-dark text-[1.65rem] font-extrabold text-center leading-snug tracking-tight">
          {text}
        </p>
      </div>
    </div>
  );
}
