export interface IFrame {
    video_id: string
    frame_id: string
    score: number
    timestamp: number
    objects: string[]
    dominant_colors: string[][]
    text: string[]
}

export interface IVideo {
    videoId: string
    frames: IFrame[]
}

export interface IResultContext {
    videos: IVideo[]
    frames: IFrame[]
    updateVideos(videos: IVideo[]): void
    updateFrames(frames: IFrame[]): void
}

