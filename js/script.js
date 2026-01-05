const key = 'er';
const D = 'default';
const root = document.documentElement;
const def = { [D]: { data: {}, col: {} } };
let A = localStorage.getItem('current') || D;
let p = initProfile();

// Initialize default profile, p = profile, def = default, A = active
function initProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(key)) ?? def;
    p[D] = {...def[D], ...p[D]};
    localStorage.setItem(key, JSON.stringify(p));
    return p;
  } catch (e) {
    console.error('Error initializing profile:', e);
    return def;
  }
}

// Manage profile data
const mgr = {
  get() {
    return p[A] || p[D];
  },

  setCl(id, checked) {
    if (!id) return;
    if (!p[A]) p[A] = { data: {}, col: {} };
    checked ? p[A].data[id] = 1 : delete p[A].data[id];
    localStorage.setItem(key, JSON.stringify(p));
  },

  setCol(id, expanded) {
    if (!id) return;
    if (!p[A]) p[A] = { data: {}, col: {} };
    if (!p[A].col) p[A].col = {};
    expanded ? delete p[A].col[id] : p[A].col[id] = 1;
    localStorage.setItem(key, JSON.stringify(p));
  },

  setBatch(updates) {
    if (!updates?.length) return;
    if (!p[A]) p[A] = { data: {}, col: {} };
    if (!p[A].col) p[A].col = {};

    updates.forEach(({id, expanded}) => {
      if (!id) return;
      expanded ? delete p[A].col[id] : p[A].col[id] = 1;
    });
    localStorage.setItem(key, JSON.stringify(p));
  },

  col() {
    return this.get().col || {};
  }
};

// Restore checked state from storage
function restoreCheckboxes() {
  const { data } = mgr.get();
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach(checkbox => {
    const checked = !!data[checkbox.id];
    checkbox.checked = checked;
    checkbox.closest('li').classList.toggle('c', checked);
  });
}

// Calculate totals
function calculateTotals() {
  const firstCheckbox = document.querySelector('input[type="checkbox"]');
  if (!firstCheckbox) return;
  const prefix = firstCheckbox.id.charAt(0);
  const totalAll = document.getElementById(`${prefix}-ot`);
  if (!totalAll) return;
  const sectionSpans = document.querySelectorAll(`span[id^="${prefix}-t"]`);
  const allCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));

  const sectionMap = allCheckboxes.reduce((map, checkbox) => {
    const section = checkbox.id.match(/^[wdnqmbaerhskcp](\d+)-/)[1];
    map.has(section) ? map.get(section).push(checkbox) : map.set(section, [checkbox]);
    return map;
  }, new Map());

  let overallChecked = 0, overallTotal = 0;

  sectionSpans.forEach(span => {
    const section = span.id.match(/t(\d+)$/)[1];
    const tocSpan = document.getElementById(`${prefix}-nt${section}`);
    const checkboxes = sectionMap.get(section) || [];
    const checked = checkboxes.filter(cb => cb.checked).length;
    const total = checkboxes.length;
    const text = total ? (checked === total ? 'DONE' : `${checked}/${total}`) : '0/0';
    const done = checked === total && total > 0;

    [span, tocSpan].forEach(el => {
      if (!el) return;
      el.classList.remove('d');
      el.textContent = text;
      if (done) el.classList.add('d');
    });

    overallChecked += checked;
    overallTotal += total;
  });
  totalAll.classList.remove('d');
  totalAll.textContent = overallTotal ? (overallChecked === overallTotal ? 'DONE' : `${overallChecked}/${overallTotal}`) : '0/0';
  if (overallChecked === overallTotal && overallTotal > 0) totalAll.classList.add('d');
}

// Store checkbox state when clicked
document.addEventListener('change', e => {
  if (e.target.matches('input[type="checkbox"]')) {
    const checkbox = e.target;
    const checked = checkbox.checked;
    checkbox.closest('li').classList.toggle('c', checked);
    mgr.setCl(checkbox.id, checkbox.checked);
    calculateTotals();
  }
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

// After DOM load
document.addEventListener('DOMContentLoaded', () => {
  restoreCheckboxes();
  calculateTotals();

  // Sync storage between tabs
  window.addEventListener('storage', (e) => {
    if (e.key === key || e.key === 'current') {
      try {
        if (e.key === key) {
          p = JSON.parse(e.newValue);
        } else if (e.key === 'current') {
          A = e.newValue || D;
          populateProfiles?.();
        }
        restoreCheckboxes();
        calculateTotals();
      } catch (e) {
        console.error('Error syncing profile:', e);
      }
    } else if (e.key === 'h') {
      const isHidden = e.newValue === '1';
      root.classList.toggle('hide', isHidden);
      if (hide) {
        hide.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
      }
    }
  });

  // Open every external link in new tab
  const links = document.querySelectorAll('a[href^="https"]');

  for (let i = 0, len = links.length; i < len; i++) {
    const link = links[i];
    link.target = '_blank';
  }

  // Handle color theme switching
  const theme = document.getElementById('theme');

  if (theme) {
    theme.value = localStorage.getItem('t') || 'l';

    theme.addEventListener('change', () => {
      const dark = theme.value === 'd';
      root.classList.toggle('dark', dark);
      localStorage.setItem('t', theme.value);
    });
  }

  // Populate profiles
  const select = document.getElementById('profile');
  const add = document.getElementById('add');
  const edit = document.getElementById('edit');
  const ngp = document.getElementById('ngp');
  const del = document.getElementById('del');

  function populateProfiles() {
    if (!select) return;
    select.innerHTML = '';
    select.add(new Option('Default', D));
    Object.keys(p).sort().filter(name => name !== D).forEach(name => select.add(new Option(name, name)));
    select.value = A;
  }
  populateProfiles();

  // Switch profile
  select?.addEventListener('change', () => {
    const selected = select.value || D;
    A = selected;
    selected === D ? localStorage.removeItem('current') : localStorage.setItem('current', selected);
    if (!p[selected]) p[selected] = { data: {}, col: {} };
  });

  // Create profile
  add?.addEventListener('click', () => {
    const name = prompt('Enter a name for your profile:')?.trim();
    if (!name) return;
    if (name.toLowerCase() === 'default' || p[name]) {
      alert(name.toLowerCase() === 'default' ? 'Profile name cannot be default.' : 'Profile already exists.');
      return;
    }

    p[name] = { data: {}, col: {} };
    A = name;
    localStorage.setItem(key, JSON.stringify(p));
    localStorage.setItem('current', name);
    select.value = name;
    populateProfiles();
  });

  // Edit profile
  edit?.addEventListener('click', () => {
    const current = select.value;
    if (current === D) {
      alert('Cannot edit default profile.');
      return;
    }

    const name = prompt(`Enter a new name for "${current}":`, current)?.trim();
    if (!name || name === current) return;
    if (name.toLowerCase() === 'default' || p[name]) {
      alert(name.toLowerCase() === 'default' ? 'Cannot use default as profile name.' : 'Profile already exists.');
      return;
    }

    const data = p[current];
    delete p[current];
    p[name] = data;
    A = name;
    localStorage.setItem(key, JSON.stringify(p));
    localStorage.setItem('current', name);
    populateProfiles();
  });

  // NG+ Reset
  ngp?.addEventListener('click',  () => {
    const current = select.value;
    if (!confirm('Reset all progress in Walkthrough, DLC-Walkthrough, NPC-Walkthrough, Questlines, Bosses, and New Game+ for the selected profile?')) return;
    const prefixes = ['w', 'd', 'n', 'q', 'b', 'p'];
    const filterData = Object.entries(p[current].data).reduce((acc, [id, value]) => {
      if (!prefixes.includes(id.charAt(0))) {
        acc[id] = value;
      }
      return acc;
    }, {});

    p[current].data = filterData;
    localStorage.setItem(key, JSON.stringify(p));
  });

  // Delete profile
  del?.addEventListener('click', () => {
    const current = select.value;
    if (!confirm(`Are you sure you want to ${current === D ? 'reset the default profile' : `delete "${current}"`}?`)) return;

    if (current === D) {
      p[D] = { data: {}, col: {} };
      localStorage.setItem(key, JSON.stringify(p));
    } else {
      delete p[current];
      localStorage.setItem(key, JSON.stringify(p));
      if (current === A) {
        A = D;
        localStorage.removeItem('current');
      }
      const option = select.querySelector(`option[value="${current}"]`);
      option?.remove();
      select.value = A;
    }
  });

  // Import/Export profiles
  const impF = document.getElementById('imp-f');
  const expF = document.getElementById('exp-f');
  const impC = document.getElementById('imp-c');
  const expC = document.getElementById('exp-c');

  function getData() {
    return {
      current: A,
      [key]: p
    };
  }

  function validate(data) {
    if (!data?.[key]?.[D]) throw new Error('Invalid profile data.');
    if (!confirm('Importing a new profile will overwrite all current data.')) return;
    localStorage.setItem(key, JSON.stringify(data[key]));
    p = data[key];
    if (data.current) {
      A = data.current;
      localStorage.setItem('current', A);
    }
    populateProfiles();
    alert('Successfully imported profile data.');
  }

  // Import file
  if (impF) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    impF.after(fileInput);
    impF.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        validate(data);
      } catch (e) {
        alert('Invalid profile data.');
        console.error(e);
      }
      fileInput.value = '';
    });
  }

  // Export file
  expF?.addEventListener('click', () => {
    try {
      const blob = new Blob([JSON.stringify(getData(), null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'elden-ring-cheat-sheet.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error exporting file.');
      console.error(e);
    }
  });

  // Import clipboard
  impC?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      validate(data);
    } catch (e) {
      alert('Invalid clipboard data.');
      console.error(e);
    }
  });

  // Export clipboard
  expC?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getData(), null, 2));
      alert('Profile data copied to clipboard.');
    } catch (e) {
      alert('Error copying to clipboard.');
      console.error(e);
    }
  });

  // Toggle sidebar functionality
  const menu = document.getElementById('menu');
  const sidebar = document.getElementById('sidebar');
  const close = sidebar.querySelector('.close');

  function toggleSidebar() {
    const hidden = sidebar.ariaHidden === 'true';

    if (hidden) {
      sidebar.ariaHidden = 'false';
      menu.ariaExpanded = 'true';
      sidebar.removeAttribute('inert');
    } else {
      menu.focus({ preventScroll: true });
      sidebar.ariaHidden = 'true';
      menu.ariaExpanded = 'false';
      sidebar.setAttribute('inert', '');
    }
  }

  menu.addEventListener('click', toggleSidebar);
  close.addEventListener('click', toggleSidebar);

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const formControl = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT';
    if (formControl) return;

    switch (e.key.toLowerCase()) {
      case 'escape':
        if (sidebar.ariaHidden === 'false') {
          toggleSidebar();
        }
        break;

      case 'q':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleSidebar();
          close.focus();
        }
        break;

      case '/':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const search = document.getElementById('search');
          if (search) search.focus();
        }
        break;

      case 'h':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const hide = document.getElementById('hide');
          if (hide) hide.click();
        }
        break;
    }
  });

  // Handle to-top button logic
  const up = document.getElementById('up');

  if (up) {
    const scroll = () => {
      const show = window.scrollY > 500;
      up.classList.toggle('show', show);
      up.setAttribute('aria-hidden', show ? 'false' : 'true');
      up.setAttribute('tabindex', show ? '0' : '-1');
    };

    window.addEventListener('scroll', scroll, { passive: true });
    scroll();

    up.addEventListener('click', () => {
      window.scrollTo({ top: 0 });
      menu?.focus();
    });
  }

  // Handle collapse/expand functionality
  const col = document.querySelectorAll('.col');
  const expA = document.getElementById('exp-a');
  const colA = document.getElementById('col-a');
  const ulMap = new Map();

  for (const btn of col) {
    const ulId = btn.getAttribute('aria-controls');
    const ul = document.getElementById(ulId);
    if (!ul) continue;
    ulMap.set(btn, ul);

    const isCollapsed = !!mgr.col()[ulId];
    btn.ariaExpanded = !isCollapsed;
    ul.classList.toggle('f', isCollapsed);

    btn.addEventListener('click', () => {
      const shouldExpand = btn.ariaExpanded !== 'true';
      btn.ariaExpanded = shouldExpand;
      ul.classList.toggle('f', !shouldExpand);
      mgr.setCol(ulId, shouldExpand);
    });
  }

  document.querySelector('style[data-c]')?.remove();

  const toggleAll = (expand) => {
    const updates = [];

    ulMap.forEach((ul, btn) => {
      const ulId = btn.getAttribute('aria-controls');
      btn.ariaExpanded = expand;
      ul.classList.toggle('f', !expand);
      updates.push({id: ulId, expanded: expand});
    });
    mgr.setBatch(updates);
  };

  expA?.addEventListener('click', () => toggleAll(true));
  colA?.addEventListener('click', () => toggleAll(false));

  // Hide completed checkboxes
  const hide = document.getElementById('hide');

  if (hide) {
    const isHidden = localStorage.getItem('h') === '1';
    root.classList.toggle('hide', isHidden);
    hide.setAttribute('aria-pressed', isHidden ? 'true' : 'false');

    hide.addEventListener('click', () => {
      const shouldHide = !root.classList.contains('hide');
      root.classList.toggle('hide', shouldHide);
      localStorage.setItem('h', shouldHide ? '1' : '0');
      hide.setAttribute('aria-pressed', shouldHide ? 'true' : 'false');
    });
  }

  // Search checklists
  function filterChecklist(searchTerm) {
    const sections = [...document.querySelectorAll('main h3')];
    const cleanTerm = searchTerm.toLowerCase().trim();
    
    if (!cleanTerm) {
      const allElements = document.querySelectorAll('main h3, main li');
      allElements.forEach(el => el.style.display = '');
      return;
    }
  
    const terms = cleanTerm.split(/\s+/);
    const matchCache = new Map();
    const matches = text => {
      if (!matchCache.has(text)) {
        matchCache.set(text, terms.every(term => text.includes(term)));
      }
      return matchCache.get(text);
    };
  
    for (const section of sections) {
      const list = section.nextElementSibling;
      if (!list) continue;

      const sectionText = section.textContent.toLowerCase();
      const sectionMatches = matches(sectionText);
  
      let sectionVisible = sectionMatches;
      const mainItems = list.children;

      if (sectionMatches) {
        section.style.display = '';
        list.querySelectorAll('li').forEach(li => li.style.display = '');
        continue;
      }
  
      for (const item of mainItems) {
        const mainText = item.textContent.toLowerCase();
        let showItem = matches(mainText);
  
        if (!showItem) {
          const nestedItems = item.querySelectorAll('ul li');
          for (const nested of nestedItems) {
            const nestedText = nested.textContent.toLowerCase();
            if (matches(nestedText)) {
              nested.style.display = '';
              showItem = true;
            } else {
              nested.style.display = 'none';
            }
          }
        } else {
          item.querySelectorAll('ul li').forEach(nested => {
            nested.style.display = '';
          });
        }
  
        item.style.display = showItem ? '' : 'none';
        sectionVisible ||= showItem;
      }
      section.style.display = sectionVisible ? '' : 'none';
    }
  }
  
  const search = document.getElementById('search');
  if (search) {
    search.addEventListener('input', e => filterChecklist(e.target.value));
  }
});
