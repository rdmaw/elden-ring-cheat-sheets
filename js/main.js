const key = 'er'; //! To be removed
const PROFILES_KEY = 'eldenring-profiles';
const DEFAULT_PROFILE = 'default';
const PROFILE_TEMPLATE = { [DEFAULT_PROFILE]: { data: {}, col: {} } };

const root = document.documentElement;

let activeProfile = localStorage.getItem('active-profile') || DEFAULT_PROFILE;
let profiles = loadProfiles();

if (!profiles[activeProfile]) {
    profiles[activeProfile] = { data: {}, col: {} };
}

//! To be removed
cleanStorageKeys();

function cleanStorageKeys() {
    const oldData = localStorage.getItem(key);

    if (oldData && !localStorage.getItem(PROFILES_KEY)) {
        localStorage.setItem(PROFILES_KEY, oldData);
    }

    localStorage.removeItem(key)
    localStorage.removeItem('cb');
    localStorage.removeItem('t');
    localStorage.removeItem('h');
    localStorage.removeItem('current');
}

function loadProfiles() {
    try {
        const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY)) ?? PROFILE_TEMPLATE;

        profiles[DEFAULT_PROFILE] = {
            ...PROFILE_TEMPLATE[DEFAULT_PROFILE],
            ...profiles[DEFAULT_PROFILE]
        };

        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

        return profiles;

    } catch (error) {
        console.error('Error loading profiles:', error);
        return PROFILE_TEMPLATE;
    }
}

const profile = {
    saveToStorage() {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    },

    list() {
        return [
            DEFAULT_PROFILE,
            ...Object.keys(profiles)
                .filter(name => name !== DEFAULT_PROFILE)
                .sort()
        ];
    },

    setChecked(id, checked) {
        if (!id) return;

        if (checked) {
            profiles[activeProfile].data[id] = 1;

        } else {
            delete profiles[activeProfile].data[id];
        }

        this.saveToStorage();
    },

    setCollapsed(id, expanded) {
        if (!id) return;

        if (expanded) {
            delete profiles[activeProfile].col[id];

        } else {
            profiles[activeProfile].col[id] = 1;
        }

        this.saveToStorage();
    },

    // Collapse/Expand all: Batch all updates to a single write. Chrome may drop spammy localStorage writes. See #8.
    setCollapsedBatch(updates) {
        if (!Array.isArray(updates) || !updates.length) return;

        updates.forEach(({ id, expanded }) => {
            if (!id) return;

            if (expanded) {
                delete profiles[activeProfile].col[id];

            } else {
                profiles[activeProfile].col[id] = 1;
            }
        });

        this.saveToStorage();
    },

    switch(name) {
        const selectedProfile = name || DEFAULT_PROFILE;
        activeProfile = selectedProfile;

        if (selectedProfile === DEFAULT_PROFILE) {
            localStorage.removeItem('active-profile');

        } else {
            localStorage.setItem('active-profile', selectedProfile);
        }

        profiles[activeProfile] ??= { data: {}, col: {} };
    },

    create(name) {
        if (!name) {
            return {
                success: false,
                error: "The profile name cannot be empty."
            };
        }

        if (name.toLowerCase() === 'default') {
            return {
                success: false,
                error: "Can't use default as the profile name."
            };
        }

        if (profiles[name]) {
            return {
                success: false,
                error: "This profile already exists."
            };
        }

        profiles[name] = { data: {}, col: {} };
        activeProfile = name;

        this.saveToStorage();
        localStorage.setItem('active-profile', name);

        return {
            success: true
        };
    },

    rename(oldName, newName) {
        if (!newName || newName === oldName) {
            return {
                success: false,
                error: "Name unchanged, because no new name was provided."
            };
        }

        if (newName.toLowerCase() === 'default') {
            return {
                success: false,
                error: "Can't use default as the profile name."
            };
        }

        if (profiles[newName]) {
            return {
                success: false,
                error: "This profile already exists."
            };
        }

        profiles[newName] = profiles[oldName];
        delete profiles[oldName];
        activeProfile = newName;

        this.saveToStorage();
        localStorage.setItem('active-profile', newName);

        return {
            success: true
        };
    },

    resetToNGPlus(name) {
        if (!profiles[name]) {
            return {
                success: false,
                error: "What? This profile doesn't exist."
            }
        }

        const sheetsToReset = new Set(['w', 'd', 'n', 'q', 'b', 'p'])

        const preservedData = Object.entries(profiles[name].data)
            .filter(([id]) => !sheetsToReset.has(id.charAt(0)));

        profiles[name].data = Object.fromEntries(preservedData);
        this.saveToStorage();

        return {
            success: true
        };
    },

    delete(name) {
        if (name === DEFAULT_PROFILE) {
            profiles[DEFAULT_PROFILE] = { data: {}, col: {} };

            this.saveToStorage();

            return {
                success: true,
            };
        }

        if (!profiles[name]) {
            return {
                success: false,
                error: "What? This profile doesn't exist."
            };
        }

        delete profiles[name];
        activeProfile = DEFAULT_PROFILE;

        this.saveToStorage();
        localStorage.removeItem('active-profile');

        return {
            success: true,
        };
    },

    exportAll() {
        return {
            current: activeProfile,
            [PROFILES_KEY]: profiles
        };
    },

    importAll(data) {
        if (!data?.[PROFILES_KEY]?.[DEFAULT_PROFILE]) {
            return {
                success: false,
                error: "Invalid data: missing default profile."
            };
        }

        localStorage.setItem(PROFILES_KEY, JSON.stringify(data[PROFILES_KEY]));
        profiles = data[PROFILES_KEY];

        if (data.current && data.current !== DEFAULT_PROFILE) {
            activeProfile = data.current;
            localStorage.setItem('active-profile', activeProfile);

        } else {
            activeProfile = DEFAULT_PROFILE;
            localStorage.removeItem('active-profile');
        }

        return {
            success: true
        };
    }
};

const dropdown = document.getElementById('profile');

function createOptions(profiles) {
    return profiles.map(name => new Option(
        name === DEFAULT_PROFILE ? 'Default' : name,
        name
    ));
}

function refreshDropdown(dropdown, activeProfile) {
    if (!dropdown) return;

    const profiles = profile.list();

    dropdown.replaceChildren(
        ...createOptions(profiles)
    );

    dropdown.value = activeProfile;
}

if (dropdown) {

    refreshDropdown(dropdown, activeProfile);

    const createBtn = document.getElementById('create');
    const editBtn = document.getElementById('edit');
    const newGamePlusBtn = document.getElementById('new-game-plus');
    const deleteBtn = document.getElementById('delete');

    const exportFileBtn = document.getElementById('export-file');
    const exportClipboardBtn = document.getElementById('export-clipboard');

    const importFileBtn = document.getElementById('import-file');
    const importClipboardBtn = document.getElementById('import-clipboard');

    dropdown.addEventListener('change', () => {
        profile.switch(dropdown.value);
    });

    createBtn.addEventListener('click', () => {
        const name = prompt('Enter a name for the profile:')?.trim();
        const result = profile.create(name);

        if (!result.success) {
            alert(result.error);
            return;
        }

        refreshDropdown(dropdown, activeProfile);
        dropdown.value = activeProfile;
    });

    editBtn.addEventListener('click', () => {
        const currentProfile = dropdown.value;

        if (currentProfile === DEFAULT_PROFILE) {
            alert("Can't edit the default profile.");
            return;
        }

        const name = prompt(`Enter a new name for ${currentProfile}:`, currentProfile)?.trim();
        const result = profile.rename(currentProfile, name);

        if (!result.success) {
            alert(result.error);
            return;
        }

        refreshDropdown(dropdown, activeProfile);
    });

    newGamePlusBtn.addEventListener('click', () => {
        const currentProfile = dropdown.value;

        if (!confirm(`Reset all progress in Walkthrough, DLC-Walkthrough, NPC-Walkthrough, Questlines, Bosses, and New Game Plus for ${currentProfile === DEFAULT_PROFILE ? 'the default profile' : currentProfile}?`)) return;
        const result = profile.resetToNGPlus(currentProfile);

        if (!result.success) {
            alert(result.error);
        }
    });

    deleteBtn.addEventListener('click', () => {
        const currentProfile = dropdown.value;
        const isProfileDefault = currentProfile === DEFAULT_PROFILE;
        const action = isProfileDefault ? 'reset the default profile' : `delete ${currentProfile}`;

        if (!confirm(`Are you sure you want to ${action}?`)) return;
        const result = profile.delete(currentProfile);

        if (!result.success) {
            alert(result.error);
            return;
        }

        refreshDropdown(dropdown, activeProfile);
        dropdown.value = activeProfile;
    });

    exportFileBtn.addEventListener('click', () => {
        try {
            const blob = new Blob([JSON.stringify(profile.exportAll(), null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = 'eldenring-progress.json';
            a.click();

            URL.revokeObjectURL(url);

        } catch (error) {
            alert('There was an error exporting the file.');
            console.error(error);
        }
    });

    const fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    importFileBtn.after(fileInput);

    importFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async event => {
        const file = event.target.files[0];

        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!confirm('Importing a new profile will overwrite all current data.')) return;
            const result = profile.importAll(data);

            if (result.success) {
                refreshDropdown(dropdown, activeProfile);
                alert('Successfully imported profile data.');

            } else {
                alert(result.error);
            }
        } catch (error) {
            alert('Invalid profile data.');
            console.error(error);
        }

        fileInput.value = '';
    });

    exportClipboardBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(profile.exportAll(), null, 2));
            alert('Profile data has been copied to the clipboard.');

        } catch (error) {
            alert('There was an error copying to the clipboard.');
            console.error(error);
        }
    });

    importClipboardBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            const data = JSON.parse(text);

            if (!confirm('Importing a new profile will overwrite all current data.')) return;
            const result = profile.importAll(data);

            if (result.success) {
                refreshDropdown(dropdown, activeProfile);
                alert('Successfully imported profile data.');

            } else {
                alert(result.error);
            }
        } catch (error) {
            alert('Invalid clipboard data.');
            console.error(error);
        }
    });
}

const checkboxMap = new Map();

let cachedCheckboxes = null;
let cachedProgress = null;
let sheetPrefix = '';

function cacheCheckboxes() {
    if (cachedCheckboxes) return cachedCheckboxes.length > 0;

    cachedCheckboxes = document.querySelectorAll('input[type="checkbox"]');

    if (!cachedCheckboxes || cachedCheckboxes.length === 0) {
        return false;
    }

    sheetPrefix = cachedCheckboxes[0].id.charAt(0);

    const len = cachedCheckboxes.length;

    for (let i = 0; i < len; i++) {
        checkboxMap.set(cachedCheckboxes[i], cachedCheckboxes[i].parentElement);
    }

    return true;
}

function setCheckboxState(checkbox, checked) {
    checkbox.checked = checked;
    const li = checkboxMap.get(checkbox);

    if (li) {
        li.classList.toggle('c', checked);
    }
}

function restoreCheckboxes() {
    const { data } = profiles[activeProfile];
    const len = cachedCheckboxes.length;

    for (let i = 0; i < len; i++) {
        const checkbox = cachedCheckboxes[i];
        const checked = !!data[checkbox.id];

        setCheckboxState(checkbox, checked);
    }
}

function calculateChecklistProgress(checkboxes) {
    const checklistProgress = {};
    const idStart = 1;
    const len = checkboxes.length;

    for (let i = 0; i < len; i++) {
        const checkbox = checkboxes[i];
        const checkboxId = checkbox.id;
        const hyphenIndex = checkboxId.indexOf('-', idStart);

        if (hyphenIndex === -1) continue;

        const checklistId = checkboxId.substring(idStart, hyphenIndex);

        if (!checklistProgress[checklistId]) {
            checklistProgress[checklistId] = { checked: 0, total: 0, done: false };
        }

        const progress = checklistProgress[checklistId];
        progress.total++;

        if (checkbox.checked) {
            progress.checked++;
        }
    }

    for (const checklistId in checklistProgress) {
        if (Object.hasOwn(checklistProgress, checklistId)) {
            const progress = checklistProgress[checklistId];

            progress.done = progress.checked === progress.total && progress.total > 0;
        }
    }

    return checklistProgress;
}

function getSpanId(id) {
    const hyphenIndex = id.indexOf('-');

    if (hyphenIndex === -1) return '';

    const checklistId = id.substring(hyphenIndex + 1);

    if (checklistId.length < 2 || (checklistId[0] !== 's' && checklistId[0] !== 'n')) {
        return '';
    }

    return checklistId.substring(1);
}

function updateSpans(checklistProgress, checklistSpans, navSpans) {
    checklistSpans.forEach(span => {
        const checklistId = getSpanId(span.id);

        if (!checklistId) return;

        const progress = checklistProgress[checklistId] || { checked: 0, total: 0, done: false };
        const text = progress.total ? (progress.done ? 'DONE' : `${progress.checked}/${progress.total}`) : '0/0';

        const navSpan = navSpans[checklistId];

        [span, navSpan].forEach(tag => {
            if (!tag) return;

            tag.classList.remove('d');
            tag.textContent = text;

            if (progress.done) {
                tag.classList.add('d');
            }
        });
    });
}

function updateCurrentProgress(checklistProgress, totalSpan) {
    if (!totalSpan) return;

    let checked = 0;
    let total = 0;

    for (const checklistId in checklistProgress) {
        if (Object.hasOwn(checklistProgress, checklistId)) {
            const progress = checklistProgress[checklistId];

            checked += progress.checked;
            total += progress.total;
        }
    }

    const text = total ? (checked === total ? 'DONE' : `${checked}/${total}`) : '0/0';
    const done = checked === total && total > 0;

    totalSpan.classList.remove('d');
    totalSpan.textContent = text;

    if (done) {
        totalSpan.classList.add('d');
    }
}

function updateChecklistProgress() {
    if (!cachedProgress) {
        const prefix = sheetPrefix;
        const totalSpan = document.getElementById(`${prefix}-sheet`);

        if (!totalSpan) {
            console.error(`Current Progress span with prefix "${prefix}" could not be found`);
            return;
        }

        const checklistSpans = document.querySelectorAll(`span[id^="${prefix}-s"]`);

        if (checklistSpans.length === 0) return;

        const navSpans = {};
        const len = checklistSpans.length;

        for (let i = 0; i < len; i++) {
            const span = checklistSpans[i];
            const checklistId = getSpanId(span.id);

            if (checklistId) {
                navSpans[checklistId] = document.getElementById(`${prefix}-n${checklistId}`);
            }
        }

        cachedProgress = { totalSpan, checklistSpans: checklistSpans, navSpans };
    }

    const { totalSpan, checklistSpans, navSpans } = cachedProgress;
    const checklistProgress = calculateChecklistProgress(cachedCheckboxes);

    updateSpans(checklistProgress, checklistSpans, navSpans);
    updateCurrentProgress(checklistProgress, totalSpan);
}

if (cacheCheckboxes()) {
    restoreCheckboxes();
    updateChecklistProgress();
}

function setAll(checklistId, checked) {
    const len = cachedCheckboxes.length;

    for (let i = 0; i < len; i++) {
        const checkbox = cachedCheckboxes[i];
        const hyphenIndex = checkbox.id.indexOf('-', 1);

        if (hyphenIndex === -1) continue;

        const checklist = checkbox.id.substring(1, hyphenIndex);

        if (checklist === checklistId && checkbox.checked !== checked) {
            setCheckboxState(checkbox, checked);
            profile.setChecked(checkbox.id, checked);
        }
    }

    updateChecklistProgress();
}

document.addEventListener('change', event => {
    if (event.target.matches('input[type="checkbox"]')) {
        const checkbox = event.target;

        setCheckboxState(checkbox, checkbox.checked);
        profile.setChecked(checkbox.id, checkbox.checked);

        updateChecklistProgress();
    }
});

document.addEventListener('click', function (event) {
    if (event.target.matches('.btn[data-checklist][data-action]')) {
        const checklist = event.target.getAttribute('data-checklist');
        const shouldCheck = event.target.getAttribute('data-action') === 'check';

        setAll(checklist, shouldCheck);
    }
});

// Live-sync storage between open tabs
window.addEventListener('storage', (e) => {
    if (e.key === PROFILES_KEY || e.key === 'active-profile') {
        try {
            if (e.key === PROFILES_KEY) {
                profiles = JSON.parse(e.newValue);
            } else if (e.key === 'active-profile') {
                activeProfile = e.newValue || DEFAULT_PROFILE;
                refreshDropdown?.(dropdown, activeProfile);
            }
            restoreCheckboxes();
            updateChecklistProgress();
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

// Color Theme
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

// Auto-update based on the system theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const theme = localStorage.getItem('theme') || 'system';
    if (theme === 'system') setTheme('system');
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
const scroll = document.getElementById('scroll-observer');

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

    const isCollapsed = !!profiles[activeProfile].col[ulId];
    btn.ariaExpanded = !isCollapsed;
    ul.classList.toggle('f', isCollapsed);

    btn.addEventListener('click', () => {
        const shouldExpand = btn.ariaExpanded !== 'true';
        btn.ariaExpanded = shouldExpand;
        ul.classList.toggle('f', !shouldExpand);
        profile.setCollapsed(ulId, shouldExpand);
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
    profile.setCollapsedBatch(updates);
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

//! Keep? Test with mobiles device using forward cache before removing.
// window.addEventListener('pageshow', (event) => {
//     if (event.persisted) {
//         window.location.reload();
//     }
// });
