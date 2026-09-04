// Dev-only harness to preview both custom components outside of ioBroker Admin.
// Not part of the production build (vite.config.ts only exposes ./Components).
import React, { useState } from 'react';
import FrigateServiceGlobalEditor from './GlobalEditor';
import FrigateServiceItemsEditor from './ItemsEditor';

const initialData = {
    cameras: [{ id: 'einfahrt', name: 'Einfahrt', zones: ['frigate.0.Zone_Einfahrt.person'] }],
    notifyTargets: [{ id: 'discord_haus', type: 'discordWebhook', webhookUrl: '' }],
    items: [],
};

export default function App(): React.JSX.Element {
    const [data, setData] = useState<Record<string, any>>(initialData);

    const commonProps = {
        data,
        onChange: (nextData: Record<string, any>) => setData(nextData),
        t: (text: string) => text,
        themeType: 'light',
        socket: undefined,
        theme: undefined,
    };

    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
            <h2>Global editor</h2>
            <FrigateServiceGlobalEditor {...commonProps} />
            <h2 style={{ marginTop: 40 }}>Items editor</h2>
            <FrigateServiceItemsEditor {...commonProps} attr="items" />
        </div>
    );
}
