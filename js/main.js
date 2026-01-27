/* PROFILE AND STORAGE
---------------------- */
const key = 'er'; //! To be removed
const PROFILES_KEY = 'eldenring-profiles';
const DEFAULT_PROFILE = 'default';
const PROFILE_TEMPLATE = { [DEFAULT_PROFILE]: { checked: {}, collapsed: {} } };

const root = document.documentElement;

let activeProfile = localStorage.getItem('active-profile') || DEFAULT_PROFILE;
let profiles = loadProfiles();

if (!profiles[activeProfile]) {
    profiles[activeProfile] = { checked: {}, collapsed: {} };
}

//! To be removed
cleanLocalStorage();

function cleanLocalStorage() {
    const oldData = localStorage.getItem(key);

    if (oldData && !localStorage.getItem(PROFILES_KEY)) {
        localStorage.setItem(PROFILES_KEY, oldData);
    }

    localStorage.removeItem(key)
    localStorage.removeItem('cb');
    localStorage.removeItem('t');
    localStorage.removeItem('h');
    localStorage.removeItem('current');

    for (const name in profiles) {
        const p = profiles[name];
        if (!p.checked) p.checked = {};
        if (!p.collapsed) p.collapsed = {};

        if (p.data) {
            for (const k in p.data) {
                if (!p.checked[k]) p.checked[k] = p.data[k];
            }
            delete p.data;
        }
        if (p.col) {
            for (const k in p.col) {
                if (!p.collapsed[k]) p.collapsed[k] = p.col[k];
            }
            delete p.col;
        }
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}
//! End of: To be removed

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
            profiles[activeProfile].checked[id] = 1;

        } else {
            delete profiles[activeProfile].checked[id];
        }

        this.saveToStorage();
    },

    setCollapsed(id, expanded) {
        if (!id) return;

        if (expanded) {
            delete profiles[activeProfile].collapsed[id];

        } else {
            profiles[activeProfile].collapsed[id] = 1;
        }

        this.saveToStorage();
    },

    // Collapse/Expand all: Batch all updates to a single write. Chrome may drop spammy localStorage writes. See #8.
    setCollapsedBatch(updates) {
        if (!Array.isArray(updates) || !updates.length) return;

        updates.forEach(({ id, expanded }) => {
            if (!id) return;

            if (expanded) {
                delete profiles[activeProfile].collapsed[id];

            } else {
                profiles[activeProfile].collapsed[id] = 1;
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

        profiles[activeProfile] ??= { checked: {}, collapsed: {} };
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

        profiles[name] = { checked: {}, collapsed: {} };
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

        const preservedData = Object.entries(profiles[name].checked)
            .filter(([id]) => !sheetsToReset.has(id.charAt(0)));

        profiles[name].checked = Object.fromEntries(preservedData);
        this.saveToStorage();

        return {
            success: true
        };
    },

    delete(name) {
        if (name === DEFAULT_PROFILE) {
            profiles[DEFAULT_PROFILE] = { checked: {}, collapsed: {} };

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

/* OPTIONS.HTML
--------------- */
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

/* CHECKBOXES
------------- */
let sheetPrefix = '';
let cachedProgress = null;

const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const hasCheckboxes = checkboxes.length > 0;

const checkboxMap = new Map();

function buildCheckboxMap() {
    sheetPrefix = checkboxes[0].id.charAt(0);

    const len = checkboxes.length;

    for (let i = 0; i < len; i++) {
        checkboxMap.set(checkboxes[i], checkboxes[i].parentElement);
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
    const { checked } = profiles[activeProfile];
    const len = checkboxes.length;

    for (let i = 0; i < len; i++) {
        const checkbox = checkboxes[i];
        const isChecked = !!checked[checkbox.id];

        setCheckboxState(checkbox, isChecked);
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
    const checklistProgress = calculateChecklistProgress(checkboxes);

    updateSpans(checklistProgress, checklistSpans, navSpans);
    updateCurrentProgress(checklistProgress, totalSpan);
}

function refreshCheckboxUI() {
    restoreCheckboxes();
    updateChecklistProgress();
}

if (hasCheckboxes) {
    buildCheckboxMap();
    refreshCheckboxUI();

    function setAll(checklistId, checked) {
        const len = checkboxes.length;

        for (let i = 0; i < len; i++) {
            const checkbox = checkboxes[i];
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
}

/* EXPAND/COLLAPSE
------------------ */
const collapseBtns = document.querySelectorAll('.col');
const expandAllBtn = document.getElementById('expand-all');
const collapseAllBtn = document.getElementById('collapse-all');

const checklistMap = new Map();

function setCollapseState(btn, checklist, expanded) {
    btn.ariaExpanded = expanded;
    checklist.classList.toggle('f', !expanded);
}

function setupCollapseUI() {
    for (const btn of collapseBtns) {
        const checklistId = btn.getAttribute('aria-controls');
        const checklist = document.getElementById(checklistId);

        if (!checklist) continue;

        checklistMap.set(btn, checklist);

        const isCollapsed = !!profiles[activeProfile].collapsed[checklistId];
        setCollapseState(btn, checklist, !isCollapsed)

        btn.addEventListener('click', () => {
            const shouldExpand = btn.ariaExpanded !== 'true';

            setCollapseState(btn, checklist, shouldExpand);
            profile.setCollapsed(checklistId, shouldExpand);
        });
    }

    // Clean up style tag injected by inline script.
    document.getElementById('fouc')?.remove();
}

function setAllChecklists(expanded) {
    const updates = [];

    checklistMap.forEach((checklist, btn) => {
        setCollapseState(btn, checklist, expanded);

        const checklistId = btn.getAttribute('aria-controls');

        updates.push({ id: checklistId, expanded: expanded });
    });

    profile.setCollapsedBatch(updates);
}

if (expandAllBtn) {
    setupCollapseUI();

    expandAllBtn.addEventListener('click', () => {
        setAllChecklists(true);
    });

    collapseAllBtn.addEventListener('click', () => {
        setAllChecklists(false);
    });
}

/* HIDE CHECKED STEPS
--------------------- */
const hideBtn = document.getElementById('hide-btn');

localStorage.removeItem('hide-checked');

if (hideBtn) {
    root.classList.remove('hide-checked');
    hideBtn.ariaPressed = 'false';

    hideBtn.addEventListener('click', () => {
        const isHidden = !root.classList.contains('hide-checked');

        root.classList.toggle('hide-checked', isHidden);
        hideBtn.ariaPressed = isHidden ? 'true' : 'false';

        localStorage.setItem('hide-checked', isHidden ? 'true' : 'false');
    });
}

/* TOGGLE SIDEBAR
----------------- */
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

/* SCROLL TO TOP
---------------- */
const upBtn = document.getElementById('up-btn');
const scroll = document.getElementById('scroll-observer');

if (upBtn && scroll) {
    const observer = new IntersectionObserver(([entry]) => {
            const show = !entry.isIntersecting;

            upBtn.classList.toggle('show', show);
            upBtn.ariaHidden = show ? 'false' : 'true';
            upBtn.tabIndex = show ? 0 : -1;
        }
    );

    observer.observe(scroll);

    upBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0 });
        menu.focus();
    });
}



window.addEventListener('storage', (event) => {
    if (event.key === 'theme') {
        setTheme(event.newValue || 'system');

        if (theme) {
            theme.value = event.newValue || 'system';
        }
    }

    if (event.key === 'hide-checked') {
        const isHidden = event.newValue === 'true';

        root.classList.toggle('hide-checked', isHidden);

        if (hideBtn) {
            hideBtn.ariaPressed = isHidden ? 'true' : 'false';
        }

        return;
    }

    if (event.key === PROFILES_KEY) {
        try {
            profiles = JSON.parse(event.newValue);

            if (!profiles[activeProfile]) {
                activeProfile = DEFAULT_PROFILE;
            }

            if (hasCheckboxes) {
                refreshCheckboxUI();
            }

            if (expandAllBtn) {
                setupCollapseUI();
            }

        } catch (error) {
            console.error('Error syncing profile:', error);
        }

        return;
    }

    if (event.key === 'active-profile') {
        try {
            activeProfile = event.newValue || DEFAULT_PROFILE;

            if (dropdown) {
                refreshDropdown(dropdown, activeProfile);
            }

            if (hasCheckboxes) {
                refreshCheckboxUI();
            }

            if (expandAllBtn) {
                setupCollapseUI();
            }

        } catch (error) {
            console.error('Error syncing profile:', error);
        }

        return;
    }
});

// Open external links in new tab.
const links = document.querySelectorAll('a[href^="https"]');

for (let i = 0, len = links.length; i < len; i++) {
    const link = links[i];
    link.target = '_blank';
}

// Color Theme.
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

// Auto-update based on the system theme.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const theme = localStorage.getItem('theme') || 'system';
    if (theme === 'system') setTheme('system');
});

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
                const hideBtn = document.getElementById('hide-btn');
                if (hideBtn) hideBtn.click();
            }
            break;
    }
});

// Search checklists.
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
