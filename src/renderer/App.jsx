import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import embed from 'vega-embed';
import { socket } from './socket';

let counter = 0;

function VegaPlot( { connected } ) {
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
  }, [])

  useEffect(() => {
    if (specAndData == null) return;

    embed(ref.current, specAndData.spec, { actions: false }).then(({ view }) => {
      viewRef.current = view;
      counter = 0;
      view.insert('source', specAndData.data).run();
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.finalize();
      }
    };
  }, [specAndData]);

  useEffect(() => {
    if (!connected) return;

    function onNewData(data) {
      updateData(JSON.parse(data))
    }

    socket.emit('register_for_plot', ('features', {"config": 0}), (response_str) => {
      const response = JSON.parse(response_str);
      setSpecAndData({spec: response.spec, data: response.initial_data});
    });

    socket.on('newData', onNewData);

    return () => {
      if (!connected) return;
      socket.off('newData', onNewData);
    }
  }, [connected]);

  return (
    <div>
      <button onClick={() => setPaused((prev) => !prev)}>Pause</button>
      <div ref={ref} />
    </div>
  );
}

function Main({connected}) {
  return (
    <div className="min-h-screen w-full min-w-full prose flex">
      <VegaPlot connected={connected} />
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
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main connected={isConnected} />} />
      </Routes>
    </Router>
  );
}
