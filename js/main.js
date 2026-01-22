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
        p[D] = { ...def[D], ...p[D] };
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
        mgr.scheduleSave();
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

        updates.forEach(({ id, expanded }) => {
            if (!id) return;
            expanded ? delete p[A].col[id] : p[A].col[id] = 1;
        });
        localStorage.setItem(key, JSON.stringify(p));
    },

    col() {
        return this.get().col || {};
    },

    saveTimer: null,
    scheduleSave() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            localStorage.setItem(key, JSON.stringify(p));
        }, 100);
    }
};

// Restore checked state from storage
const checkboxMap = new WeakMap();
let cachedCheckboxes = null;
let cachedTotalElements = null;

function cacheCheckboxes() {
    cachedCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    cachedCheckboxes.forEach(checkbox => {
        checkboxMap.set(checkbox, checkbox.closest('li'));
    });
}

function restoreCheckboxes() {
    const { data } = mgr.get();
    if (!cachedCheckboxes) return;

    cachedCheckboxes.forEach(checkbox => {
        const checked = !!data[checkbox.id];
        const li = checkboxMap.get(checkbox);

        checkbox.checked = checked;
        if (li) {
            li.classList.toggle('c', checked);
        }
    });
}

// Calculate totals
function calculateTotals() {
    if (!cachedCheckboxes || cachedCheckboxes.length === 0) return;

    if (!cachedTotalElements) {
        const firstCheckbox = cachedCheckboxes[0];
        const prefix = firstCheckbox.id.charAt(0);
        const totalAll = document.getElementById(`${prefix}-ot`);
        if (!totalAll) return;

        const sectionSpans = document.querySelectorAll(`span[id^="${prefix}-t"]`);
        const sectionMap = new Map();
        const tocSpanMap = new Map();

        Array.from(cachedCheckboxes).forEach(checkbox => {
            const section = checkbox.id.match(/^[wdnqbmaerhstkcp](\d+)-/)[1];
            if (!sectionMap.has(section)) {
                sectionMap.set(section, []);
            }
            sectionMap.get(section).push(checkbox);
        });

        sectionSpans.forEach(span => {
            const section = span.id.match(/t(\d+)$/)[1];
            tocSpanMap.set(section, document.getElementById(`${prefix}-nt${section}`));
        });

        cachedTotalElements = {
            totalAll,
            sectionSpans: Array.from(sectionSpans),
            sectionMap,
            tocSpanMap
        };
    }
    const { totalAll, sectionSpans, sectionMap, tocSpanMap } = cachedTotalElements;
    let overallChecked = 0, overallTotal = 0;

    sectionSpans.forEach(span => {
        const section = span.id.match(/t(\d+)$/)[1];
        const tocSpan = tocSpanMap.get(section);
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
        const li = checkboxMap.get(checkbox);

        if (li) {
            li.classList.toggle('c', checkbox.checked);
        }
        mgr.setCl(checkbox.id, checkbox.checked);
        calculateTotals();
    }
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

window.addEventListener('beforeunload', () => {
    if (mgr.saveTimer) {
        clearTimeout(mgr.saveTimer);
        localStorage.setItem(key, JSON.stringify(p));
    }
});

// After DOM load
document.addEventListener('DOMContentLoaded', () => {
    cacheCheckboxes();
    restoreCheckboxes();
    calculateTotals();

    // Live-sync storage between open tabs
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
        } else if (e.key === 'theme') {
            setTheme(e.newValue || 'system');
            if (theme) theme.value = e.newValue || 'system';
        }
    });

    // Open external links in new tab
    const links = document.querySelectorAll('a[href^="https"]');

    for (let i = 0, len = links.length; i < len; i++) {
        const link = links[i];
        link.target = '_blank';
    }

    // Color theme switching
    const theme = document.getElementById('theme');
    const preferredTheme = localStorage.getItem('theme');
    const activeTheme = preferredTheme || 'system';

    function setTheme(theme) {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            return;
        }

        if (theme === 'system') {
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
            return;
        }

        root.setAttribute('data-theme', 'light');
    }

    setTheme(activeTheme);

    if (theme) {
        theme.value = activeTheme;

        theme.addEventListener('change', () => {
            const value = theme.value;
            localStorage.setItem('theme', value);
            setTheme(value);
        });
    }

    // Auto-update based on user's system
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const theme = localStorage.getItem('theme') || 'system';
        if (theme === 'system') setTheme('system');
    });

    // Populate profiles
    const select = document.getElementById('profile');
    const add = document.getElementById('add');
    const edit = document.getElementById('edit');
    const ngp = document.getElementById('ngp');
    const del = document.getElementById('del');

    function populateProfiles() {
        if (!select) return;
        select.replaceChildren();
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
            alert(name.toLowerCase() === 'default' ? "Can't use default as the profile name." : 'Profile already exists.');
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
            alert("Can't edit the default profile.");
            return;
        }

        const name = prompt(`Enter a new name for ${current}:`, current)?.trim();
        if (!name || name === current) return;
        if (name.toLowerCase() === 'default' || p[name]) {
            alert(name.toLowerCase() === 'default' ? "Can't use default as the profile name." : 'Profile already exists.');
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
    ngp?.addEventListener('click', () => {
        const current = select.value;
        if (!confirm(`Reset all progress in Walkthrough, DLC-Walkthrough, NPC-Walkthrough, Questlines, Bosses, and New Game Plus for ${current === D ? 'the default profile' : current}?`)) return;
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
        if (!confirm(`Are you sure you want to ${current === D ? 'reset the default profile' : 'delete ' + current}?`)) return;

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
            a.download = 'elden-ring-cheat-sheets.json';
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
    const scroll = document.getElementById('scroll');

    if (up && scroll) {
        const observer = new IntersectionObserver(
            ([entry]) => {
                const show = !entry.isIntersecting;
                up.classList.toggle('show', show);
                up.setAttribute('aria-hidden', show ? 'false' : 'true');
                up.setAttribute('tabindex', show ? '0' : '-1');
            },
            { threshold: [0] }
        );
        observer.observe(scroll);

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
            updates.push({ id: ulId, expanded: expand });
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
    const search = document.getElementById('search');
    if (search) {
        let cachedElements = null;
        let lastTerm = null;
        let debounceTimer;

        function filterChecklist(searchTerm) {
            const cleanTerm = searchTerm.toLowerCase().trim();
            if (cleanTerm === lastTerm) return;
            lastTerm = cleanTerm;

            if (!cachedElements) {
                const sections = [...document.querySelectorAll('main h3')];
                cachedElements = sections.map(section => {
                    const list = section.nextElementSibling;
                    if (!list) return null;

                    const sectionText = section.textContent.toLowerCase();
                    const mainItems = [...list.children];
                    const itemData = mainItems.map(item => {
                        const nestedList = item.querySelector('ul');
                        const nestedItems = nestedList ? [...nestedList.querySelectorAll('li')] : [];
                        const mainText = item.textContent.toLowerCase();
                        const nestedTexts = nestedItems.map(nested => nested.textContent.toLowerCase());
                        return { item, nestedItems, mainText, nestedTexts };
                    });

                    return { section, sectionText, itemData };
                }).filter(Boolean);
            }

            if (!cleanTerm) {
                cachedElements.forEach(({ section, itemData }) => {
                    section.style.display = '';
                    itemData.forEach(({ item, nestedItems }) => {
                        item.style.display = '';
                        nestedItems.forEach(nested => nested.style.display = '');
                    });
                });
                return;
            }

            const terms = cleanTerm.split(/\s+/);
            const matches = text => terms.every(term => text.includes(term));

            for (const { section, sectionText, itemData } of cachedElements) {
                const sectionMatches = matches(sectionText);
                let sectionVisible = sectionMatches;

                if (sectionMatches) {
                    section.style.display = '';
                    itemData.forEach(({ item, nestedItems }) => {
                        item.style.display = '';
                        nestedItems.forEach(nested => nested.style.display = '');
                    });
                    continue;
                }

                for (const { item, nestedItems, mainText, nestedTexts } of itemData) {
                    let showItem = matches(mainText);

                    if (!showItem) {
                        for (let i = 0; i < nestedItems.length; i++) {
                            if (matches(nestedTexts[i])) {
                                nestedItems[i].style.display = '';
                                showItem = true;
                            } else {
                                nestedItems[i].style.display = 'none';
                            }
                        }
                    } else {
                        nestedItems.forEach(nested => nested.style.display = '');
                    }

                    item.style.display = showItem ? '' : 'none';
                    sectionVisible ||= showItem;
                }
                section.style.display = sectionVisible ? '' : 'none';
            }
        }

        search.addEventListener('input', e => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => filterChecklist(e.target.value), 1);
        });
    }
});
