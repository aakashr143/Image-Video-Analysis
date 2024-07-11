import { FC, useState, useContext, useEffect, useRef } from "react";
import { Tooltip, NumberInput, Collapse, Button, Modal } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { RxChevronRight } from "react-icons/rx";

import ResultsContext from "../../context/ResultsContext";
import DRESContext from "../../context/DRESContext";

import { BASE_BACKEND_URL } from "../../constants";

import { IFrame, IVideo } from "../../interfaces/IResults";
import styles from './display.module.css';



const Display:FC = () => {

    const resultsContext = useContext(ResultsContext)
    const [orderBy, setOrderBy] = useState<string>('videos')

    return(
        <div className={styles.container}>
            <div>
                <Button onClick={() => {
                    setOrderBy((orderBy === 'videos') ? 'frames' : 'videos')
                }}>
                    {orderBy.toUpperCase()}
                </Button>
            </div>
            {
                orderBy === 'videos'
                    ?
                <>
                    {
                        resultsContext.videos.map((video) => <VideoItem item={video} key={video.videoId}/>)
                    }
                </>
                    :
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap'
                }}>
                    {
                        resultsContext.frames.map((frame) => <FrameItem item={frame} key={frame.video_id + frame.frame_id}/>)
                    }
                </div>
            }
        </div>
    )
}

export default Display


type VideoItemProps = {
    item: IVideo
}

const VideoItem:FC<VideoItemProps> = ({ item }) => {

    const [opened, { toggle }] = useDisclosure(true);
    const [exploreModel, setExploreModel] = useDisclosure(false);
    
    return(
        <>
            <Modal opened={exploreModel} onClose={setExploreModel.close}  withCloseButton={false} size='90%'>
                <ExploreModel videoId={item.videoId}/>
            </Modal>
            <div className={styles.videoItem}>
                <div onClick={toggle} style={{ cursor: 'pointer' }}>
                    <RxChevronRight size={25} style={{
                        rotate: opened ? '90deg' : '0deg'
                    }}/>
                    <h2>Video: {item.videoId}</h2>
                </div>
                <Collapse in={opened}>
                    <div>
                        <div className={styles.framesContainer} style={{
                            marginBlock: 10
                        }}>
                            <Button onClick={setExploreModel.open}>Explore</Button>
                        </div>
                        <div className={styles.framesContainer}>
                            {
                                item.frames.map((frame) => <FrameItem item={frame} key={frame.frame_id}/>)
                            }
                        </div>
                    </div>
                </Collapse>
            </div>
        </>
    )
}

type FrameItemProps = {
    item: IFrame
}

const FrameItem:FC<FrameItemProps> = ({ item }) => {

    const dresContext = useContext(DRESContext)
    
    const [openedVideoModal, toggleVideoModal] = useDisclosure(false);
    const [openedSubmitModal, toggleSubmitModal] = useDisclosure(false);

    const [timestamp, setTimestamp] = useState(item.timestamp)
    const isFirstPlay = useRef(true)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    return(
        <>
            <Modal 
                size={'lg'} 
                opened={openedVideoModal} 
                onClose={() => {
                    isFirstPlay.current = true
                    toggleVideoModal.close()
                }} 
                withCloseButton={false}>
                <video 
                    id={`${item.video_id}-${item.frame_id}-video`} 
                    controls
                    autoPlay
                    onPlay={(e) => {
                        if (isFirstPlay.current) {
                            e.currentTarget.currentTime = item.timestamp-0.5
                            isFirstPlay.current = false
                        }
                    }}
                    style={{
                        width: '100%',
                        marginBlock: 20,
                    }}
                >
                    <source src={`${BASE_BACKEND_URL}/video/${item.video_id}`} type="video/mp4"></source>
                </video>
            </Modal>

            <Modal 
                size={'lg'} 
                opened={openedSubmitModal} 
                onClose={() => {
                    setTimestamp(item.timestamp)
                    toggleSubmitModal.close()
                }} 
                withCloseButton={false}
            >
                <video
                    ref={videoRef} 
                    id={`${item.video_id}-${item.frame_id}-video`} 
                    controls
                    autoPlay
                    onPlay={(e) => {
                        if (isFirstPlay.current) {
                            e.currentTarget.currentTime = item.timestamp-0.5
                            isFirstPlay.current = false
                        }
                    }}
                    style={{
                        width: '100%',
                        marginBlock: 20,
                    }}
                >
                    <source src={`${BASE_BACKEND_URL}/video/${item.video_id}`} type="video/mp4"></source>
                </video>
                <Button onClick={() => setTimestamp(videoRef.current?.currentTime ?? timestamp)}>
                    Update Timestamp
                </Button>
                <p>Video Id: {item.video_id}</p>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBlock: 10
                }}>
                    <p>Timestamp ({Math.trunc(timestamp / 60)}min {(timestamp % 60).toPrecision(2)}sec)</p>
                    <NumberInput
                        value={timestamp}
                        min={0}
                        onChange={(val) => {
                            videoRef.current?.fastSeek(parseFloat(val.toString()))
                            setTimestamp(parseFloat(val.toString()))
                        }}

                    />
                </div>
                <Button onClick={() => dresContext.submit(item.video_id, timestamp)}>
                    Submit
                </Button>
            </Modal>

            <div className={styles.frame}>
                <div className={styles.frameImg}>
                    <img 
                        src={`${BASE_BACKEND_URL}/video/${item.video_id}/frame/${item.frame_id.split('_')[1]}`}
                        alt="Frame"
                        style={{
                            width: 300,
                            height: 200,
                            objectFit: 'fill',
                            backgroundColor: 'black'
                        }}
                    />
                </div>
                <div style={{ padding: 5 }}>
                    <p>Score: {item.score.toFixed(3)}</p>
                    <p>Timestamp: {item.timestamp.toFixed(3)} sec</p>
                    <p style={{ textWrap: 'wrap' }}>Objects: {item.objects.join(', ')}</p>
                    <p style={{ textWrap: 'wrap' }}>Text: {item.text.join(', ')}</p>
                    <div className={styles.colors}>
                        {
                            item.dominant_colors.map((color, idx) => {
                                return(
                                    <Tooltip label={`rgb(${color[0]}, ${color[1]}, ${color[2]})`} key={idx}>
                                        <div style={{
                                            backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                                            width: 17.5,
                                            height: 17.5,
                                            borderRadius: 17.5,
                                            border: '1px gray solid'
                                        }}/>
                                    </Tooltip>
                                )
                            })
                        }
                    </div>
                    <div>
                        <Button onClick={toggleVideoModal.open}>
                            Play
                        </Button>
                        
                        <Button onClick={() => {
                            setTimestamp(item.timestamp)
                            toggleSubmitModal.open()
                        }}>
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}


type ExploreModelProps = {
    videoId: string
}

const ExploreModel:FC<ExploreModelProps> = ({ videoId }) => {

    const [items, setItems] = useState<IFrame[]>([])

    useEffect(() => {
        (async () => {
            try {

                const res = await fetch(`${BASE_BACKEND_URL}/explore/${videoId}`)
                const data = await res.json()

                setItems(data.data)

            } catch (err) {
                console.log(err)
            }
        })()
    }, [])

    return(
        <div>
            <h3>Video: {videoId}</h3>
            <div className={styles.framesContainer}>
                {
                    items.map((frame) => <FrameItem item={frame} key={frame.frame_id}/>)
                }
            </div>
        </div>
    )
}