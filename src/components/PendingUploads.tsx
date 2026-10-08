import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { loadDraft } from "../upload-queue";
export function PendingUploads({
  revision,
  onResume,
}: {
  revision: string;
  onResume: (type: "memories" | "music") => void;
}) {
  const [pending, setPending] = useState<
    { type: "memories" | "music"; count: number }[]
  >([]);
  useEffect(() => {
    let active = true;
    Promise.all([loadDraft("memories"), loadDraft("music")])
      .then((drafts) => {
        if (active)
          setPending(
            drafts
              .filter((d) => d?.items.length)
              .map((d) => ({ type: d!.type, count: d!.items.length })),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [revision]);
  if (!pending.length) return null;
  return (
    <aside className="pending-uploads" aria-label="Subidas pendientes">
      <p>Nos quedó una tanda por guardar en este dispositivo.</p>
      <div>
        {pending.map((item) => (
          <button
            key={item.type}
            className="button secondary"
            onClick={() => onResume(item.type)}
          >
            <RotateCcw size={16} />
            Retomar {item.count}{" "}
            {item.type === "music"
              ? item.count === 1
                ? "canción"
                : "canciones"
              : item.count === 1
                ? "recuerdo"
                : "recuerdos"}
          </button>
        ))}
      </div>
    </aside>
  );
}
