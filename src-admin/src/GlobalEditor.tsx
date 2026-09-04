// @ts-nocheck
// Ported from the generation-1 admin/custom/customComponents.js for GUI API generation 2.
// Logic is intentionally close to the original - only the module wrapper and the
// React/DialogSelectID/I18n import sources changed for the new Module Federation build.
import React from 'react';
import { normalizeArray, detectThemeMode } from './helpers';

// See ItemsEditor.tsx for why we don't depend on @iobroker/gui-components here.
const DialogSelectID = null;

export default function FrigateServiceGlobalEditor(props) {
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

    const rootStyle = { display: 'flex', flexDirection: 'column', gap: 20, width: '100%', color: colors.text };
    const sectionStyle = { display: 'flex', gap: 12, minHeight: 300, height: '50vh', position: 'relative', alignItems: 'stretch' };
    const leftStyle = { width: 280, maxWidth: '35%', border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: colors.panelBg };
    const rightStyle = { flex: 1, border: `1px solid ${colors.border}`, borderRadius: 6, padding: 12, background: colors.panelBg2, overflow: 'auto' };
    const toolbarStyle = { display: 'flex', gap: 8, padding: 10, borderBottom: `1px solid ${colors.rowBorder}`, flexWrap: 'wrap' };
    const listStyle = { overflowY: 'auto', overflowX: 'hidden', flex: 1 };
    const labelStyle = { display: 'block', fontSize: 12, color: colors.textMuted, marginTop: 10 };
    const labelWithTooltipStyle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textMuted, marginTop: 10 };
    const tooltipStyle = { cursor: 'help', opacity: 0.6, fontSize: 11 };
    const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: 14, color: colors.text, background: colors.inputBg };
    const btnStyle = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, background: 'transparent', cursor: 'pointer', color: colors.text };
    const btnDangerStyle = Object.assign({}, btnStyle, { border: `1px solid ${isDark ? 'rgba(255,120,120,0.5)' : 'rgba(200,0,0,0.25)'}` });
    const listBtnStyle = isActive => ({ width: '100%', textAlign: 'left', padding: '10px', border: 'none', borderBottom: `1px solid ${colors.rowBorder}`, background: isActive ? colors.active : 'transparent', cursor: 'pointer', color: colors.text });

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

    const camerasRaw = normalizeArray((props && props.data && props.data.cameras) || []);
    const targetsRaw = normalizeArray((props && props.data && props.data.notifyTargets) || []);

    const [cameras, setCameras] = React.useState(camerasRaw);
    const [targets, setTargets] = React.useState(targetsRaw);
    const [selectedCameraIdx, setSelectedCameraIdx] = React.useState(0);
    const [selectedTargetIdx, setSelectedTargetIdx] = React.useState(0);
    const [selectContext, setSelectContext] = React.useState(null);
    const [openDropdownId, setOpenDropdownId] = React.useState(null);

    React.useEffect(() => {
        const onDocClick = e => {
            try {
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
        setCameras(camerasRaw);
    }, [camerasRaw.length]);

    React.useEffect(() => {
        setTargets(targetsRaw);
    }, [targetsRaw.length]);

    const applyChange = (key, value) => {
        const nextData = Object.assign({}, (props && props.data) || {}, { [key]: value });
        if (props && typeof props.onChange === 'function') {
            try {
                props.onChange(nextData, true);
            } catch {
                try {
                    props.onChange(nextData);
                } catch {
                    // ignore
                }
            }
        }
    };

    const updateCameras = nextCameras => {
        setCameras(nextCameras);
        applyChange('cameras', nextCameras);
    };

    const updateTargets = nextTargets => {
        setTargets(nextTargets);
        applyChange('notifyTargets', nextTargets);
    };

    const selectedCamera = cameras[selectedCameraIdx] || null;
    const selectedTarget = targets[selectedTargetIdx] || null;

    const addCamera = () => {
        const next = cameras.slice();
        next.push({ id: '', name: '', zones: [] });
        updateCameras(next);
        setSelectedCameraIdx(next.length - 1);
    };

    const deleteCamera = () => {
        if (!selectedCamera) return;
        const next = cameras.slice();
        next.splice(selectedCameraIdx, 1);
        updateCameras(next);
        setSelectedCameraIdx(Math.max(0, selectedCameraIdx - 1));
    };

    const updateCamera = (field, value) => {
        const next = cameras.map((c, i) => (i === selectedCameraIdx ? Object.assign({}, c, { [field]: value }) : c));
        updateCameras(next);
    };

    const addZoneToCamera = () => {
        if (!selectedCamera) return;
        const zones = normalizeArray(selectedCamera.zones).slice();
        zones.push('');
        updateCamera('zones', zones);
    };

    const updateCameraZone = (zoneIdx, value) => {
        if (!selectedCamera) return;
        const zones = normalizeArray(selectedCamera.zones).slice();
        zones[zoneIdx] = value;
        updateCamera('zones', zones);
    };

    const deleteCameraZone = zoneIdx => {
        if (!selectedCamera) return;
        const zones = normalizeArray(selectedCamera.zones).slice();
        zones.splice(zoneIdx, 1);
        updateCamera('zones', zones);
    };

    const addTarget = () => {
        const next = targets.slice();
        next.push({ id: '', type: 'discordWebhook', webhookUrl: '', botToken: '', chatId: '' });
        updateTargets(next);
        setSelectedTargetIdx(next.length - 1);
    };

    const deleteTarget = () => {
        if (!selectedTarget) return;
        const next = targets.slice();
        next.splice(selectedTargetIdx, 1);
        updateTargets(next);
        setSelectedTargetIdx(Math.max(0, selectedTargetIdx - 1));
    };

    const updateTarget = (field, value) => {
        const next = targets.map((tg, i) => (i === selectedTargetIdx ? Object.assign({}, tg, { [field]: value }) : tg));
        updateTargets(next);
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

    const renderStatePicker = () => {
        if (!selectContext || !(DialogSelectID && socket && theme)) return null;
        return React.createElement(DialogSelectID, {
            key: 'selectStateGlobal',
            imagePrefix: '../..',
            dialogName: (props && (props.adapterName || props.adapter)) || 'frigate-service',
            theme: theme,
            themeType: themeType,
            socket: socket,
            types: 'state',
            selected: '',
            onClose: () => setSelectContext(null),
            onOk: sel => {
                const selectedStr = Array.isArray(sel) ? sel[0] : sel;
                setSelectContext(null);
                if (!selectedStr) return;
                if (selectContext.kind === 'cameraZone' && Number.isFinite(selectContext.zoneIdx)) {
                    updateCameraZone(selectContext.zoneIdx, selectedStr);
                }
            }
        });
    };

    return React.createElement(
        'div',
        { style: rootStyle },
        React.createElement('div', { style: { fontSize: 16, fontWeight: 700, marginBottom: 8 } }, t('Cameras')),
        React.createElement('div', { style: { fontSize: 12, color: colors.textMuted, marginBottom: 12 } },
            t('Define cameras with zones. Zones can be selected via state picker from Frigate adapter.')
        ),
        React.createElement(
            'div',
            { style: sectionStyle },
            React.createElement(
                'div',
                { style: leftStyle },
                React.createElement(
                    'div',
                    { style: toolbarStyle },
                    React.createElement('button', { type: 'button', style: btnStyle, onClick: addCamera }, t('Add camera')),
                    React.createElement('button', { type: 'button', style: btnDangerStyle, onClick: deleteCamera, disabled: !selectedCamera }, t('Delete'))
                ),
                React.createElement(
                    'div',
                    { style: listStyle },
                    cameras.length
                        ? cameras.map((cam, i) =>
                              React.createElement(
                                  'button',
                                  { key: i, type: 'button', style: listBtnStyle(i === selectedCameraIdx), onClick: () => setSelectedCameraIdx(i) },
                                  cam.id || cam.name || t('Unnamed camera')
                              )
                          )
                        : React.createElement('div', { style: { padding: 12, opacity: 0.9, color: colors.textMuted } }, t('No cameras configured.'))
                )
            ),
            React.createElement(
                'div',
                { style: rightStyle },
                selectedCamera
                    ? React.createElement(
                          React.Fragment,
                          null,
                          React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 12 } }, selectedCamera.id || selectedCamera.name || t('Camera details')),
                          React.createElement('label', { style: labelStyle }, t('Camera key (must match Frigate)')),
                          React.createElement('input', { style: inputStyle, type: 'text', value: selectedCamera.id || '', onChange: e => updateCamera('id', e.target.value), placeholder: 'e.g. einfahrt' }),
                          React.createElement('label', { style: labelStyle }, t('Display name (optional)')),
                          React.createElement('input', { style: inputStyle, type: 'text', value: selectedCamera.name || '', onChange: e => updateCamera('name', e.target.value), placeholder: 'e.g. Einfahrt' }),
                          React.createElement('div', { style: { marginTop: 16 } },
                              React.createElement('label', { style: labelWithTooltipStyle },
                                  React.createElement('span', null, t('Zones')),
                                  React.createElement('span', { style: tooltipStyle, title: t('Zone state IDs for device control (e.g. frigate.0.Zone_Name.person). Not needed for notifications.') }, '❓')
                              )
                          ),
                          React.createElement('button', { type: 'button', style: btnStyle, onClick: addZoneToCamera }, t('Add zone')),
                          normalizeArray(selectedCamera.zones).map((z, zIdx) =>
                              React.createElement(
                                  'div',
                                  { key: zIdx, style: { display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8, alignItems: 'center', marginTop: 8 } },
                                  React.createElement('input', { style: inputStyle, type: 'text', value: z || '', onChange: e => updateCameraZone(zIdx, e.target.value), placeholder: 'frigate.0.Zone_X.person' }),
                                  React.createElement('button', { type: 'button', style: btnStyle, disabled: !(DialogSelectID && socket && theme), onClick: () => setSelectContext({ kind: 'cameraZone', zoneIdx: zIdx }) }, t('Select')),
                                  React.createElement('button', { type: 'button', style: btnDangerStyle, onClick: () => deleteCameraZone(zIdx) }, t('Delete'))
                              )
                          )
                      )
                    : React.createElement('div', { style: { opacity: 0.9, color: colors.textMuted } }, t('Select a camera or add a new one.'))
            )
        ),

        React.createElement('div', { style: { fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 } }, t('Notification targets')),
        React.createElement('div', { style: { fontSize: 12, color: colors.textMuted, marginBottom: 12 } },
            t('Configure Discord webhooks or Telegram bots for notifications.')
        ),
        React.createElement(
            'div',
            { style: sectionStyle },
            React.createElement(
                'div',
                { style: leftStyle },
                React.createElement(
                    'div',
                    { style: toolbarStyle },
                    React.createElement('button', { type: 'button', style: btnStyle, onClick: addTarget }, t('Add target')),
                    React.createElement('button', { type: 'button', style: btnDangerStyle, onClick: deleteTarget, disabled: !selectedTarget }, t('Delete'))
                ),
                React.createElement(
                    'div',
                    { style: listStyle },
                    targets.length
                        ? targets.map((tg, i) =>
                              React.createElement(
                                  'button',
                                  { key: i, type: 'button', style: listBtnStyle(i === selectedTargetIdx), onClick: () => setSelectedTargetIdx(i) },
                                  tg.id || t('Unnamed target')
                              )
                          )
                        : React.createElement('div', { style: { padding: 12, opacity: 0.9, color: colors.textMuted } }, t('No targets configured.'))
                )
            ),
            React.createElement(
                'div',
                { style: rightStyle },
                selectedTarget
                    ? React.createElement(
                          React.Fragment,
                          null,
                          React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 12 } }, selectedTarget.id || t('Target details')),
                          React.createElement('label', { style: labelStyle }, t('Target id')),
                          React.createElement('input', { style: inputStyle, type: 'text', value: selectedTarget.id || '', onChange: e => updateTarget('id', e.target.value), placeholder: 'discord_haus' }),
                          React.createElement('label', { style: labelStyle }, t('Type')),
                          renderDropdown({
                              id: `targetType:${selectedTargetIdx}`,
                              value: selectedTarget.type || 'discordWebhook',
                              options: [
                                  { value: 'discordWebhook', label: t('Discord webhook') },
                                  { value: 'telegramBot', label: t('Telegram bot') },
                              ],
                              onChange: v => updateTarget('type', v),
                              placeholder: t('Select type…'),
                          }),
                          (selectedTarget.type === 'discordWebhook' || !selectedTarget.type)
                              ? React.createElement(
                                    React.Fragment,
                                    null,
                                    React.createElement('label', { style: labelStyle }, t('Discord webhook URL')),
                                    React.createElement('input', { style: inputStyle, type: 'password', value: selectedTarget.webhookUrl || '', onChange: e => updateTarget('webhookUrl', e.target.value), placeholder: 'https://discord.com/api/webhooks/...' })
                                )
                              : React.createElement(
                                    React.Fragment,
                                    null,
                                    React.createElement('label', { style: labelStyle }, t('Telegram bot token')),
                                    React.createElement('input', { style: inputStyle, type: 'password', value: selectedTarget.botToken || '', onChange: e => updateTarget('botToken', e.target.value), placeholder: '123456:ABC-DEF...' }),
                                    React.createElement('label', { style: labelStyle }, t('Telegram chat id')),
                                    React.createElement('input', { style: inputStyle, type: 'text', value: selectedTarget.chatId || '', onChange: e => updateTarget('chatId', e.target.value), placeholder: '-100123456789' })
                                )
                      )
                    : React.createElement('div', { style: { opacity: 0.9, color: colors.textMuted } }, t('Select a target or add a new one.'))
            )
        ),
        renderStatePicker()
    );
}
