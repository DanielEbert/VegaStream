import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import embed from 'vega-embed';
import { socket } from './socket';
import RangeSlider from './RangeSlider';
import { FiChevronsRight, FiPause } from 'react-icons/fi';
import { FiChevronRight } from 'react-icons/fi';
import { FiChevronsLeft } from 'react-icons/fi';
import { FiChevronLeft } from 'react-icons/fi';
import { FiPlay } from 'react-icons/fi';
import { FiPauseCircle } from 'react-icons/fi';
import { IconButton } from './ui/IconButton';
import { convertMilliseconds, convertToMilliseconds } from './util';
import { Tooltip } from './ui/Tooltip';

let counter = 0;

function VegaPlot({ connected }) {
  console.log('onrender');

  const ref = useRef();
  const [specAndData, setSpecAndData] = useState(null);
  const viewRef = useRef();
  const [paused, setPaused] = useState(false);

  const updateData = useCallback(async (newData) => {
    const view = viewRef.current;
    if (view == null || paused == true) return;

    counter++;

    // TODO: signal info must also be passed via update
    view.signal('filterStart', counter - 5);
    await view.insert('source', newData).run();
  }, []);

  useEffect(() => {
    if (specAndData == null) return;

    embed(ref.current, specAndData.spec, { actions: false }).then(
      ({ view }) => {
        viewRef.current = view;
        counter = 0;
        view.insert('source', specAndData.data).run();
      }
    );

    return () => {
      if (viewRef.current) {
        viewRef.current.finalize();
      }
    };
  }, [specAndData]);

  useEffect(() => {
    if (!connected) return;

    function onNewData(data) {
      updateData(JSON.parse(data));
    }

    socket.emit(
      'register_for_plot',
      ('features', { config: 0 }),
      (response_str) => {
        const response = JSON.parse(response_str);
        setSpecAndData({ spec: response.spec, data: response.initial_data });
      }
    );

    socket.on('newData', onNewData);

    return () => {
      if (!connected) return;
      socket.off('newData', onNewData);
    };
  }, [connected]);

  return (
    <div>
      <button onClick={() => setPaused((prev) => !prev)}>Pause</button>
      <div ref={ref} />
    </div>
  );
}

function TimestampControl({
  minTimestamp,
  maxTimestamp,
  selectedTimestamp,
  setSelectedTimestamp,
}) {
  console.log('render Timestamp Control');

  const [textInputTimestamp, setTextInputTimestamp] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const changeTimestamp = (offset) => {
    setSelectedTimestamp((prev) =>
      prev.map((t) =>
        Math.min(Math.max(t + offset, minTimestamp), maxTimestamp)
      )
    );
  };

  const handleFinalizeTimestampTextInput = (time_str) => {
    if (!/^[\d:]+$/.test(time_str)) {
      console.error(
        'Timestamp Text Input has invalid format. Format must be MM:SS:MS or MS.'
      );
      return;
    }

    let timestampSeconds = convertToMilliseconds(time_str);

    const endTimestamp = Math.min(
      Math.max(timestampSeconds, minTimestamp),
      maxTimestamp
    );

    const startEndTimestampDiff = selectedTimestamp[1] - selectedTimestamp[0];

    const startTimestamp = Math.min(
      Math.max(endTimestamp - startEndTimestampDiff, minTimestamp),
      maxTimestamp
    );

    setSelectedTimestamp([startTimestamp, endTimestamp]);
  };

  useEffect(() => {
    setTextInputTimestamp(convertMilliseconds(selectedTimestamp[1]));
  }, [selectedTimestamp]);

  // TODO: stop playing on reaching max
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      changeTimestamp(100);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="m-10">
      <div className="pb-2">
        <RangeSlider
          min={minTimestamp}
          max={maxTimestamp}
          step={10}
          value={selectedTimestamp}
          onInput={(value, userInteraction) => {
            setSelectedTimestamp(value);
          }}
        />
      </div>
      <div className="flex">
        <IconButton
          Icon={FiChevronsLeft}
          size={24}
          label={'-1 Sec'}
          onClick={() => changeTimestamp(-1000)}
        />
        <IconButton
          Icon={FiChevronLeft}
          size={24}
          label={'-100 Ms'}
          onClick={() => changeTimestamp(-100)}
        />
        <IconButton
          Icon={isPlaying ? FiPause : FiPlay}
          size={24}
          label={isPlaying ? 'Pause' : 'Play'}
          onClick={() => {
            setIsPlaying((prev) => !prev);
          }}
        />
        <IconButton
          Icon={FiChevronRight}
          size={24}
          label={'+100 Ms'}
          onClick={() => changeTimestamp(100)}
        />
        <IconButton
          Icon={FiChevronsRight}
          size={24}
          label={'+1 Sec'}
          onClick={() => changeTimestamp(1000)}
        />
        <div className="ml-5" />
        <Tooltip tooltip={selectedTimestamp[0] + ' ms'}>
          <span className="select-none">
            {convertMilliseconds(selectedTimestamp[0])}
          </span>
        </Tooltip>
        <span>&nbsp; {'-'} &nbsp;</span>
        <Tooltip tooltip={convertToMilliseconds(textInputTimestamp) + ' ms'}>
          <input
            min={minTimestamp}
            max={maxTimestamp}
            value={textInputTimestamp}
            onChange={(e) => {
              setTextInputTimestamp(e.target.value);
            }}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              handleFinalizeTimestampTextInput(e.target.value)
            }
            onBlur={(e) => handleFinalizeTimestampTextInput(e.target.value)}
            size={9}
            className="bg-gray-50 px-1 border border-gray-300 rounded-lg outline-none  focus:border-blue-500"
          />
        </Tooltip>
        <span>&nbsp; {'/'} &nbsp;</span>
        <Tooltip tooltip={maxTimestamp + ' ms'}>
          <span className="select-none">
            {convertMilliseconds(maxTimestamp)}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

function Main({ connected }) {
  console.log('render Main');

  const [minTimestamp] = useState(0);
  const [maxTimestamp] = useState(100000);
  const [selectedTimestamp, setSelectedTimestamp] = useState([10000, 45000]);

  return (
    <div className="min-h-screen w-full min-w-full prose flex flex-col">
      <VegaPlot connected={connected} />
      <TimestampControl
        minTimestamp={minTimestamp}
        maxTimestamp={maxTimestamp}
        selectedTimestamp={selectedTimestamp}
        setSelectedTimestamp={setSelectedTimestamp}
      />
    </div>
  );
}

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main connected={isConnected} />} />
      </Routes>
    </Router>
  );
}
