interface Contact {
  name: string;
  title?: string;
}

interface StateSidebarProps {
  contacts?: Contact[];
  focusAreas?: string[];
}

export default function StateSidebar({
  contacts = [],
  focusAreas = [],
}: StateSidebarProps) {
  if (contacts.length === 0 && focusAreas.length === 0) return null;

  return (
    <div className="rounded-xl border bg-muted/30 p-4 sticky top-20 space-y-4">
      {contacts.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacts</p>
          <div className="mt-2 space-y-2 text-sm">
            {contacts.map((c) => (
              <div key={c.name}>
                <div>{c.name}</div>
                {c.title && (
                  <div className="text-xs text-muted-foreground">{c.title}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {focusAreas.length > 0 && (
        <div className={contacts.length > 0 ? "border-t pt-4" : ""}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Focus Areas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {focusAreas.map((f) => (
              <span key={f} className="px-2 py-1 rounded-lg border text-xs">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

