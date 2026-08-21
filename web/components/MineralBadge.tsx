import { MINERAL_GROUP_STYLES } from "@shared/minerals";

export function MineralBadge({
  name,
  group,
  type,
}: {
  name: string;
  group: string;
  type?: string;
}) {
  const style =
    MINERAL_GROUP_STYLES[group as keyof typeof MINERAL_GROUP_STYLES] ??
    MINERAL_GROUP_STYLES["прочее"];
  const tooltip = type ? `${group} → ${type}` : group;
  return (
    <span
      class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
      title={tooltip}
    >
      {name}
    </span>
  );
}
