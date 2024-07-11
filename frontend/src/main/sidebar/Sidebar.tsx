import { FC, useState, useContext } from "react";
import { Textarea, ColorInput, Switch, FileButton, Button, Divider, Group, ActionIcon, useCombobox, Pill, Combobox, PillsInput } from '@mantine/core';

import SettingsContext from "../../context/SettingsContext";
import ResultsContext from "../../context/ResultsContext";

import useError from "../../hooks/useError";

import { FaRegImage } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";

import { BASE_BACKEND_URL } from "../../constants";
import { IFrame, IVideo } from "../../interfaces/IResults";
import styles from './sidebar.module.css';


const YOLO_CLASSES = ['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush']

const SideBar: FC = () => {

    const settingsContext = useContext(SettingsContext)
    const resultsContext = useContext(ResultsContext)

    const [isGettingData, setIsGettingData] = useState(false)

    const [querySelector, setQuerySelector] = useState({
        textQuery: true,
        colorQuery: false,
        imageQuery: false,
        objectQuery: false,
        wordQuery: false
    })
    const [textQuery, setTextQuery] = useState('')
    const [colorQuery, setColorcolorQuery] = useState('rgb(47, 119, 150)');
    const [imageQuery, setImageQuery] = useState<File | null>(null)
    const [objectQuery, setObjectQuery] = useState<string[]>([]);
    const [objectQuerySearch, setObjectQuerySearch] = useState('');
    const [wordQuery, setWordQuery] = useState('')

    const textError = useError()


    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
        onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
    });

    const _handleValueSelect = (val: string) => setObjectQuery((current) => current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
    const _handleValueRemove = (val: string) => setObjectQuery((current) => current.filter((v) => v !== val));

    const values = objectQuery.map((item) => (
        <Pill key={item} disabled={!querySelector.objectQuery} withRemoveButton onRemove={() => _handleValueRemove(item)}>
            {item}
        </Pill>
    ));

    const options = YOLO_CLASSES.filter((item) => item.toLowerCase().includes(objectQuerySearch.trim().toLowerCase()) && !objectQuery.includes(item)).map((item) => (
        <Combobox.Option value={item} key={item} active={objectQuery.includes(item)}>
            {item}
        </Combobox.Option>
    ));


    const _handleOnReset = () => {
        setQuerySelector({
            textQuery: true,
            colorQuery: false,
            imageQuery: false,
            objectQuery: false,
            wordQuery: false
        })
        setTextQuery('')
        setImageQuery(null)
        setObjectQuery([])
        setObjectQuerySearch('')
        resultsContext.updateVideos([])
        resultsContext.updateFrames([])
    }


    const _handleSearchDB = async () => {

        const checkTextQuery = () => {
            if (!querySelector.textQuery) {
                return true
            }

            if (textQuery.trim().length !== 0) {
                return true
            }

            textError.setError("Can't be empty")
            return false
        }

        if (!querySelector.textQuery && !querySelector.colorQuery && !querySelector.objectQuery && !querySelector.imageQuery && !querySelector.wordQuery) {
            return
        }        

        const isTextQueryOk = checkTextQuery()

        if (!isTextQueryOk) {
            return
        }


        if (isGettingData) return
        setIsGettingData(true)

        resultsContext.updateVideos([])
        resultsContext.updateFrames([])

        const searchParams = { ...settingsContext.settings }
        const query = {
            textQuery: querySelector.textQuery ? textQuery : null,
            colorQuery: querySelector.colorQuery ? colorQuery.replace('rgb(', '').replace(')', '').split(', ').map(v => parseInt(v)) : null,
            objectQuery: querySelector.objectQuery ? objectQuery : null,
            imageQuery: querySelector.imageQuery ? (await toBase64(imageQuery)) : null,
            wordQuery: querySelector.wordQuery ? wordQuery.toLocaleLowerCase().trim().split(' ') : null
        }

        try {
            const res = await fetch(`${BASE_BACKEND_URL}/search`, {
                method: 'POST',
                body: JSON.stringify({
                    query,
                    searchParams
                })
            })

            const data = await res.json()
            resultsContext.updateVideos(combineFramesToVideos(data.data))
            resultsContext.updateFrames(data.data)

            setIsGettingData(false)
        } catch (err) {
            console.log(err)
            setIsGettingData(false)
        }
    }


    return (
        <div className={styles.container}>
            <div className={styles.queryContainer}>
                {/* Text Query */}
                <div className={styles.item}>
                    <div className={styles.itemControl}>
                        <p>Text Query</p>
                        <Switch
                            checked={querySelector.textQuery}
                            onChange={event => {
                                const x = { ...querySelector }
                                x.textQuery = event.currentTarget.checked
                                setQuerySelector(x)
                            }}
                        />
                    </div>
                    <Textarea
                        value={textQuery}
                        onChange={(event) => setTextQuery(event.currentTarget.value)}
                        placeholder="Text Query"
                        autosize
                        error={textError.error}
                        minRows={4}
                        disabled={!querySelector.textQuery}
                        style={{
                            width: '100%'
                        }}
                    />
                </div>

                {/* Color Query */}
                <Divider size="xs" />
                <div className={styles.item}>
                    <div className={styles.itemControl}>
                        <p>Color Query</p>
                        <Switch
                            checked={querySelector.colorQuery}
                            onChange={event => {
                                const x = { ...querySelector }
                                x.colorQuery = event.currentTarget.checked
                                setQuerySelector(x)
                            }}
                        />
                    </div>
                    <ColorInput
                        format="rgb"
                        value={colorQuery}
                        onChange={setColorcolorQuery}
                        disabled={!querySelector.colorQuery}
                    />
                </div>

                {/* Image Query */}
                <Divider size="xs" />
                <div className={styles.item}>
                    <div className={styles.itemControl}>
                        <p>Image Query</p>
                        <Switch
                            checked={querySelector.imageQuery}
                            onChange={event => {
                                const x = { ...querySelector }
                                x.imageQuery = event.currentTarget.checked
                                setQuerySelector(x)
                            }}
                        />
                    </div>
                    {
                        imageQuery
                        &&
                        <img
                            src={URL.createObjectURL(imageQuery)}
                            alt="Selected"
                            width={'100%'}
                            height={250}
                            style={{
                                objectFit: 'contain',
                                opacity: !querySelector.imageQuery ? 0.5 : 1
                            }}
                        />
                    }
                    <Group justify="center">
                        <FileButton
                            onChange={setImageQuery}
                            accept="image/png,image/jpeg"
                        >
                            {(props) => <Button
                                {...props}
                                disabled={!querySelector.imageQuery}
                                fullWidth
                                leftSection={<FaRegImage size={20} />}
                            >
                                Upload image
                            </Button>
                            }
                        </FileButton>
                    </Group>
                </div>

                {/* Object Query */}
                <Divider size="xs" />
                <div className={styles.item}>
                    <div className={styles.itemControl}>
                        <p>Object Query</p>
                        <Switch
                            checked={querySelector.objectQuery}
                            onChange={event => {
                                const x = { ...querySelector }
                                x.objectQuery = event.currentTarget.checked
                                setQuerySelector(x)
                            }}
                        />
                    </div>
                    <Combobox
                        store={combobox}
                        onOptionSubmit={_handleValueSelect}
                        disabled={!querySelector.objectQuery}
                    >
                        <Combobox.DropdownTarget>
                            <PillsInput pointer onClick={() => combobox.toggleDropdown()} disabled={!querySelector.objectQuery}>
                                <Pill.Group>
                                    {values}
                                    <Combobox.EventsTarget>
                                        <PillsInput.Field
                                            value={objectQuerySearch}
                                            onChange={(event) => {
                                                combobox.updateSelectedOptionIndex();
                                                setObjectQuerySearch(event.currentTarget.value);
                                            }}
                                            placeholder="Search objects"
                                            onFocus={() => combobox.openDropdown()}
                                            onBlur={() => combobox.closeDropdown()}
                                            disabled={!querySelector.objectQuery}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Backspace' && objectQuerySearch.length === 0) {
                                                    event.preventDefault();
                                                    _handleValueRemove(objectQuery[objectQuery.length - 1]);
                                                }
                                            }}
                                        />
                                    </Combobox.EventsTarget>
                                </Pill.Group>
                            </PillsInput>
                        </Combobox.DropdownTarget>
                        <Combobox.Dropdown>
                            <Combobox.Options mah={200} style={{ overflowY: 'auto' }}>
                                {options.length > 0 ? options : <Combobox.Empty>Nothing found...</Combobox.Empty>}
                            </Combobox.Options>
                        </Combobox.Dropdown>
                    </Combobox>
                </div>

                {/* Word Query */}
                <Divider size="xs" />
                <div className={styles.item}>
                    <div className={styles.itemControl}>
                        <p>Word Query</p>
                        <Switch
                            checked={querySelector.wordQuery}
                            onChange={event => {
                                const x = { ...querySelector }
                                x.wordQuery = event.currentTarget.checked
                                setQuerySelector(x)
                            }}
                        />
                    </div>
                    <Textarea
                        value={wordQuery}
                        onChange={(event) => setWordQuery(event.currentTarget.value)}
                        placeholder="Word Query"
                        autosize
                        minRows={4}
                        disabled={!querySelector.wordQuery}
                        style={{
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            <div className={styles.bottomContainer}>
                <ActionIcon variant="outline" size='lg' onClick={_handleOnReset}>
                    <GrPowerReset size={20} />
                </ActionIcon>
                <Button
                    size="sm"
                    fullWidth
                    onClick={_handleSearchDB}
                    loading={isGettingData}
                >
                    Search
                </Button>
            </div>
        </div>
    )
}

export default SideBar


const combineFramesToVideos = (frames: IFrame[]) => {
    const videos: IVideo[] = []

    frames.forEach((frame) => {
        const vid = videos.filter(v => v.videoId === frame.video_id)

        if (vid.length === 0) {
            // Add
            videos.push({
                videoId: frame.video_id,
                frames: [frame]
            })
        } else {
            // Append
            vid[0].frames.push(frame)
        }
    })

    return videos
}

const toBase64 = (file: File | null):Promise<string | ArrayBuffer | null> => new Promise((resolve, reject) => {
    if (!file) {
        return resolve(null)
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});