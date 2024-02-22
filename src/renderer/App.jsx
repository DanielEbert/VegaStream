import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import embed, { vega } from 'vega-embed';
// import { socket } from './socket';
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
import { unpack } from 'msgpackr';

let counter = 0;
let start_time = 0;

function VegaPlot({ connected }) {
  console.log('onrender');

  const ref = useRef();
  const [specAndData, setSpecAndData] = useState(null);
  const viewRef = useRef();
  const [paused, setPaused] = useState(false);

  const updateData = useCallback(async (newData) => {
    const view = viewRef.current;
    if (view == null || paused == true) return;

    // console.log(newData);

    if (counter == 0) {
      start_time = Date.now();
    }
    counter++;
    if (counter % 10000 == 1) {
      console.log('recv ' + counter);
      console.log(Date.now() - start_time);
    }

    // TODO: signal info must also be passed via update
    // view.signal('filterStart', counter - 5);

    // TODO: for floats. but how slow is float calcs?
    //function createHashKey(float1, float2) {
    //  // Constants for hashing; adjust as needed for your precision requirements
    //  const scale1 = 1000000; // Scale factor for the first float
    //  const scale2 = 100; // Scale factor for adjusting the second float before adding to the hash

    //  // Creating a hash key
    //  // Note: This is a simple example and may need adjustments based on your precision and collision avoidance needs
    //  let key = Math.floor(float1 * scale1 + float2 * scale2);

    //  return key;
    //}

    // const createKey = (a, b) => {
    //   // TODO: real impl won't work like this, as its floats and can be negative. just use simple hash
    //   return (a << 16) + b;
    // };

    // const sourceDataset = view.data('source');
    // //console.log('len ' + sourceDataset.length);

    // let sourceDatasetLookup = {};
    // sourceDataset.forEach((e) => {
    //   sourceDatasetLookup[createKey(e.x, e.y)] = e;
    // });

    // let vegaChangset = vega.changeset();

    // newData.forEach((e) => {
    //   const newDataElemKey = createKey(e.x, e.y);
    //   if (newDataElemKey in sourceDatasetLookup) {
    //     //console.log('is in ' + e.x + ' ' + e.y + ' ' + e.t);
    //     vegaChangset.modify(sourceDatasetLookup[newDataElemKey], 't', e.t);
    //   }
    // });

    // await view.change('source', vegaChangset).run();
    // await view.insert('source', newData); // .run();
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
    let recvCount = 0;
    const ws = new WebSocket('ws://localhost:8000');
    ws.addEventListener('message', (event) => {
      recvCount += 1;
      if (recvCount % 10000 == 1) {
        console.log(recvCount);
      }
    });
    //ws.onmessage = ({ data }) => {
    //  // console.log(data);
    //  recvCount += 1;
    //  if (recvCount % 10000 == 1) {
    //    console.log(recvCount);
    //  }
    //};
  }, []);

  // useEffect(() => {
  //   if (!connected) return;

  //   function onNewData(data) {
  //     updateData(unpack(data));
  //   }

  //   socket.emit(
  //     'register_for_plot',
  //     ('features', { config: 0 }),
  //     (response_str) => {
  //       const response = JSON.parse(response_str);
  //       setSpecAndData({ spec: response.spec, data: response.initial_data });
  //     }
  //   );

  //   socket.on('newData', onNewData);

  //   return () => {
  //     if (!connected) return;
  //     socket.off('newData', onNewData);
  //   };
  // }, [connected]);

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
        <span className="select-none">&nbsp; {'-'} &nbsp;</span>
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
            className="bg-gray-50 text-center border border-gray-300 rounded-lg outline-none  focus:border-blue-500"
          />
        </Tooltip>
        <span className="select-none">&nbsp; {'/'} &nbsp;</span>
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
  const [isConnected, setIsConnected] = useState(false); //socket.connected);

  // useEffect(() => {
  //   function onConnect() {
  //     setIsConnected(true);
  //   }
  //   function onDisconnect() {
  //     setIsConnected(false);
  //   }

  //   socket.on('connect', onConnect);
  //   socket.on('disconnect', onDisconnect);

  //   return () => {
  //     socket.off('connect', onConnect);
  //     socket.off('disconnect', onDisconnect);
  //   };
  // }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main connected={isConnected} />} />
      </Routes>
    </Router>
  );
}
