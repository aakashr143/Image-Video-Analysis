import { FC } from "react";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import Main from "./main/Main";

import { DRESProvider } from "./context/DRESContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ResultsProvider } from "./context/ResultsContext";

const App: FC = () => {
    return (
        <MantineProvider>
            <Notifications position="top-right"/>
            <SettingsProvider>
                <DRESProvider>
                    <ResultsProvider>
                        <Main />
                    </ResultsProvider>
                </DRESProvider>
            </SettingsProvider>
        </MantineProvider>
    )
}

export default App;
