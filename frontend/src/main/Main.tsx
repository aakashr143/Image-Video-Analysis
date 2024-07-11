import { FC } from "react";
import { AppShell } from '@mantine/core';

import Header from "./header/Header";
import SideBar from "./sidebar/Sidebar";
import Display from "./display/Display";


const Main: FC = () => {
    return (
        <AppShell
            header={{ height: 50 }}
            navbar={{ width: 300, breakpoint: 0 }}
            
        >
            <AppShell.Header>
                <Header />
            </AppShell.Header>
            <AppShell.Navbar>
                <SideBar />
            </AppShell.Navbar>
            <AppShell.Main>
                <Display />
            </AppShell.Main>
        </AppShell>
    )
}

export default Main