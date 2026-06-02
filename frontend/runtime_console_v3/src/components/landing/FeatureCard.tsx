type Props = {
  icon: string;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 p-6 text-center backdrop-blur-sm">
      <p className="mb-3 text-4xl" aria-hidden>
        {icon}
      </p>
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
