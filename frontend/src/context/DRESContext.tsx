import { FC, useState, createContext, useEffect, useRef } from 'react'
import { notifications } from '@mantine/notifications';

import DRES_API from '../dresApi'

import { IDRES } from '../interfaces/IDRES'


const DRESContext = createContext<IDRES>({
    isLoggedIn: false,
    submit: (videoId, timestampInSec) => console.log("init"),
})

export default DRESContext

interface IDresInfo {
    sessionId: string
    evaluationId: string
}


type DRESProviderProps = {
    children: React.ReactNode
}

export const DRESProvider:FC<DRESProviderProps> = ({ children }) => {

    const [isLoggedIn, setIsLoggerIn] = useState(false)

    const dresInfo = useRef<IDresInfo | null>(null)

    const _handleLogIn = async () => {
        const loginRes = await DRES_API.login()
        
        if (!loginRes) {
            setIsLoggerIn(false)
            return
        }
        
        const evaluationRes = await DRES_API.evaluationInfoList(loginRes.sessionId)
        
        if (!evaluationRes) {
            setIsLoggerIn(false)
            return
        }

        dresInfo.current = {
            sessionId: loginRes.sessionId,
            evaluationId: evaluationRes.id
        }
        setIsLoggerIn(true)
    }

    const _handleSubmit = async (videoId: string, timestampInSec: number) => {
        if (!dresInfo) return

        notifications.show({
            title: 'Submission Sent',
            message: `VideoId: ${videoId} @ ${timestampInSec.toFixed(2)}sec`,
            
        })

        const result = await DRES_API.submit(dresInfo.current?.sessionId ?? "", dresInfo.current?.evaluationId ?? "", videoId, timestampInSec)
        
        notifications.show({
            title: "Result",
            message: result?.description,
            color: result?.submission === "CORRECT" ? "green" : "red"
        })
    }

    useEffect(() => {
        _handleLogIn()
    }, [])

    
    return(
        <DRESContext.Provider value={{
            isLoggedIn,
            submit: _handleSubmit
        }}>
            {children}
        </DRESContext.Provider>
    )
}
