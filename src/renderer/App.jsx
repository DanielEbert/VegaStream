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
import { FaMagnifyingGlass } from 'react-icons/fa6';

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

    const createKey = (a, b) => {
      // TODO: real impl won't work like this, as its floats and can be negative. just use simple hash
      return (a << 16) + b;
    };

    const sourceDataset = view.data('source');
    //console.log('len ' + sourceDataset.length);

    let sourceDatasetLookup = {};
    sourceDataset.forEach((e) => {
      sourceDatasetLookup[createKey(e.x, e.y)] = e;
    });

    let vegaChangset = vega.changeset();

    newData.forEach((e) => {
      const newDataElemKey = createKey(e.x, e.y);
      if (newDataElemKey in sourceDatasetLookup) {
        //console.log('is in ' + e.x + ' ' + e.y + ' ' + e.t);
        vegaChangset.modify(sourceDatasetLookup[newDataElemKey], 't', e.t);
      }
    });

    await view.change('source', vegaChangset).run();
  }, []);

  useEffect(() => {
    if (specAndData == null) return;

    embed(ref.current, specAndData.spec, { actions: false }).then(
      ({ view }) => {
        viewRef.current = view;
        view.addEventListener('click', (event, item) => {
          console.log('clicked', item.datum);
        });
        counter = 0;
        // view.width(600);
        // view.width(1);
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

  useEffect(() => {
    const onResize = () => {
      // console.log('res');
      if (viewRef.current) {
        // TODO: add max X updates every second. use a hook for it if possible
        viewRef.current.resize();
      }
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="w-full bg-white m-2 rounded-lg border border-[#DDDDDD]">
      <div className="w-full h-10 flex justify-between">
        <div className="mx-3 my-2 text-2xl flex flex-row space-x-2 items-baseline">
          <FaMagnifyingGlass size={18} />
          <div>Detections</div>
        </div>
        <div className="mx-3 mt-1 mb-3 text-opacity-50 text-black">
          17:12:55
        </div>
      </div>
      <div className="w-[100%] h-[100%]">
        <div className="aspect-square">
          <div className="w-[40%] h-[40%]" ref={ref} />
        </div>
      </div>
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

  const layoutClassNames = {
    1: 'flex flex-col items-center',
    '2v': 'flex',
    '2h': 'flex flex-col',
    4: 'grid grid-cols-2',
  };

  const divClassBase = 'flex w-full h-full';

  const divClass = {
    1: `${divClassBase}`,
    '2v': `${divClassBase} flex-1`,
    '2h': `${divClassBase} flex-1`,
    4: `${divClassBase}`,
  };

  const layout = '2v';

  return (
    <div className="w-screen h-screen min-h-screen min-w-screen prose flex flex-col bg-[#F5F5F5]">
      <div className={`${layoutClassNames[layout]} flex-1`}>
        <div className={divClass[layout]}>
          <VegaPlot connected={connected} />
        </div>
        {layout !== '1' && (
          <div className={`${divClass[layout]} bg-green-500`}>Div 2</div>
        )}
        {layout === '4' && (
          <div className={`${divClass[layout]} bg-red-500`}>Div 3</div>
        )}
        {layout === '4' && (
          <div className={`${divClass[layout]} bg-yellow-500`}>Div 4</div>
        )}
      </div>
      <TimestampControl
        minTimestamp={minTimestamp}
        maxTimestamp={maxTimestamp}
        selectedTimestamp={selectedTimestamp}
        setSelectedTimestamp={setSelectedTimestamp}
      />
    </div>
  );
}

function MainOrig({ connected }) {
  console.log('render Main');

  const [minTimestamp] = useState(0);
  const [maxTimestamp] = useState(100000);
  const [selectedTimestamp, setSelectedTimestamp] = useState([10000, 45000]);

  return (
    <div className="w-[98vw] h-screen prose flex flex-col">
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
