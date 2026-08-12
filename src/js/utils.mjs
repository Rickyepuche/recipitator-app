

export function renderWithTemplate(template, parentElement, data, callback) {
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }
}

export function initMobileNav() {
  const menuBtn = document.querySelector("#menuBtn");
  const mobileMenu = document.querySelector("#mobileMenu");

  if (!menuBtn || !mobileMenu) return;

  const closeMenu = () => {
    mobileMenu.classList.remove("active");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = mobileMenu.classList.toggle("active");
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!mobileMenu.contains(event.target) && !menuBtn.contains(event.target)) {
      closeMenu();
    }
  });
}

async function loadTemplate(path) {
  const res = await fetch(path);
  return await res.text();
}

export async function loadHeaderFooter() {
  const headerPath = new URL("../../partials/header.html", import.meta.url).href;
  const footerPath = new URL("../../partials/footer.html", import.meta.url).href;

  const headerTemplate = await loadTemplate(headerPath);
  const footerTemplate = await loadTemplate(footerPath);

  const headerElement = document.querySelector("#main-header");
  const footerElement = document.querySelector("#main-footer");

  renderWithTemplate(headerTemplate, headerElement);
  renderWithTemplate(footerTemplate, footerElement);
  initMobileNav();
}

