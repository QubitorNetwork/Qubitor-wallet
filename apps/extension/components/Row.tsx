interface Props {
  label: string;
  value?: string;
  detail?: string;
  last?: boolean;
}

/** Source: Qubitor Network receipt-style row — qb-line bottom hairline. */
export function Row({ label, value, detail, last = false }: Props) {
  const border = last ? "" : "border-b border-qb-line";
  return (
    <div className={`flex items-center justify-between py-3 ${border}`}>
      <div className="flex-1 pr-3">
        <div className="text-sm font-medium text-qb-bone">{label}</div>
        {detail ? <div className="text-xs text-qb-mist mt-0.5">{detail}</div> : null}
      </div>
      {value ? <div className="text-sm text-qb-mist">{value}</div> : null}
    </div>
  );
}
