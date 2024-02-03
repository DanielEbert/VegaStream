import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import embed from 'vega-embed';

let counter = 0;

function VegaPlot() {
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.15.1.json',
    config: {
      view: {
        continuousHeight: 1000,
        continuousWidth: 1000,
      },
    },
    layer: [
      {
        data: {
          name: 'source',
        },
        encoding: {
          x: {
            field: 'x',
            type: 'quantitative',
          },
          y: {
            field: 'y',
            type: 'quantitative',
          },
        },
        mark: {
          type: 'point',
        },
        name: 'view_15',
        transform: [
          {
            filter: 'datum.t > filterStart',
          },
        ],
      },
      {
        data: {
          name: 'sourceb',
        },
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
          },
          y: {
            field: 'b',
            type: 'quantitative',
            scale: { domain: [0, { expr: 'domainWidth' }] },
          },
        },
        mark: {
          color: 'red',
          type: 'point',
        },
        name: 'view_16',
      },
    ],
    params: [
      {
        name: 'domainWidth',
        value: 10,
        bind: {
          input: 'range',
          min: 1,
          max: 20,
          step: 1,
          name: 'Domain Width ',
        },
      },
      {
        name: 'filterStart',
        value: 100,
      }
      //   {
      //     bind: 'scales',
      //     name: 'param_25',
      //     select: {
      //       encodings: ['x', 'y'],
      //       type: 'interval',
      //     },
      //     views: ['view_15'],
      //   },
      //   {
      //     bind: 'scales',
      //     name: 'param_26',
      //     select: {
      //       encodings: ['x', 'y'],
      //       type: 'interval',
      //     },
      //     views: ['view_16'],
      //   },
    ],
  };

  // TODO: use view.signal('domainWidth', newValue).run();

  const initialData = {
    source: [
      { x: 1, y: 3, t: 0 },
      { x: 2, y: 2, t: 0 },
      { x: 3, y: 1, t: 0 },
      { x: 4, y: 4, t: 0 },
      { x: 5, y: 5, t: 0 },
    ],
  };

  const ref = useRef();
  const [view, setView] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const updateData = async () => {
      if (view == null || paused == true) return;

      counter++;
      // console.log(counter)

      let newData = [];
      for (let i = 0; i < 100; i++) {
        const elem = JSON.stringify({
          x: Math.random() * 10,
          y: Math.random() * 10,
          t: counter,
        });

        newData.push(JSON.parse(elem));
        // newData.push({ x: Math.random() * 10, y: Math.random() * 10 });
      }
      view.signal('filterStart', counter - 50);
      await view.insert('source', newData).run();

      // let newDataB = [];
      // for (let i = 0; i < 100; i++) {
      //   newDataB.push({ a: Math.random() * 10, b: Math.random() * 10 });
      // }
      // await view.insert('sourceb', newDataB).run();
    };

    const intervalId = setInterval(updateData, 10);

    return () => {
      clearInterval(intervalId);
    };
  }, [view, paused]);

  useEffect(() => {
    embed(ref.current, spec, { actions: false }).then(({ view }) => {
      setView(view);
      view.insert('source', initialData.source).run();
    });

    return () => {
      if (view) {
        view.finalize();
      }
    };
  }, []);

  return (
    <div>
      <button onClick={() => setPaused((prev) => !prev)}>Pause</button>
      <div ref={ref} />
    </div>
  );
}

function Main() {
  return (
    <div className="min-h-screen w-full min-w-full prose flex">
      <VegaPlot />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
