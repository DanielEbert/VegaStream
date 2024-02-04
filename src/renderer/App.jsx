import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import embed from 'vega-embed';
import { socket } from './socket';

let counter = 0;

function VegaPlot() {
  const ref = useRef();
  const [specAndData, setSpecAndData] = useState(null);
  const [view, setView] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const updateData = async () => {
      if (view == null || paused == true) return;

      counter++;
      // console.log(counter)

      let newData = [];
      for (let i = 0; i < 1; i++) {
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

    const intervalId = setInterval(updateData, 30);

    return () => {
      clearInterval(intervalId);
    };
  }, [view, paused]);

  useEffect(() => {
    if (specAndData == null) return;

    embed(ref.current, specAndData.spec, { actions: false }).then(({ view }) => {
      setView(view);
      view.insert('source', specAndData.data).run();
    });

    return () => {
      if (view) {
        view.finalize();
      }
    };
  }, [specAndData]);

  // TODO: likely handle disconnect and on reconnect ask for current status again

  useEffect(() => {
    socket.emit('register_for_plot', ('features', {"config": 0}), (response_str) => {
      const response = JSON.parse(response_str);
      console.log(response)
      setSpecAndData({spec: response.spec, data: response.initial_data});
    });

    function onNewData(data) {
      console.log('onNewData ' + data);
    }

    function onNewData2(data) {
      console.log('onNewData2 ' + data);
    }

    socket.on('newData', onNewData);
    socket.on('newData', onNewData2);

    return () => {
      socket.off('newData', onNewData);
      socket.off('newData', onNewData2);
    }
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
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
