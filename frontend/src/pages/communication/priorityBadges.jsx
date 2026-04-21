export function PriorityBadge({ priority }) {
  const p = priority || 'normal';
  const map = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    important: 'bg-amber-100 text-amber-900 border-amber-200',
    normal: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  const label = p.charAt(0).toUpperCase() + p.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${map[p] || map.normal}`}
    >
      {label}
    </span>
  );
}

export function AudienceLabel({ audience }) {
  const labels = {
    all: 'Everyone',
    teachers: 'Teachers',
    students: 'Students',
    parents: 'Parents',
    specific_class: 'Specific class'
  };
  return <span className="text-xs text-gray-500">{labels[audience] || audience}</span>;
}
