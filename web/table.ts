function bindFilterForm() {
  const form = document.querySelector("form[aria-label='Фильтры']") as HTMLFormElement | null;
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => params.append(key, value as string));
    const newQs = params.toString();
    const newUrl = `/${newQs ? `?${newQs}` : ""}`;
    history.pushState({}, "", newUrl);
    void refreshResults(newUrl);
  });
}

async function refreshResults(url: string) {
  const res = await fetch(url);
  if (!res.ok) return;
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const newAside = doc.querySelector("#filter-aside");
  const currentAside = document.querySelector("#filter-aside");
  const newContent = doc.querySelector("#results-content");
  const currentContent = document.querySelector("#results-content");
  if (!newAside || !currentAside || !newContent || !currentContent) return;

  currentAside.innerHTML = newAside.innerHTML;
  currentContent.innerHTML = newContent.innerHTML;
  document.title = doc.title;

  bindFilterForm();
}

document.addEventListener("turbo:load", bindFilterForm);
