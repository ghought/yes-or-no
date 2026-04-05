export default function QuestionCard({ text, number, total }) {
  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="text-center mb-4">
        <span className="text-white/30 text-sm font-medium">
          Question {number} of {total}
        </span>
      </div>
      <div className="card-enter bg-white rounded-3xl p-8 shadow-2xl shadow-black/30 min-h-[200px] flex items-center justify-center">
        <p className="text-dark text-2xl font-bold text-center leading-snug">
          {text}
        </p>
      </div>
    </div>
  );
}
