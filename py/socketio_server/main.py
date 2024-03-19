from __future__ import annotations

import socketio
import eventlet
import json
import random

spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.15.1.json",
        # "width": "800",
        # "height": "800",
        # "height": "container",
        "hconcat": [
            {
                "data":{"name":"source"},
                "encoding": {
                    "x":{"field":"x","type":"quantitative"},
                    "y":{"field":"y","type":"quantitative"},
                    "tooltip": {"field":"t","type":"quantitative"}
                },
                "mark":{"type":"point"},
                "name":"view_15",
                "transform":[{"filter":"datum.t >= filterStart"}]
            },
            {
                "height": "container",
                "width": "container",
                "data":{"name":"source"},
                "encoding": {
                    "x":{"field":"x","type":"quantitative"},
                    "y":{"field":"y","type":"quantitative"},
                    "tooltip": {"field":"t","type":"quantitative"}
                },
                "mark":{"type":"point"},
                "name":"view_16",
                "transform":[{"filter":"datum.t >= filterStart"}]
            },
            # {
            #     "data":{"name":"sourceb"},
            #     "encoding":{
            #         "x":{"field":"a","type":"quantitative"},
            #         "y":{"field":"b","type":"quantitative","scale":{"domain":[0,{"expr":"domainWidth"}]}}
            #     },
            #     "mark":{"color":"red","type":"point"},
            #     "name":"view_16"
            # }
        ],
        "params":[
            {
                "name":"domainWidth",
                "value":10,
                "bind":{"input":"range","min":1,"max":20,"step":1,"name":"Domain Width "}
            },
            {
                "name":"filterStart","value": 0
            }
        ]
    }


def main() -> int:
    sio = socketio.Server(cors_allowed_origins='*')

    client_ids = {}

    @sio.event
    def connect(sid, environ, auth):
        print('connect ', sid)
        client_ids[sid] = {'next_t': 0}

    @sio.event
    def disconnect(sid):
        print('disconnect ', sid)
        del client_ids[sid]

    @sio.event
    def register_for_plot(sid, data):
        print('register_for_plot', sid, data)
        return json.dumps(
            {
                'spec': spec,
                'initial_data': [
                    { 'x': 1, 'y': 3, 't': 0 },
                    { 'x': 2, 'y': 2, 't': 0 },
                    { 'x': 3, 'y': 1, 't': 0 },
                    { 'x': 4, 'y': 4, 't': 0 },
                    { 'x': 5, 'y': 5, 't': 0 },
                ],
            }
        )

    def send_new_data():
        while True:
            for sid, sid_data in client_ids.items():
                # TODO: later get new data from queue, check if anyone needs it, and send only to that person
                sio.emit('newData', json.dumps([{ 'x': random.randint(0, 5), 'y': random.randint(0, 5), 't': sid_data['next_t']}]), room=sid)
                sid_data['next_t'] += 1
            eventlet.sleep(0.03)

    app = socketio.WSGIApp(sio)
    eventlet.spawn(send_new_data)
    eventlet.wsgi.server(eventlet.listen(('', 8000)), app)


if __name__ == '__main__':
    raise SystemExit(main())
