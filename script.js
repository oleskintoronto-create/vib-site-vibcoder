/* =========================================================
   Поведение страницы. Файл подключён в конце index.html,
   поэтому элементы уже есть в документе.

   Что здесь происходит:
   1. Липкая шапка получает тень после прокрутки.
   2. Мобильное меню открывается, закрывается и не мешает на широком экране.
   3. Ссылки-якоря плавно прокручивают страницу к разделу.
   4. Форма проверяет обязательные поля и открывает готовое письмо.
   5. Год в подвале берётся из текущей даты.
   ========================================================= */

(function () {
  const header = document.querySelector("#header");
  const nav = document.querySelector("#site-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const form = document.querySelector("#request-form");
  const year = document.querySelector("#year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  /* ---------- Шапка при прокрутке ---------- */

  const navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.button)')) : [];
  const sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  /* Подсветка пункта меню: раздел, который уже дошёл до шапки */
  function updateCurrentSection() {
    const marker = window.scrollY + (header ? header.offsetHeight : 0) + 24;
    let currentId = "";

    sections.forEach(function (section) {
      if (section.offsetTop <= marker) currentId = section.id;
    });

    navLinks.forEach(function (link) {
      if (currentId && link.getAttribute("href") === "#" + currentId) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    updateCurrentSection();
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Мобильное меню ---------- */

  const desktopQuery = window.matchMedia("(min-width: 1041px)");

  function closeMenu(restoreFocus) {
    if (!menuToggle || !nav) return;
    const wasOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    if (restoreFocus && wasOpen) menuToggle.focus();
  }

  function openMenu() {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Закрыть меню");
    nav.classList.add("is-open");
    document.body.classList.add("menu-open");
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu(false);
      else openMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu(true);
    });

    document.addEventListener("click", function (event) {
      if (!header || header.contains(event.target)) return;
      closeMenu(false);
    });

    desktopQuery.addEventListener("change", function (event) {
      if (event.matches) closeMenu(false);
    });
  }

  /* ---------- Плавная прокрутка и текущий раздел ---------- */

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });

      if (nav && nav.contains(link)) closeMenu(false);
      history.pushState(null, "", id);
    });
  });

  /* ---------- Форма заявки ---------- */

  if (!form) return;

  const nameInput = document.querySelector("#name");
  const methodInput = document.querySelector("#contact-method");
  const contactInput = document.querySelector("#user-contact");
  const taskInput = document.querySelector("#task");
  const privacyInput = document.querySelector("#privacy-consent");
  const nameError = document.querySelector("#name-error");
  const methodError = document.querySelector("#method-error");
  const contactError = document.querySelector("#contact-error");
  const taskError = document.querySelector("#task-error");
  const privacyError = document.querySelector("#privacy-error");
  const formAlert = document.querySelector("#form-alert");
  const success = document.querySelector("#form-success");
  const successText = document.querySelector("#success-text");
  const resetButton = document.querySelector("#reset-form");
  const mailAddress = "oleskin.toronto@gmail.com";
  const mailSubject = "Заявка с сайта O.M. Dream Studio";

  function showFieldError(input, errorEl, message) {
    const field = input.closest(".field");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errorEl.id);
    errorEl.hidden = false;
    errorEl.textContent = message;
    if (field) field.classList.add("has-error");
  }

  function clearFieldError(input, errorEl) {
    const field = input.closest(".field");
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    errorEl.hidden = true;
    errorEl.textContent = "";
    if (field) field.classList.remove("has-error");
  }

  function clearAllErrors() {
    clearFieldError(nameInput, nameError);
    clearFieldError(methodInput, methodError);
    clearFieldError(contactInput, contactError);
    clearFieldError(taskInput, taskError);
    clearFieldError(privacyInput, privacyError);
    formAlert.hidden = true;
    formAlert.textContent = "";
  }

  function mailBody(name, method, contact, task) {
    return [
      "Имя: " + name,
      "Способ связи: " + method,
      "Контакт: " + contact,
      "Описание задачи: " + task
    ].join("\n");
  }

  function openMail(href) {
    const link = document.createElement("a");
    link.href = href;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function fieldIsFilled(input) {
    if (input.type === "checkbox") return input.checked;
    return Boolean(input.value.trim());
  }

  [
    [nameInput, nameError],
    [methodInput, methodError],
    [contactInput, contactError],
    [taskInput, taskError],
    [privacyInput, privacyError]
  ].forEach(function (pair) {
    function clearWhenFilled() {
      if (pair[0].getAttribute("aria-invalid") === "true" && fieldIsFilled(pair[0])) {
        clearFieldError(pair[0], pair[1]);
      }
      if (!form.querySelector("[aria-invalid='true']")) {
        formAlert.hidden = true;
        formAlert.textContent = "";
      }
    }

    pair[0].addEventListener("input", clearWhenFilled);
    pair[0].addEventListener("change", clearWhenFilled);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const method = methodInput.value.trim();
    const contact = contactInput.value.trim();
    const task = taskInput.value.trim();
    let firstInvalid = null;

    clearAllErrors();

    if (!name) {
      showFieldError(nameInput, nameError, "Введите имя.");
      firstInvalid = nameInput;
    }
    if (!method) {
      showFieldError(methodInput, methodError, "Выберите способ связи.");
      if (!firstInvalid) firstInvalid = methodInput;
    }
    if (!contact) {
      showFieldError(contactInput, contactError, "Укажите контакт: Telegram, почту или телефон.");
      if (!firstInvalid) firstInvalid = contactInput;
    }
    if (!task) {
      showFieldError(taskInput, taskError, "Кратко опишите задачу.");
      if (!firstInvalid) firstInvalid = taskInput;
    }
    if (!privacyInput.checked) {
      showFieldError(privacyInput, privacyError, "Отметьте согласие на обработку персональных данных.");
      if (!firstInvalid) firstInvalid = privacyInput;
    }

    if (firstInvalid) {
      formAlert.hidden = false;
      formAlert.textContent = "Заполните обязательные поля — они отмечены ниже.";
      firstInvalid.focus();
      return;
    }

    const href = "mailto:" + mailAddress
      + "?subject=" + encodeURIComponent(mailSubject)
      + "&body=" + encodeURIComponent(mailBody(name, method, contact, task));

    successText.textContent = "Письмо подготовлено. Если почтовая программа не открылась, напишите мне в Telegram.";
    form.hidden = true;
    success.hidden = false;
    successText.focus({ preventScroll: true });
    openMail(href);
  });

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      form.reset();
      clearAllErrors();
      success.hidden = true;
      form.hidden = false;
      nameInput.focus();
    });
  }
})();
