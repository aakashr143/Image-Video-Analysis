import { FC, useState, createContext } from 'react'
import { IVideo, IResultContext, IFrame } from '../interfaces/IResults'

const ResultsContext = createContext<IResultContext>({
    videos: [],
    frames: [],
    updateVideos: (video: IVideo[]) => console.log('results context init'),
    updateFrames: (frames: IFrame[]) => console.log('results context init'),
})

export default ResultsContext


type ResultsProviderProps = {
    children: React.ReactNode
}

export const ResultsProvider:FC<ResultsProviderProps> = ({ children }) => {

    const [videos, setVideos] = useState<IVideo[]>([])
    const [frames, setFrames] = useState<IFrame[]>([])

    return(
        <ResultsContext.Provider value={{
            videos,
            frames,
            updateVideos: setVideos,
            updateFrames: setFrames
        }}>
            {children}
        </ResultsContext.Provider>
    )
}