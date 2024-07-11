import { FC, useContext } from "react";
import { Tooltip, Modal, NumberInput, Select, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { LuSettings } from "react-icons/lu";

import DRESContext from "../../context/DRESContext";
import SettingsContext from "../../context/SettingsContext";

import styles from './header.module.css';


const Header: FC = () => {

    const dresContext = useContext(DRESContext)

    const [settingsModel, setSettingsModel] = useDisclosure(false);

    return (
        <>
            <Modal opened={settingsModel} onClose={setSettingsModel.close} withCloseButton={false}>
                <SettingsModel />
            </Modal>

            <div className={styles.container}>
                <h3>Image & Video Analysis</h3>
                <div className={styles.items}>
                    <div className={styles.item} onClick={() => setSettingsModel.open()}>
                        <LuSettings size={22.5} style={{ marginTop: 5 }} />
                    </div>
                    <div className={styles.item}>
                        <Tooltip label={dresContext.isLoggedIn ? 'DRES Online' : 'DRES Offline'}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 5
                            }}>
                                <p><b>DRES</b></p>
                                <div style={{
                                    backgroundColor: dresContext.isLoggedIn ? 'darkgreen' : 'red',
                                    width: 10,
                                    height: 10,
                                    borderRadius: 10
                                }} />
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Header



const SettingsModel: FC = () => {

    const settingsContext = useContext(SettingsContext)

    return (
        <div>
            <h3>Search Settings</h3>
            <Divider size='xs' p='md' />
            <div className={styles.settingsModelItems}>
                <div>
                    <h4>General</h4>
                    <div className={styles.settingsModelItem}>
                        <p>Max Results</p>
                        <NumberInput
                            value={settingsContext.settings.maxResults}
                            min={1}
                            onChange={(val) => {
                                const s = { ...settingsContext.settings }
                                s.maxResults = parseInt(val.toString())
                                settingsContext.update(s)
                            }}
                        />
                    </div>
                </div>
                <div>
                    <h4>Text Query</h4>
                    <div className={styles.settingsModelItem}>
                        <p>Max Text Similairty</p>
                        <NumberInput
                            value={settingsContext.settings.maxTextSimilarity}
                            min={0}
                            step={0.1}
                            onChange={(val) => {
                                const s = { ...settingsContext.settings }
                                s.maxTextSimilarity = parseFloat(val.toString())
                                settingsContext.update(s)
                            }}
                        />
                    </div>
                </div>
                <div>
                    <h4>Color Query</h4>
                    <div className={styles.settingsModelItem}>
                        <p>Color Radius</p>
                        <NumberInput
                            value={settingsContext.settings.colorRadius}
                            min={0}
                            onChange={(val) => {
                                const s = { ...settingsContext.settings }
                                s.colorRadius = parseInt(val.toString())
                                settingsContext.update(s)
                            }}
                        />
                    </div>
                </div>
                <div>
                    <h4>Image Query</h4>
                    <div className={styles.settingsModelItem}>
                        <p>Max Image Similairty</p>
                        <NumberInput
                            value={settingsContext.settings.maxImageSimilarity}
                            min={0}
                            step={0.1}
                            onChange={(val) => {
                                const s = { ...settingsContext.settings }
                                s.maxImageSimilarity = parseFloat(val.toString())
                                settingsContext.update(s)
                            }}
                        />
                    </div>
                </div>
                <div>
                    <h4>Objects Query</h4>
                    <div className={styles.settingsModelItem}>
                        <p>Contains</p>
                        <Select
                            data={['any', 'all', 'only']}
                            value={settingsContext.settings.objectsContain}
                            onChange={(val) => {
                                if (val) {
                                    const s = { ...settingsContext.settings }
                                    s.objectsContain = val
                                    settingsContext.update(s)
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}