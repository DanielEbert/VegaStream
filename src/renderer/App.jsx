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
import { FiPauseCircle } from "react-icons/fi";
import { IconButton } from './ui/IconButton';
import { convertMilliseconds } from './util';

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

function Main({ connected }) {
  console.log('render Main');

  const [minTimestamp] = useState(0);
  const [maxTimestamp] = useState(100000);
  const [selectedTimestamp, setSelectedTimestamp] = useState([10000, 45000]);
  const [isPlaying, setIsPlaying] = useState(false);

  const changeTimestamp = (offset) => {
    setSelectedTimestamp((prev) =>
      prev.map((t) =>
        Math.min(Math.max(t + offset, minTimestamp), maxTimestamp)
      )
    );
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      changeTimestamp(100);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // TODO: put all timestamp control in separate function
  return (
    <div className="min-h-screen w-full min-w-full prose flex flex-col">
      <VegaPlot connected={connected} />
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
          <span className="ml-5 align-baseline">
            {/* textbox for selected timestamp */}
            {convertMilliseconds(selectedTimestamp[0]) +
              ' - ' +
              convertMilliseconds(selectedTimestamp[1]) +
              ' / ' +
              convertMilliseconds(maxTimestamp)}
          </span>
        </div>
      </div>
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
