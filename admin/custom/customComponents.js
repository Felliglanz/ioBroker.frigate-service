/* eslint-disable */
// @ts-nocheck

// Custom Master/Detail editor for ioBroker Admin jsonConfig.
// - Keeps UI self-contained and theme-aware.
// - Exposes: FrigateServiceUI/Components -> default export object containing { FrigateServiceItemsEditor }.
(function () {
    'use strict';

    const REMOTE_NAME = 'FrigateServiceUI';
    const UI_VERSION = '2026-01-30 20260130-1';

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

            const DialogSelectID = AdapterReact && (AdapterReact.DialogSelectID || AdapterReact.SelectID);
            const socket = (props && props.socket) || globalThis.socket || globalThis._socket || null;
            const theme = (props && props.theme) || null;
            const themePalette = theme && theme.palette ? theme.palette : null;
            const themeType = (themePalette && (themePalette.mode === 'dark' || themePalette.mode === 'light')) ? themePalette.mode : '';
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

            const rawItems = normalizeArray((props && props.data && (props.data[attr] || props.data.items)) || (props && props.data && props.data[DEFAULT_ITEMS_ATTR]) || []);
            const items = rawItems.map(it => ensureTitle(it, t));

            const camerasGlobal = normalizeArray(props && props.data && props.data.cameras);
            const targetsGlobal = normalizeArray(props && props.data && props.data.notifyTargets);

            const [selectedIndex, setSelectedIndex] = React.useState(0);
            const [selectContext, setSelectContext] = React.useState(null);

            React.useEffect(() => {
                if (selectedIndex > items.length - 1) {
                    setSelectedIndex(Math.max(0, items.length - 1));
                }
            }, [items.length, selectedIndex]);

            const updateItems = nextItems => {
                if (!props || typeof props.onChange !== 'function') return;
                const safeItems = normalizeArray(nextItems).map(it => ensureTitle(it, t));
                try {
                    props.onChange(DEFAULT_ITEMS_ATTR, safeItems);
                } catch {
                    // ignore
                }
                if (attr !== DEFAULT_ITEMS_ATTR) {
                    try {
                        props.onChange(attr, safeItems);
                    } catch {
                        // ignore
                    }
                }
                try {
                    props.forceUpdate && props.forceUpdate([attr], props.data);
                } catch {
                    // ignore
                }
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
                cams.push({ cameraId: '', targetId: '', comment: '' });
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

            const renderCameraSelect = (value, onChange) => {
                const options = camerasGlobal.filter(c => c && c.id).map(c => ({ value: String(c.id), label: c.name ? String(c.name) : String(c.id) }));
                return React.createElement(
                    'select',
                    { style: inputStyle, value: value || '', onChange: e => onChange(e.target.value) },
                    React.createElement('option', { value: '' }, t('Select…')),
                    options.map(o => React.createElement('option', { key: o.value, value: o.value }, o.label))
                );
            };

            const renderTargetSelect = (value, onChange) => {
                const options = targetsGlobal.filter(tg => tg && tg.id).map(tg => ({ value: String(tg.id), label: tg.name ? String(tg.name) : String(tg.id) }));
                return React.createElement(
                    'select',
                    { style: inputStyle, value: value || '', onChange: e => onChange(e.target.value) },
                    React.createElement('option', { value: '' }, t('Select…')),
                    options.map(o => React.createElement('option', { key: o.value, value: o.value }, o.label))
                );
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
                              React.createElement(
                                  'select',
                                  { style: inputStyle, value: selectedItem.kind || 'notify', onChange: e => updateSelected('kind', e.target.value) },
                                  React.createElement('option', { value: 'notify' }, t('Notify (Discord/Telegram)')),
                                  React.createElement('option', { value: 'device' }, t('Device (switch)'))
                              ),

                              React.createElement('div', { style: { marginTop: 16, fontSize: 12, fontWeight: 700 } }, t('Cameras')),
                              React.createElement(
                                  'div',
                                  { style: { fontSize: 12, color: colors.textMuted } },
                                  t('Optional: Add one or more cameras. If empty, the item applies to all cameras.')
                              ),
                              React.createElement('button', { type: 'button', style: Object.assign({}, btnStyle, { marginTop: 8 }), onClick: addCameraRow }, t('Add camera')),
                              normalizeArray(selectedItem.cameras).map((c, idx) => {
                                  return React.createElement(
                                      'div',
                                      { key: idx, style: { display: 'grid', gridTemplateColumns: '220px 1fr 1fr 90px', gap: 8, alignItems: 'center', marginTop: 8 } },
                                      renderCameraSelect(c && c.cameraId ? String(c.cameraId) : '', v => updateCameraRow(idx, 'cameraId', v)),
                                      renderTargetSelect(c && c.targetId ? String(c.targetId) : '', v => updateCameraRow(idx, 'targetId', v)),
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

                              selectedItem.kind === 'notify'
                                  ? React.createElement(
                                        React.Fragment,
                                        null,
                                        React.createElement('div', { style: { marginTop: 18, fontSize: 12, fontWeight: 700 } }, t('Notify')),
                                        React.createElement('label', { style: labelStyle }, t('Default target')),
                                        renderTargetSelect(selectedItem.notify && selectedItem.notify.targetId ? String(selectedItem.notify.targetId) : '', v => updateSelectedPath('notify.targetId', v)),
                                        React.createElement('label', { style: labelStyle }, t('Media mode')),
                                        React.createElement(
                                            'select',
                                            { style: inputStyle, value: (selectedItem.notify && selectedItem.notify.mediaMode) || 'clipFirst', onChange: e => updateSelectedPath('notify.mediaMode', e.target.value) },
                                            React.createElement('option', { value: 'clipFirst' }, t('Clip first (fallback snapshot)')),
                                            React.createElement('option', { value: 'snapshotOnly' }, t('Snapshot only'))
                                        ),
                                        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                                            React.createElement('div', null,
                                                React.createElement('label', { style: labelStyle }, t('Clip padding (s)')),
                                                React.createElement('input', { style: inputStyle, type: 'number', value: (selectedItem.notify && selectedItem.notify.clipPaddingSeconds) ?? 0, onChange: e => updateSelectedPath('notify.clipPaddingSeconds', Number(e.target.value)) })
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
                                            { style: inputStyle, value: (selectedItem.time && selectedItem.time.mode) || 'astroWindow', onChange: e => updateSelectedPath('time.mode', e.target.value) },
                                            React.createElement('option', { value: 'always' }, t('Always')),
                                            React.createElement('option', { value: 'astroWindow' }, t('Astro window (start/end states)'))
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
                                    ),
                              renderStatePicker()
                          )
                        : React.createElement('div', { style: { opacity: 0.9, color: colors.textMuted } }, t('Select an item on the left or add a new one.'))
                )
            );
        };
    }

    function createCameraDiscovery(React) {
        return function FrigateServiceCameraDiscovery(props) {
            const socket = (props && props.socket) || globalThis.socket || globalThis._socket || null;
            const adapterName = (props && (props.adapterName || props.adapter)) || 'frigate-service';
            const instance = (props && props.instance !== undefined) ? props.instance : 0;
            const adapterInstance = `${adapterName}.${instance}`;

            const t = text => {
                try {
                    if (props && typeof props.t === 'function') return props.t(text);
                } catch {
                    // ignore
                }
                const I18n = globalThis.I18n || (globalThis.window && globalThis.window.I18n);
                try {
                    if (I18n && typeof I18n.t === 'function') return I18n.t(text);
                } catch {
                    // ignore
                }
                return text;
            };

            const configured = Array.isArray(props && props.data && props.data.cameras) ? props.data.cameras : [];
            const configuredIds = new Set(configured.filter(c => c && c.id).map(c => String(c.id)));

            const [loading, setLoading] = React.useState(false);
            const [error, setError] = React.useState('');
            const [discovered, setDiscovered] = React.useState([]); // [{instance, cameras:[{id,name}]}]
            const [selected, setSelected] = React.useState(() => new Set(Array.from(configuredIds)));

            React.useEffect(() => {
                // keep selected in sync if user edits table manually
                const next = new Set(Array.from(configuredIds));
                setSelected(prev => {
                    const merged = new Set(Array.from(prev));
                    for (const id of next) merged.add(id);
                    return merged;
                });
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [configured.length]);

            const sendTo = (command, message) => {
                if (!socket || typeof socket.sendTo !== 'function') {
                    return Promise.reject(new Error('socket.sendTo not available'));
                }
                return new Promise((resolve, reject) => {
                    try {
                        socket.sendTo(adapterInstance, command, message, result => {
                            if (!result) return reject(new Error('No response'));
                            if (result.ok === false) return reject(new Error(result.error || 'Discovery failed'));
                            resolve(result);
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            };

            const onDiscover = async () => {
                setError('');
                setLoading(true);
                try {
                    const res = await sendTo('discoverCameras', { instances: [] });
                    const instances = Array.isArray(res.instances) ? res.instances : [];
                    setDiscovered(instances);

                    const nextSelected = new Set(Array.from(selected));
                    for (const inst of instances) {
                        for (const cam of (inst && Array.isArray(inst.cameras) ? inst.cameras : [])) {
                            if (cam && cam.id) nextSelected.add(String(cam.id));
                        }
                    }
                    setSelected(nextSelected);
                } catch (e) {
                    setError(e && e.message ? e.message : String(e));
                } finally {
                    setLoading(false);
                }
            };

            const flatten = () => {
                const out = [];
                for (const inst of discovered) {
                    const cams = inst && Array.isArray(inst.cameras) ? inst.cameras : [];
                    for (const cam of cams) {
                        if (!cam || !cam.id) continue;
                        out.push({ instance: inst.instance || '', id: String(cam.id), name: cam.name ? String(cam.name) : String(cam.id) });
                    }
                }
                out.sort((a, b) => (a.instance + a.id).localeCompare(b.instance + b.id));
                return out;
            };

            const applySelection = () => {
                const list = flatten();
                const map = new Map();
                // keep existing names first
                for (const c of configured) {
                    if (!c || !c.id) continue;
                    map.set(String(c.id), { id: String(c.id), name: c.name ? String(c.name) : String(c.id) });
                }
                for (const cam of list) {
                    if (!selected.has(cam.id)) continue;
                    if (!map.has(cam.id)) {
                        map.set(cam.id, { id: cam.id, name: cam.name || cam.id });
                    }
                }

                const next = Array.from(map.values());
                if (props && typeof props.onChange === 'function') {
                    props.onChange('cameras', next);
                }
                try {
                    props.forceUpdate && props.forceUpdate(['cameras'], props.data);
                } catch {
                    // ignore
                }
            };

            const toggle = id => {
                setSelected(prev => {
                    const next = new Set(Array.from(prev));
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                });
            };

            const list = flatten();
            const canDiscover = !!socket;

            const boxStyle = {
                border: '1px solid rgba(127,127,127,0.35)',
                borderRadius: 6,
                padding: 10,
                marginBottom: 10,
            };
            const btnStyle = {
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid rgba(127,127,127,0.35)',
                background: 'transparent',
                cursor: 'pointer',
                marginRight: 8,
            };

            return React.createElement(
                'div',
                { style: boxStyle },
                React.createElement('div', { style: { fontWeight: 700, marginBottom: 6 } }, t('Discover cameras from Frigate')),
                React.createElement(
                    'div',
                    { style: { fontSize: 12, opacity: 0.8, marginBottom: 8 } },
                    t('Click to scan all frigate.* instances and select which cameras to add to the Cameras table.')
                ),
                React.createElement(
                    'div',
                    { style: { marginBottom: 8 } },
                    React.createElement('button', { type: 'button', style: btnStyle, disabled: !canDiscover || loading, onClick: onDiscover }, loading ? t('Discovering…') : t('Discover cameras')),
                    React.createElement('button', { type: 'button', style: btnStyle, disabled: !list.length, onClick: applySelection }, t('Apply selection to table')),
                ),
                error ? React.createElement('div', { style: { color: '#b00020', fontSize: 12, marginBottom: 6 } }, `${t('Error')}: ${error}`) : null,
                list.length
                    ? React.createElement(
                          'div',
                          { style: { maxHeight: 220, overflow: 'auto', borderTop: '1px solid rgba(127,127,127,0.2)', paddingTop: 8 } },
                          list.map(cam =>
                              React.createElement(
                                  'label',
                                  { key: `${cam.instance}|${cam.id}`, style: { display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', cursor: 'pointer' } },
                                  React.createElement('input', { type: 'checkbox', checked: selected.has(cam.id), onChange: () => toggle(cam.id) }),
                                  React.createElement('span', null, `${cam.name} (${cam.id})`),
                                  cam.instance ? React.createElement('span', { style: { opacity: 0.7, fontSize: 12 } }, `– ${cam.instance}`) : null
                              )
                          )
                      )
                    : React.createElement('div', { style: { fontSize: 12, opacity: 0.7 } }, t('No discovered cameras yet.'))
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
            globalThis.customComponents.FrigateServiceCameraDiscovery = createCameraDiscovery(ReactNow);
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
            const FrigateServiceCameraDiscovery = createCameraDiscovery(React);

            try {
                globalThis.customComponents = globalThis.customComponents || {};
                globalThis.customComponents.FrigateServiceItemsEditor = FrigateServiceItemsEditor;
                globalThis.customComponents.FrigateServiceCameraDiscovery = FrigateServiceCameraDiscovery;
            } catch {
                // ignore
            }

            return { default: { FrigateServiceItemsEditor, FrigateServiceCameraDiscovery } };
        }
    };

    function get(module) {
        if (!moduleMap[module]) {
            return Promise.reject(new Error(`Unknown module: ${module}`));
        }
        return Promise.resolve().then(() => moduleMap[module]());
    }

    function init(scope) {
        shareScope = scope;
        return Promise.resolve();
    }

    globalThis[REMOTE_NAME] = { get, init };
})();
