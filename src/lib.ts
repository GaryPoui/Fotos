export const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export const formatDate = (date: string, long = false) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  }).format(new Date(date + "T12:00:00"));
export const bytes = (n: number) =>
  n >= 1024 ** 3
    ? (n / 1024 ** 3).toFixed(1) + " GB"
    : (n / 1024 ** 2).toFixed(1) + " MB";
export const mediaUrl = (id: string, thumb = false) =>
  "/api/files/" + encodeURIComponent(id) + (thumb ? "?thumb=1" : "");
export function expired() {
  window.dispatchEvent(new Event("session-expired"));
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "NuestroRincon",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("No hay conexión. Revisá internet e intentá otra vez.");
  }
  if (!response.ok) {
    if (response.status === 401 && path !== "/login") expired();
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "No pudimos completar la operación.");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function upload(
  file: File,
  fields: Record<string, string>,
  progress: (n: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media");
    xhr.setRequestHeader("X-Requested-With", "NuestroRincon");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () =>
      reject(new Error("Se cortó la conexión. Volvé a intentar."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      if (xhr.status === 401) expired();
      let message = "No pudimos subir el archivo.";
      try {
        message = JSON.parse(xhr.responseText).error || message;
      } catch {
        /* non JSON server error */
      }
      reject(new Error(message));
    };
    const data = new FormData();
    data.append("file", file);
    for (const [key, value] of Object.entries(fields)) data.append(key, value);
    xhr.send(data);
  });
}
