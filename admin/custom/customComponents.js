/* eslint-disable */
// @ts-nocheck

// Custom Master/Detail editor for ioBroker Admin jsonConfig.
// - Keeps UI self-contained and theme-aware.
// - Exposes: FrigateServiceUI/Components -> default export object containing { FrigateServiceItemsEditor }.
(function () {
    'use strict';

    const REMOTE_NAME = 'FrigateServiceUI';
    const UI_VERSION = '2026-01-31 20260131-1';

    let shareScope;

    function compareVersions(a, b) {
        const pa = String(a || '').split('.').map(n => parseInt(n, 10) || 0);
        const pb = String(b || '').split('.').map(n => parseInt(n, 10) || 0);
        const len = Math.max(pa.length, pb.length);
        for (let i = 0; i < len; i++) {
            const da = pa[i] || 0;
            const db = pb[i] || 0;
            if (da < db) return -1;
            if (da > db) return 1;
        }
        return 0;
    }

    async function loadShared(moduleName) {
        const g = globalThis;
        try {
            if (g.__webpack_share_scopes__ && g.__webpack_share_scopes__.default) {
                shareScope = g.__webpack_share_scopes__.default;
            }
        } catch {
            // ignore
        }

        const candidates = [];
        if (shareScope && shareScope[moduleName]) {
            candidates.push(shareScope[moduleName]);
        }

        for (const scopeEntry of candidates) {
            try {
                const vers = Object.keys(scopeEntry || {});
                vers.sort((a, b) => compareVersions(b, a));
                for (const v of vers) {
                    const factory = scopeEntry[v];
                    const mod = factory && typeof factory.get === 'function' ? await factory.get() : null;
                    const exp = mod && typeof mod === 'function' ? mod() : mod;
                    if (exp) return exp;
                }
            } catch {
                // ignore
            }
        }

        // Fallback to globals if available
        if (moduleName === 'react') return g.React;
        if (moduleName === '@iobroker/adapter-react-v5') return g.AdapterReact || g['@iobroker/adapter-react-v5'];
        return null;
    }

    function normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function detectThemeMode(props, theme) {
        const candidates = [
            props && (props.themeType || props.themeMode || props.themeName),
            theme && theme.palette && theme.palette.mode,
        ].filter(v => v === 'dark' || v === 'light');

        if (candidates.length) return candidates[0];

        try {
            const cls = (globalThis.document && globalThis.document.body && globalThis.document.body.className) || '';
            if (/\bdark\b/i.test(cls)) return 'dark';
            if (/\blight\b/i.test(cls)) return 'light';
        } catch {
            // ignore
        }

        try {
            if (globalThis.matchMedia && globalThis.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        } catch {
            // ignore
        }

        return 'light';
    }

    function calcTitle(item, t) {
        const enabled = !!(item && item.enabled);
        const name = item && item.name ? String(item.name).trim() : '';
        const fallback = item && item.kind ? (item.kind === 'device' ? (t ? t('Device') : 'Device') : (t ? t('Notify') : 'Notify')) : (t ? t('Item') : 'Item');
        return `${enabled ? '🟢 ' : '⚪ '}${name || fallback}`;
    }

    function ensureTitle(item, t) {
        return Object.assign({}, item || {}, { _title: calcTitle(item || {}, t) });
    }

    function makeNewItem(t) {
        return ensureTitle(
            {
                enabled: false,
                name: '',
                kind: 'notify',

                // Shared filter
                filter: {
                    types: ['end'],
                    label: 'person',
                    minScore: 0.8,
                    throttleMs: 30000,
                    dedupeTtlMs: 10 * 60 * 1000
                },

                // Multi-camera
                cameras: [],

                // Notify action
                notify: {
                    targetId: '',
                    mediaMode: 'clipFirst',
                    clipPaddingSeconds: 0,
                    clipInitialDelayMs: 5000,
                    clipFetchRetries: 3,
                    clipFetchRetryDelayMs: 2000,
                    clipFallbackToSnapshot: true,
                    maxUploadMb: 8
                },

                // Device action
                device: {
                    targetStateId: '',
                    offDelayMs: 30000,
                    safetyCheckIntervalMs: 60000
                },
                zones: [],
                time: {
                    mode: 'astroWindow',
                    startStateId: 'javascript.0.variables.astro.goldenHour',
                    endStateId: 'javascript.0.variables.astro.goldenHourEnd'
                }
            },
            t
        );
    }

    function createItemsEditor(React, AdapterReact) {
        return function FrigateServiceItemsEditor(props) {
            const DEFAULT_ITEMS_ATTR = 'items';
            const attr = (props && typeof props.attr === 'string' && props.attr) ? props.attr : DEFAULT_ITEMS_ATTR;

            function sanitizeConfigObject(obj) {
                if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
                const out = {};
                try {
                    for (const [k, v] of Object.entries(obj)) {
                        // Guard against accidental string-spread keys like {"0":"i","1":"t",...}
                        if (/^\d+$/.test(k) && typeof v === 'string' && v.length === 1) continue;
                        out[k] = v;
                    }
                } catch {
                    return obj;
                }
                return out;
            }

            const DialogSelectID = AdapterReact && (AdapterReact.DialogSelectID || AdapterReact.SelectID);
            const socket = (props && props.socket) || globalThis.socket || globalThis._socket || null;
            const theme = (props && props.theme) || null;
            const themeType = detectThemeMode(props, theme);
            const isDark = themeType === 'dark';

            const t = text => {
                try {
                    if (props && typeof props.t === 'function') return props.t(text);
                } catch {
                    // ignore
                }
                const I18n = (AdapterReact && AdapterReact.I18n) || globalThis.I18n || (globalThis.window && globalThis.window.I18n);
                try {
                    if (I18n && typeof I18n.t === 'function') return I18n.t(text);
                } catch {
                    // ignore
                }
                return text;
            };

            const colors = isDark
                ? {
                      panelBg: 'rgba(255,255,255,0.04)',
                      panelBg2: 'rgba(255,255,255,0.03)',
                      text: 'rgba(255,255,255,0.92)',
                      textMuted: 'rgba(255,255,255,0.70)',
                      border: 'rgba(255,255,255,0.16)',
                      rowBorder: 'rgba(255,255,255,0.10)',
                      hover: 'rgba(255,255,255,0.06)',
                      active: 'rgba(255,255,255,0.10)',
                      inputBg: 'rgba(255,255,255,0.06)'
                  }
                : {
                      panelBg: '#ffffff',
                      panelBg2: '#ffffff',
                      text: '#111111',
                      textMuted: 'rgba(0,0,0,0.70)',
                      border: 'rgba(0,0,0,0.15)',
                      rowBorder: 'rgba(0,0,0,0.10)',
                      hover: 'rgba(0,0,0,0.05)',
                      active: 'rgba(0,0,0,0.08)',
                      inputBg: '#ffffff'
                  };

            const rootStyle = { display: 'flex', gap: 12, width: '100%', minHeight: 360, height: '70vh', position: 'relative', alignItems: 'stretch', color: colors.text };
            const leftStyle = { width: 340, maxWidth: '40%', border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: colors.panelBg, height: '100%' };
            const rightStyle = { flex: 1, border: `1px solid ${colors.border}`, borderRadius: 6, padding: 12, background: colors.panelBg2, height: '100%', overflow: 'auto' };
            const toolbarStyle = { display: 'flex', gap: 8, padding: 10, borderBottom: `1px solid ${colors.rowBorder}`, flexWrap: 'wrap' };
            const listStyle = { overflowY: 'auto', overflowX: 'hidden', flex: 1 };
            const labelStyle = { display: 'block', fontSize: 12, color: colors.textMuted, marginTop: 10 };
            const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: 14, color: colors.text, background: colors.inputBg };
            const btnStyle = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, background: 'transparent', cursor: 'pointer', color: colors.text };
            const btnDangerStyle = Object.assign({}, btnStyle, { border: `1px solid ${isDark ? 'rgba(255,120,120,0.5)' : 'rgba(200,0,0,0.25)'}` });
            const listBtnStyle = isActive => ({ width: '100%', textAlign: 'left', padding: '10px 10px', border: 'none', borderBottom: `1px solid ${colors.rowBorder}`, background: isActive ? colors.active : 'transparent', cursor: 'pointer', color: colors.text, display: 'flex', alignItems: 'center', gap: 8 });

            // Native <select>/<option> popups can be hard to read in dark mode in some browsers.
            // Provide a best-effort readable styling.
            const selectStyle = Object.assign({}, inputStyle, {
                backgroundColor: colors.panelBg,
                color: colors.text,
                colorScheme: isDark ? 'dark' : 'light',
                WebkitTextFillColor: colors.text,
            });
            const optionStyle = { background: colors.panelBg, color: colors.text };

            const dropdownItemStyle = isSelected => ({
                padding: '8px 10px',
                cursor: 'pointer',
                background: isSelected ? colors.active : 'transparent',
                color: colors.text,
                borderBottom: `1px solid ${colors.rowBorder}`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            });

            const dropdownMenuStyle = {
                position: 'absolute',
                zIndex: 50,
                left: 0,
                right: 0,
                top: 'calc(100% + 4px)',
                maxHeight: 260,
                overflowY: 'auto',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: isDark ? '#1e1e1e' : '#ffffff',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.55)' : '0 10px 30px rgba(0,0,0,0.18)',
            };

            const dropdownButtonStyle = Object.assign({}, inputStyle, {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
            });

            const rawItems = normalizeArray((props && props.data && (props.data[attr] || props.data.items)) || (props && props.data && props.data[DEFAULT_ITEMS_ATTR]) || []);

            const [localItems, setLocalItems] = React.useState(rawItems);

            React.useEffect(() => {
                // Keep local state in sync with external config updates.
                setLocalItems(rawItems);
            }, [rawItems.length]);

            const items = normalizeArray(localItems).map(it => ensureTitle(it, t));

            const camerasGlobal = normalizeArray(props && props.data && props.data.cameras);
            const targetsGlobal = normalizeArray(props && props.data && props.data.notifyTargets);

            const [selectedIndex, setSelectedIndex] = React.useState(0);
            const [selectContext, setSelectContext] = React.useState(null);
            const [openDropdownId, setOpenDropdownId] = React.useState(null);

            React.useEffect(() => {
                const onDocClick = e => {
                    try {
                        // if click outside any dropdown, close
                        const el = e && e.target;
                        if (!el) return;
                        if (el.closest && el.closest('[data-frigate-dd="1"]')) return;
                    } catch {
                        // ignore
                    }
                    setOpenDropdownId(null);
                };
                try {
                    document.addEventListener('mousedown', onDocClick);
                } catch {
                    // ignore
                }
                return () => {
                    try {
                        document.removeEventListener('mousedown', onDocClick);
                    } catch {
                        // ignore
                    }
                };
            }, []);

            React.useEffect(() => {
                if (selectedIndex > items.length - 1) {
                    setSelectedIndex(Math.max(0, items.length - 1));
                }
            }, [items.length, selectedIndex]);

            const applyItemsChange = safeItems => {
                const baseDataRaw = (props && props.data) || null;
                const baseData = sanitizeConfigObject(baseDataRaw);
                const nextData = (baseData && typeof baseData === 'object' && !Array.isArray(baseData))
                    ? Object.assign({}, baseData, { [DEFAULT_ITEMS_ATTR]: safeItems, [attr]: safeItems })
                    : { [DEFAULT_ITEMS_ATTR]: safeItems, [attr]: safeItems };

                // Fast UI feedback even if parent update is async.
                try { setLocalItems(safeItems); } catch { /* ignore */ }

                let applied = false;

                // Preferred signatures in many jsonConfig runtimes
                if (props && typeof props.setValue === 'function') {
                    try {
                        props.setValue(attr, safeItems);
                        applied = true;
                    } catch {
                        // ignore
                    }
                }

                if (!applied && props && typeof props.onChange === 'function') {
                    // Signature B: onChange(newData, isChanged)
                    try {
                        props.onChange(nextData, true);
                        applied = true;
                    } catch {
                        // ignore
                    }

                    // Signature C: onChange(newData)
                    if (!applied) {
                        try {
                            props.onChange(nextData);
                            applied = true;
                        } catch {
                            // ignore
                        }
                    }

                    // Signature A (legacy): onChange(attr, value)
                    // WARNING: Calling this on Admin7 JsonConfig will corrupt the config (string spread into object).
                    if (!applied) {
                        try {
                            props.onChange(attr, safeItems);
                            applied = true;
                        } catch {
                            // ignore
                        }
                    }
                }

                // Some admin versions expose forceUpdate; ensure we never pass stale data.
                try {
                    if (props && typeof props.forceUpdate === 'function') {
                        if (props.forceUpdate.length >= 2) {
                            props.forceUpdate([attr], nextData);
                        } else {
                            props.forceUpdate();
                        }
                    }
                } catch {
                    // ignore
                }
            };

            const updateItems = nextItems => {
                const safeItems = normalizeArray(nextItems).map(it => ensureTitle(it, t));
                applyItemsChange(safeItems);
            };

            const selectedItem = items[selectedIndex] || null;

            const updateSelected = (field, value) => {
                const nextItems = items.map((it, i) => {
                    if (i !== selectedIndex) return it;
                    const next = Object.assign({}, it || {});
                    next[field] = value;
                    return ensureTitle(next, t);
                });
                updateItems(nextItems);
            };

            const updateSelectedPath = (path, value) => {
                const parts = String(path || '').split('.').filter(Boolean);
                if (!parts.length) return;
                const nextItems = items.map((it, i) => {
                    if (i !== selectedIndex) return it;
                    const root = Object.assign({}, it || {});
                    let cursor = root;
                    for (let p = 0; p < parts.length - 1; p++) {
                        const k = parts[p];
                        const existing = cursor[k];
                        const next = existing && typeof existing === 'object' ? Object.assign({}, existing) : {};
                        cursor[k] = next;
                        cursor = next;
                    }
                    cursor[parts[parts.length - 1]] = value;
                    return ensureTitle(root, t);
                });
                updateItems(nextItems);
            };

            const addItem = () => {
                const next = items.slice();
                next.push(makeNewItem(t));
                updateItems(next);
                setSelectedIndex(next.length - 1);
            };

            const deleteSelected = () => {
                if (!selectedItem) return;
                const next = items.slice();
                next.splice(selectedIndex, 1);
                updateItems(next);
                setSelectedIndex(Math.max(0, selectedIndex - 1));
            };

            const cloneSelected = () => {
                if (!selectedItem) return;
                const clone = Object.assign({}, selectedItem);
                clone.name = clone.name ? String(clone.name) + ' (copy)' : '';
                delete clone._title;
                const next = items.slice();
                next.splice(selectedIndex + 1, 0, ensureTitle(clone, t));
                updateItems(next);
                setSelectedIndex(selectedIndex + 1);
            };

            const moveSelected = direction => {
                const from = selectedIndex;
                const to = from + direction;
                if (to < 0 || to >= items.length) return;
                const next = items.slice();
                const tmp = next[from];
                next[from] = next[to];
                next[to] = tmp;
                updateItems(next);
                setSelectedIndex(to);
            };

            const addZone = () => {
                if (!selectedItem) return;
                const zones = normalizeArray(selectedItem.zones).slice();
                zones.push('');
                updateSelected('zones', zones);
            };

            const updateZone = (index, value) => {
                const zones = normalizeArray(selectedItem && selectedItem.zones).slice();
                zones[index] = value;
                updateSelected('zones', zones);
            };

            const deleteZone = index => {
                const zones = normalizeArray(selectedItem && selectedItem.zones).slice();
                zones.splice(index, 1);
                updateSelected('zones', zones);
            };

            const addCameraRow = () => {
                if (!selectedItem) return;
                const cams = normalizeArray(selectedItem.cameras).slice();
                if ((selectedItem.kind || 'notify') === 'notify') {
                    cams.push({ cameraId: '', targetId: '', comment: '' });
                } else {
                    // Device items only use cameras as an optional filter; no per-camera target override.
                    cams.push({ cameraId: '', comment: '' });
                }
                updateSelected('cameras', cams);
            };

            const updateCameraRow = (index, field, value) => {
                const cams = normalizeArray(selectedItem && selectedItem.cameras).slice();
                const cur = cams[index] && typeof cams[index] === 'object' ? Object.assign({}, cams[index]) : {};
                cur[field] = value;
                cams[index] = cur;
                updateSelected('cameras', cams);
            };

            const deleteCameraRow = index => {
                const cams = normalizeArray(selectedItem && selectedItem.cameras).slice();
                cams.splice(index, 1);
                updateSelected('cameras', cams);
            };

            const renderStatePicker = () => {
                if (!selectContext || !(DialogSelectID && socket && theme)) return null;
                const selected = '';
                return React.createElement(DialogSelectID, {
                    key: 'selectStateId',
                    imagePrefix: '../..',
                    dialogName: (props && (props.adapterName || props.adapter)) || 'frigate-service',
                    theme: theme,
                    themeType: themeType,
                    socket: socket,
                    types: 'state',
                    selected,
                    onClose: () => setSelectContext(null),
                    onOk: sel => {
                        const selectedStr = Array.isArray(sel) ? sel[0] : sel;
                        setSelectContext(null);
                        if (!selectedStr) return;
                        if (selectContext.kind === 'zone' && Number.isFinite(selectContext.index)) {
                            updateZone(selectContext.index, selectedStr);
                        }
                        if (selectContext.kind === 'deviceTarget') {
                            updateSelectedPath('device.targetStateId', selectedStr);
                        }
                        if (selectContext.kind === 'timeStart') {
                            updateSelectedPath('time.startStateId', selectedStr);
                        }
                        if (selectContext.kind === 'timeEnd') {
                            updateSelectedPath('time.endStateId', selectedStr);
                        }
                    }
                });
            };

            const formatCameraLabel = c => {
                const id = c && c.id ? String(c.id) : '';
                const name = c && c.name ? String(c.name) : '';
                if (!id) return '';
                if (name && name.trim() && name.trim() !== id) return `${name.trim()} (${id})`;
                return id;
            };

            const formatTargetLabel = tg => {
                const id = tg && tg.id ? String(tg.id) : '';
                const name = tg && tg.name ? String(tg.name) : '';
                if (!id) return '';
                if (name && name.trim() && name.trim() !== id) return `${name.trim()} (${id})`;
                return id;
            };

            const renderDropdown = ({ id, value, options, onChange, placeholder }) => {
                const selected = options.find(o => o.value === (value || '')) || null;
                const buttonText = selected ? selected.label : (placeholder || t('Select…'));
                const isOpen = openDropdownId === id;

                return React.createElement(
                    'div',
                    { style: { position: 'relative' }, 'data-frigate-dd': '1' },
                    React.createElement(
                        'div',
                        {
                            style: dropdownButtonStyle,
                            role: 'button',
                            tabIndex: 0,
                            onClick: () => setOpenDropdownId(isOpen ? null : id),
                            onKeyDown: e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setOpenDropdownId(isOpen ? null : id);
                                }
                                if (e.key === 'Escape') setOpenDropdownId(null);
                            },
                            title: buttonText,
                        },
                        React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, buttonText),
                        React.createElement('span', { style: { opacity: 0.85, marginLeft: 8 } }, isOpen ? '▲' : '▼')
                    ),
                    isOpen
                        ? React.createElement(
                              'div',
                              { style: dropdownMenuStyle },
                              React.createElement(
                                  'div',
                                  {
                                      style: dropdownItemStyle(!value),
                                      onClick: () => {
                                          setOpenDropdownId(null);
                                          onChange('');
                                      },
                                  },
                                  placeholder || t('Select…')
                              ),
                              options.map(o =>
                                  React.createElement(
                                      'div',
                                      {
                                          key: o.value,
                                          style: dropdownItemStyle(o.value === value),
                                          onClick: () => {
                                              setOpenDropdownId(null);
                                              onChange(o.value);
                                          },
                                          title: o.label,
                                      },
                                      o.label
                                  )
                              )
                          )
                        : null
                );
            };

            const renderCameraSelect = (value, onChange, ddId) => {
                const options = camerasGlobal
                    .filter(c => c && c.id)
                    .map(c => ({ value: String(c.id), label: formatCameraLabel(c) }))
                    .filter(o => o.value);

                return renderDropdown({
                    id: ddId || `camera:${value || ''}`,
                    value: value || '',
                    options,
                    onChange,
                    placeholder: t('Select camera…'),
                });
            };

            const renderTargetSelect = (value, onChange, ddId) => {
                const options = targetsGlobal
                    .filter(tg => tg && tg.id)
                    .map(tg => ({ value: String(tg.id), label: formatTargetLabel(tg) }))
                    .filter(o => o.value);

                return renderDropdown({
                    id: ddId || `target:${value || ''}`,
                    value: value || '',
                    options,
                    onChange,
                    placeholder: t('Select target…'),
                });
            };

            return React.createElement(
                'div',
                { style: rootStyle },
                React.createElement(
                    'div',
                    { style: leftStyle },
                    React.createElement(
                        'div',
                        { style: toolbarStyle },
                        React.createElement('button', { type: 'button', style: btnStyle, onClick: addItem }, t('Add')),
                        React.createElement('button', { type: 'button', style: btnStyle, onClick: cloneSelected, disabled: !selectedItem }, t('Duplicate')),
                        React.createElement('button', { type: 'button', style: btnDangerStyle, onClick: deleteSelected, disabled: !selectedItem }, t('Delete')),
                        React.createElement('button', { type: 'button', style: btnStyle, onClick: () => moveSelected(-1), disabled: selectedIndex <= 0 }, t('Up')),
                        React.createElement('button', { type: 'button', style: btnStyle, onClick: () => moveSelected(1), disabled: selectedIndex >= items.length - 1 }, t('Down'))
                    ),
                    React.createElement(
                        'div',
                        { style: listStyle },
                        items.length
                            ? items.map((it, i) =>
                                  React.createElement(
                                      'button',
                                      { key: i, type: 'button', style: listBtnStyle(i === selectedIndex), onClick: () => setSelectedIndex(i) },
                                      React.createElement('span', { style: { width: 22 } }, it.enabled ? '🟢' : '⚪'),
                                      React.createElement(
                                          'span',
                                          { style: { fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: it.name || it.kind || t('Unnamed') },
                                          it.name || it.kind || t('Unnamed')
                                      )
                                  )
                              )
                            : React.createElement('div', { style: { padding: 12, opacity: 0.9, color: colors.textMuted } }, t('No items configured.'))
                    )
                ),
                React.createElement(
                    'div',
                    { style: rightStyle },
                    selectedItem
                        ? React.createElement(
                              React.Fragment,
                              null,
                              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 } },
                                  React.createElement('div', { style: { fontSize: 16, fontWeight: 700 } }, calcTitle(selectedItem, t)),
                                  React.createElement('div', { style: { fontSize: 11, opacity: 0.7, color: colors.textMuted } }, `UI ${UI_VERSION}`)
                              ),
                              React.createElement(
                                  'label',
                                  { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 } },
                                  React.createElement('input', { type: 'checkbox', checked: !!selectedItem.enabled, onChange: e => updateSelected('enabled', !!e.target.checked) }),
                                  React.createElement('span', null, t('Enabled'))
                              ),
                              React.createElement('label', { style: labelStyle }, t('Name')),
                              React.createElement('input', { style: inputStyle, type: 'text', value: selectedItem.name || '', onChange: e => updateSelected('name', e.target.value) }),

                              React.createElement('label', { style: labelStyle }, t('Kind')),
                              renderDropdown({
                                  id: `kind:${selectedIndex}`,
                                  value: selectedItem.kind || 'notify',
                                  options: [
                                      { value: 'notify', label: t('Notify (Discord/Telegram)') },
                                      { value: 'device', label: t('Device (switch)') },
                                  ],
                                  onChange: v => updateSelected('kind', v),
                                  placeholder: t('Select kind…'),
                              }),

                              React.createElement('div', { style: { marginTop: 16, fontSize: 12, fontWeight: 700 } }, t('Cameras')),
                              React.createElement(
                                  'div',
                                  { style: { fontSize: 12, color: colors.textMuted } },
                                  (selectedItem.kind === 'device')
                                      ? t('Optional: Add one or more cameras as a filter. If empty, the item applies to all cameras.')
                                      : t('Optional: Add one or more cameras. If empty, the item applies to all cameras. You can override the target per camera.')
                              ),
                              React.createElement('button', { type: 'button', style: Object.assign({}, btnStyle, { marginTop: 8 }), onClick: addCameraRow }, t('Add camera')),
                              normalizeArray(selectedItem.cameras).map((c, idx) => {
                                  const isNotifyKind = (selectedItem.kind || 'notify') === 'notify';
                                  return React.createElement(
                                      'div',
                                      {
                                          key: idx,
                                          style: {
                                              display: 'grid',
                                              gridTemplateColumns: isNotifyKind ? '220px 1fr 1fr 90px' : '220px 1fr 90px',
                                              gap: 8,
                                              alignItems: 'center',
                                              marginTop: 8,
                                          },
                                      },
                                      renderCameraSelect(c && c.cameraId ? String(c.cameraId) : '', v => updateCameraRow(idx, 'cameraId', v), `camRow:${selectedIndex}:${idx}`),
                                      isNotifyKind
                                          ? renderTargetSelect(c && c.targetId ? String(c.targetId) : '', v => updateCameraRow(idx, 'targetId', v), `targetRow:${selectedIndex}:${idx}`)
                                          : null,
                                      React.createElement('input', { style: inputStyle, type: 'text', value: (c && c.comment) || '', placeholder: t('Comment (optional)'), onChange: e => updateCameraRow(idx, 'comment', e.target.value) }),
                                      React.createElement('button', { type: 'button', style: btnDangerStyle, onClick: () => deleteCameraRow(idx) }, t('Delete'))
                                  );
                              }),

                              React.createElement('div', { style: { marginTop: 18, fontSize: 12, fontWeight: 700 } }, t('Filter')),
                              React.createElement('label', { style: labelStyle }, t('Event types (comma-separated)')),
                              React.createElement('input', { style: inputStyle, type: 'text', value: (selectedItem.filter && selectedItem.filter.types ? selectedItem.filter.types.join(',') : 'end'), onChange: e => updateSelectedPath('filter.types', String(e.target.value || '').split(',').map(s => s.trim()).filter(Boolean)) }),
                              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                                  React.createElement('div', null,
                                      React.createElement('label', { style: labelStyle }, t('Label')),
                                      React.createElement('input', { style: inputStyle, type: 'text', value: (selectedItem.filter && selectedItem.filter.label) || 'person', onChange: e => updateSelectedPath('filter.label', e.target.value) })
                                  ),
                                  React.createElement('div', null,
                                      React.createElement('label', { style: labelStyle }, t('Min score')),
                                      React.createElement('input', { style: inputStyle, type: 'number', step: '0.01', value: (selectedItem.filter && selectedItem.filter.minScore) ?? 0.8, onChange: e => updateSelectedPath('filter.minScore', Number(e.target.value)) })
                                  )
                              ),
                              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                                  React.createElement('div', null,
                                      React.createElement('label', { style: labelStyle }, t('Sub-label (optional)')),
                                      React.createElement('input', { style: inputStyle, type: 'text', value: (selectedItem.filter && selectedItem.filter.subLabel) || '', onChange: e => updateSelectedPath('filter.subLabel', e.target.value) })
                                  ),
                                  React.createElement('div', null,
                                      React.createElement('label', { style: labelStyle }, t('Entered zones (comma-separated, optional)')),
                                      React.createElement('input', { style: inputStyle, type: 'text', value: (selectedItem.filter && Array.isArray(selectedItem.filter.enteredZones) ? selectedItem.filter.enteredZones.join(',') : ''), onChange: e => updateSelectedPath('filter.enteredZones', String(e.target.value || '').split(',').map(s => s.trim()).filter(Boolean)) })
                                  )
                              ),
                              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                                  React.createElement('div', null,
                                      React.createElement('label', { style: labelStyle }, t('Throttle (ms)')),
                                      React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.filter && selectedItem.filter.throttleMs) ?? 30000, onChange: e => updateSelectedPath('filter.throttleMs', Number(e.target.value)) })
                                  ),
                                  React.createElement('div', null,
                                      React.createElement('label', { style: labelStyle }, t('Dedupe TTL (ms)')),
                                      React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.filter && selectedItem.filter.dedupeTtlMs) ?? 600000, onChange: e => updateSelectedPath('filter.dedupeTtlMs', Number(e.target.value)) })
                                  )
                              ),

                              React.createElement(
                                  'div',
                                  { key: `kindPanel:${selectedItem.kind || 'notify'}` },
                                  selectedItem.kind === 'notify'
                                      ? React.createElement(
                                            React.Fragment,
                                            null,
                                        React.createElement('div', { style: { marginTop: 18, fontSize: 12, fontWeight: 700 } }, t('Notify')),
                                        React.createElement('label', { style: labelStyle }, t('Default target')),
                                        renderTargetSelect(selectedItem.notify && selectedItem.notify.targetId ? String(selectedItem.notify.targetId) : '', v => updateSelectedPath('notify.targetId', v), `targetDefault:${selectedIndex}`),
                                        React.createElement('label', { style: labelStyle }, t('Media mode')),
                                        renderDropdown({
                                            id: `mediaMode:${selectedIndex}`,
                                            value: (selectedItem.notify && selectedItem.notify.mediaMode) || 'clipFirst',
                                            options: [
                                                { value: 'clipFirst', label: t('Clip first (fallback snapshot)') },
                                                { value: 'snapshotOnly', label: t('Snapshot only') },
                                            ],
                                            onChange: v => updateSelectedPath('notify.mediaMode', v),
                                            placeholder: t('Select media mode…'),
                                        }),
                                        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                                            React.createElement('div', null,
                                                React.createElement('label', { style: labelStyle }, t('Clip padding (s)')),
                                                React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.notify && selectedItem.notify.clipPaddingSeconds) ?? 0, onChange: e => updateSelectedPath('notify.clipPaddingSeconds', Number(e.target.value)) }),
                                                React.createElement('div', { style: { fontSize: 12, marginTop: 6, color: colors.textMuted } }, t('Adds seconds before/after the event when downloading a clip. Typical: 0–3. Increase if clips start too late or end too early.'))
                                            ),
                                            React.createElement('div', null,
                                                React.createElement('label', { style: labelStyle }, t('Max upload (MB)')),
                                                React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.notify && selectedItem.notify.maxUploadMb) ?? 8, onChange: e => updateSelectedPath('notify.maxUploadMb', Number(e.target.value)) })
                                            )
                                        ),
                                        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                                            React.createElement('div', null,
                                                React.createElement('label', { style: labelStyle }, t('Clip initial delay (ms)')),
                                                React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.notify && selectedItem.notify.clipInitialDelayMs) ?? 5000, onChange: e => updateSelectedPath('notify.clipInitialDelayMs', Number(e.target.value)) })
                                            ),
                                            React.createElement('div', null,
                                                React.createElement('label', { style: labelStyle }, t('Clip retries')),
                                                React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.notify && selectedItem.notify.clipFetchRetries) ?? 3, onChange: e => updateSelectedPath('notify.clipFetchRetries', Number(e.target.value)) })
                                            )
                                        ),
                                        React.createElement(
                                            'label',
                                            { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 } },
                                            React.createElement('input', { type: 'checkbox', checked: !!(selectedItem.notify && selectedItem.notify.clipFallbackToSnapshot), onChange: e => updateSelectedPath('notify.clipFallbackToSnapshot', !!e.target.checked) }),
                                            React.createElement('span', null, t('Fallback to snapshot'))
                                        )
                                        )
                                      : React.createElement(
                                            React.Fragment,
                                            null,
                                        React.createElement('div', { style: { marginTop: 18, fontSize: 12, fontWeight: 700 } }, t('Device')),
                                        React.createElement('label', { style: labelStyle }, t('Target state id (switch)')),
                                        React.createElement(
                                            'div',
                                            { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                                            React.createElement('input', { style: Object.assign({}, inputStyle, { flex: 1 }), type: 'text', value: (selectedItem.device && selectedItem.device.targetStateId) || '', onChange: e => updateSelectedPath('device.targetStateId', e.target.value), placeholder: 'hue.0.someLamp.on' }),
                                            React.createElement('button', { type: 'button', style: btnStyle, disabled: !(DialogSelectID && socket && theme), onClick: () => setSelectContext({ kind: 'deviceTarget' }) }, t('Select'))
                                        ),
                                        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                                            React.createElement('div', null,
                                                React.createElement('label', { style: labelStyle }, t('Off delay (ms)')),
                                                React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.device && selectedItem.device.offDelayMs) ?? 30000, onChange: e => updateSelectedPath('device.offDelayMs', Number(e.target.value)) })
                                            ),
                                            React.createElement('div', null,
                                                React.createElement('label', { style: labelStyle }, t('Safety check interval (ms)')),
                                                React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.device && selectedItem.device.safetyCheckIntervalMs) ?? 60000, onChange: e => updateSelectedPath('device.safetyCheckIntervalMs', Number(e.target.value)) })
                                            )
                                        ),
                                        React.createElement('div', { style: { marginTop: 14, fontSize: 12, fontWeight: 700 } }, t('Zones (person counters)')),
                                        React.createElement('button', { type: 'button', style: Object.assign({}, btnStyle, { marginTop: 8 }), onClick: addZone }, t('Add zone')),
                                        normalizeArray(selectedItem.zones).map((z, idx) =>
                                            React.createElement(
                                                'div',
                                                { key: idx, style: { display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8, alignItems: 'center', marginTop: 8 } },
                                                React.createElement('input', { style: inputStyle, type: 'text', value: z || '', onChange: e => updateZone(idx, e.target.value), placeholder: 'frigate.0.Zone_X.person' }),
                                                React.createElement('button', { type: 'button', style: btnStyle, disabled: !(DialogSelectID && socket && theme), onClick: () => setSelectContext({ kind: 'zone', index: idx }) }, t('Select')),
                                                React.createElement('button', { type: 'button', style: btnDangerStyle, onClick: () => deleteZone(idx) }, t('Delete'))
                                            )
                                        ),
                                        React.createElement('div', { style: { marginTop: 14, fontSize: 12, fontWeight: 700 } }, t('Time condition')),
                                        React.createElement('label', { style: labelStyle }, t('Mode')),
                                        React.createElement(
                                            'select',
                                            { style: selectStyle, value: (selectedItem.time && selectedItem.time.mode) || 'astroWindow', onChange: e => updateSelectedPath('time.mode', e.target.value) },
                                            React.createElement('option', { value: 'always', style: optionStyle }, t('Always')),
                                            React.createElement('option', { value: 'astroWindow', style: optionStyle }, t('Astro window (start/end states)'))
                                        ),
                                        (selectedItem.time && selectedItem.time.mode) === 'astroWindow'
                                            ? React.createElement(
                                                  React.Fragment,
                                                  null,
                                                  React.createElement('label', { style: labelStyle }, t('Start time state id (HH:MM:SS)')),
                                                  React.createElement(
                                                      'div',
                                                      { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                                                      React.createElement('input', { style: Object.assign({}, inputStyle, { flex: 1 }), type: 'text', value: (selectedItem.time && selectedItem.time.startStateId) || '', onChange: e => updateSelectedPath('time.startStateId', e.target.value) }),
                                                      React.createElement('button', { type: 'button', style: btnStyle, disabled: !(DialogSelectID && socket && theme), onClick: () => setSelectContext({ kind: 'timeStart' }) }, t('Select'))
                                                  ),
                                                  React.createElement('label', { style: labelStyle }, t('End time state id (HH:MM:SS)')),
                                                  React.createElement(
                                                      'div',
                                                      { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                                                      React.createElement('input', { style: Object.assign({}, inputStyle, { flex: 1 }), type: 'text', value: (selectedItem.time && selectedItem.time.endStateId) || '', onChange: e => updateSelectedPath('time.endStateId', e.target.value) }),
                                                      React.createElement('button', { type: 'button', style: btnStyle, disabled: !(DialogSelectID && socket && theme), onClick: () => setSelectContext({ kind: 'timeEnd' }) }, t('Select'))
                                                  )
                                              )
                                            : null
                                        )
                              ),
                              renderStatePicker()
                          )
                        : React.createElement('div', { style: { opacity: 0.9, color: colors.textMuted } }, t('Select an item on the left or add a new one.'))
                )
            );
        };
    }

    // Register immediately for Admin environments that only look at window.customComponents
    try {
        const ReactNow = globalThis.React;
        const AdapterReactNow = globalThis.AdapterReact || globalThis['@iobroker/adapter-react-v5'];
        if (ReactNow) {
            globalThis.customComponents = globalThis.customComponents || {};
            globalThis.customComponents.FrigateServiceItemsEditor = createItemsEditor(ReactNow, AdapterReactNow);
        }
    } catch {
        // ignore
    }

    const moduleMap = {
        './Components': async function () {
            const React = globalThis.React || (await loadShared('react'));
            const AdapterReact = await loadShared('@iobroker/adapter-react-v5');
            if (!React) throw new Error('FrigateService custom UI: React not available.');
            const FrigateServiceItemsEditor = createItemsEditor(React, AdapterReact);

            try {
                globalThis.customComponents = globalThis.customComponents || {};
                globalThis.customComponents.FrigateServiceItemsEditor = FrigateServiceItemsEditor;
            } catch {
                // ignore
            }

            return { default: { FrigateServiceItemsEditor } };
        },
        // Some Admin/federation runtimes request the module without leading './'
        'Components': async function () {
            return moduleMap['./Components']();
        }
    };

    function get(module) {
        const factoryFn = moduleMap[module];
        if (!factoryFn) {
            return Promise.reject(new Error(`Module ${module} not found in ${REMOTE_NAME}`));
        }
        // Module federation expects a Promise that resolves to a *factory function*.
        // That factory function must return the module exports object.
        return Promise.resolve()
            .then(() => factoryFn())
            .then(mod => () => mod);
    }

    function init(scope) {
        shareScope = scope;
        return Promise.resolve();
    }

    globalThis[REMOTE_NAME] = { get, init };
})();

// IMPORTANT:
// Admin 7+ (module federation runtime) loads this file via classic <script src="..."></script>.
// Therefore it must NOT contain ESM `export` statements.
// The remote container is exposed via `globalThis.FrigateServiceUI` above.
