import type { Library } from "../../shared/types";
import { availableBytes } from "../../shared/storage";
import { bytes } from "../lib";
export function StorageSummary({ storage }: { storage: Library["storage"] }) {
  const available = availableBytes(storage);
  const percent = Math.min(
    100,
    Math.max(0, (storage.used / storage.limit) * 100),
  );
  return (
    <section className="storage-summary" aria-label="Espacio de nuestro rincón">
      <div>
        <strong>{bytes(available)} disponibles</strong>
        <small>
          {bytes(storage.used)} usados de {bytes(storage.limit)}
        </small>
      </div>
      <div
        className="storage-meter"
        role="meter"
        aria-label="Espacio usado"
        aria-valuemin={0}
        aria-valuemax={storage.limit}
        aria-valuenow={Math.min(storage.used, storage.limit)}
        aria-valuetext={`${bytes(available)} disponibles`}
      >
        <span style={{ width: percent + "%" }} />
      </div>
      {available < 50_000_000 && (
        <small>Queda poco espacio para nuevos archivos.</small>
      )}
    </section>
  );
}
