export interface ISettings {
    maxResults: number
    colorRadius: number
    maxTextSimilarity: number
    maxImageSimilarity: number
    objectsContain: string
}

export interface ISettingsContext {
    settings: ISettings
    update(settings: ISettings): void
}