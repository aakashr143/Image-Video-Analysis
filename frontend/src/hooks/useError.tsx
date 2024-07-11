import { useEffect, useState } from 'react'


const useError = () => {

    const [error, setError] = useState<boolean | string>(false)

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(false)
                clearTimeout(timer)
            }, 7500)
        }
    }, [error])

    return {
        error,
        setError
    }

}

export default useError