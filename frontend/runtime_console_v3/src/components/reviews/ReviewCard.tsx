type Props = {
  reviewerName: string;
  rating: number;
  title?: string;
  comment: string;
  helpful?: number;
};

export function ReviewCard({ reviewerName, rating, title, comment, helpful = 0 }: Props) {
  return (
    <div className="mb-3 rounded-lg border border-slate-700 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">{reviewerName}</span>
        <span className="text-warning">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
      </div>
      {title && <h4 className="mb-1 font-semibold">{title}</h4>}
      <p className="text-sm text-slate-300">{comment}</p>
      <p className="mt-2 text-xs text-slate-500">Útil ({helpful})</p>
    </div>
  );
}
