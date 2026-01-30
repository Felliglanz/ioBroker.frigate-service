'use strict';

function createFrigateAdapterEventSource(adapter, config, engine) {
  const prefix = String(config.frigateInstance || 'frigate.0').trim();
  const eventsPrefix = `${prefix}.events`;
  const afterPrefix = `${prefix}.events.after`;
  const ids = {
    type: `${eventsPrefix}.type`,
    afterId: `${afterPrefix}.id`,
    afterCamera: `${afterPrefix}.camera`,
    afterLabel: `${afterPrefix}.label`,
    afterHasSnapshot: `${afterPrefix}.has_snapshot`,
    afterTopScore: `${afterPrefix}.top_score`,
    afterSubLabel: `${afterPrefix}.sub_label`,
    afterEnteredZones: `${afterPrefix}.entered_zones`,
  };

  let scheduled = null;
  let stateChangeHandler = null;

  const readEvent = async () => {
    try {
      const [eventIdSt, typeSt, camSt, labelSt, snapSt, scoreSt, subLabelSt, enteredZonesSt] = await Promise.all([
        adapter.getForeignStateAsync(ids.afterId),
        adapter.getForeignStateAsync(ids.type),
        adapter.getForeignStateAsync(ids.afterCamera),
        adapter.getForeignStateAsync(ids.afterLabel),
        adapter.getForeignStateAsync(ids.afterHasSnapshot),
        adapter.getForeignStateAsync(ids.afterTopScore),
        adapter.getForeignStateAsync(ids.afterSubLabel).catch(() => null),
        adapter.getForeignStateAsync(ids.afterEnteredZones).catch(() => null),
      ]);

      const eventId = eventIdSt && eventIdSt.val !== undefined ? String(eventIdSt.val) : '';
      if (!eventId) return;

      const type = typeSt && typeSt.val !== undefined ? String(typeSt.val) : '';
      const camera = camSt && camSt.val !== undefined ? String(camSt.val) : '';
      const label = labelSt && labelSt.val !== undefined ? String(labelSt.val) : '';
      const hasSnapshotRaw = snapSt ? snapSt.val : undefined;
      const hasSnapshot = hasSnapshotRaw === true || hasSnapshotRaw === 'true' || hasSnapshotRaw === 1;
      const score = scoreSt && scoreSt.val !== undefined ? Number(scoreSt.val) : NaN;

      const subLabel = subLabelSt && subLabelSt.val !== undefined && subLabelSt.val !== null ? String(subLabelSt.val) : '';
      let enteredZones = [];
      if (enteredZonesSt && enteredZonesSt.val !== undefined && enteredZonesSt.val !== null) {
        const raw = enteredZonesSt.val;
        if (Array.isArray(raw)) {
          enteredZones = raw.map(z => String(z)).filter(Boolean);
        } else if (typeof raw === 'string') {
          const s = raw.trim();
          if (s.startsWith('[')) {
            try {
              const parsed = JSON.parse(s);
              if (Array.isArray(parsed)) enteredZones = parsed.map(z => String(z)).filter(Boolean);
            } catch {
              // ignore
            }
          }
          if (!enteredZones.length) {
            enteredZones = s.split(',').map(z => z.trim()).filter(Boolean);
          }
        }
      }

      await engine.handleFrigateEvent({
        source: 'frigateAdapter',
        eventId,
        type: type || 'update',
        camera,
        label,
        subLabel,
        enteredZones,
        hasSnapshot,
        score,
        ts: Date.now(),
      });
    } catch (e) {
      adapter.log.debug(`Frigate event read failed: ${e && e.message ? e.message : e}`);
    }
  };

  const scheduleRead = () => {
    if (scheduled) return;
    scheduled = setTimeout(async () => {
      scheduled = null;
      await readEvent();
    }, 50);
  };

  return {
    async start() {
      adapter.subscribeForeignStates(ids.afterId);
      adapter.subscribeForeignStates(ids.type);

      stateChangeHandler = (id, state) => {
        if (!state) return;
        if (id === ids.afterId || id === ids.type) {
          scheduleRead();
        }
      };

      adapter.on('stateChange', stateChangeHandler);
    },
    async stop() {
      if (scheduled) {
        clearTimeout(scheduled);
        scheduled = null;
      }
      if (stateChangeHandler) {
        adapter.off('stateChange', stateChangeHandler);
        stateChangeHandler = null;
      }
      adapter.unsubscribeForeignStates(ids.afterId);
      adapter.unsubscribeForeignStates(ids.type);
    },
  };
}

module.exports = {
  createFrigateAdapterEventSource,
};
