import { cn } from 'cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type AvatarGroupItem = { id: string; initials: string; src?: string; alt?: string };
type Props = { items: AvatarGroupItem[]; max?: number; size?: number; className?: string };

/** Overlapping avatars with a "+N" overflow chip: participants, members, shared with. */
export function AvatarGroup({ items, max = 4, size = 32, className }: Props) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((a, i) => (
        <Avatar key={a.id} className="border-background border-2" style={{ width: size, height: size, marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          {a.src ? <AvatarImage src={a.src} alt={a.alt ?? a.initials} /> : null}
          <AvatarFallback className="text-xs">{a.initials}</AvatarFallback>
        </Avatar>
      ))}
      {rest > 0 ? (
        <span
          className="bg-muted text-muted-foreground border-background flex items-center justify-center rounded-full border-2 text-xs font-medium"
          style={{ width: size, height: size, marginLeft: -size * 0.3 }}
          aria-label={`and ${rest} more`}>
          +{rest}
        </span>
      ) : null}
    </div>
  );
}
