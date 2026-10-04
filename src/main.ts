import { isSort } from "./model.ts";

const SORT_KEY = "links.sort.v1";
const links = document.querySelector<HTMLDivElement>("#links")!;
const sort = document.querySelector<HTMLSelectElement>("#sort")!;
const rows = [...links.querySelectorAll<HTMLAnchorElement>("a")];

function render(): void {
  const direction = sort.value === "domain-desc" ? -1 : 1;
  const ordered = [...rows].sort((a, b) => {
    const position = Number(a.dataset.position) - Number(b.dataset.position);
    if (sort.value === "collection") return position;
    return direction * a.dataset.domain!.localeCompare(b.dataset.domain!, "en") || position;
  });
  links.replaceChildren(...ordered);
}

try {
  const saved = localStorage.getItem(SORT_KEY);
  if (isSort(saved)) sort.value = saved;
} catch { /* Storage is optional. */ }

sort.disabled = false;
sort.addEventListener("change", () => {
  try { localStorage.setItem(SORT_KEY, sort.value); } catch { /* Storage is optional. */ }
  render();
});
render();
