import { FC, useState, createContext } from 'react'
import { ISettings, ISettingsContext } from '../interfaces/ISettings'

const SettingsContext = createContext<ISettingsContext>({
    settings: {
        maxResults: 10,
        colorRadius: 5,
        maxTextSimilarity: 0.9,
        maxImageSimilarity: 0.9,
        objectsContain: 'any'
    },
    update: (settings: ISettings) => console.log('init settings context')
})

export default SettingsContext

type SettingsProviderProps = {
    children: React.ReactNode
}

export const SettingsProvider: FC<SettingsProviderProps> = ({ children }) => {
    
    const [settings, setSettings] = useState<ISettings>({
        maxResults: 100,
        colorRadius: 5,
        maxTextSimilarity: 0.9,
        maxImageSimilarity: 0.9,
        objectsContain: 'any'
    })

    return(
        <SettingsContext.Provider value={{
            settings,
            update: setSettings
        }}>
            {children}
        </SettingsContext.Provider>
    )

}

