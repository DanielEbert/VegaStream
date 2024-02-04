from __future__ import annotations

import socketio
import eventlet
import json

spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.15.1.json",
    "config": {
        "view":
            {"continuousHeight":500,"continuousWidth":500}
        },
        "layer": [
            {
                "data":{"name":"source"},
                "encoding": {
                    "x":{"field":"x","type":"quantitative"},
                    "y":{"field":"y","type":"quantitative"}
                },
                "mark":{"type":"point"},
                "name":"view_15",
                "transform":[{"filter":"datum.t >= filterStart"}]
            },
            {
                "data":{"name":"sourceb"},
                "encoding":{
                    "x":{"field":"a","type":"quantitative"},
                    "y":{"field":"b","type":"quantitative","scale":{"domain":[0,{"expr":"domainWidth"}]}}
                },
                "mark":{"color":"red","type":"point"},
                "name":"view_16"
            }
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

    client_ids = set()

    @sio.event
    def connect(sid, environ, auth):
        print('connect ', sid)
        client_ids.add(sid)

    @sio.event
    def disconnect(sid):
        print('disconnect ', sid)
        client_ids.remove(sid)
    
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

    @sio.on('*')
    def on_any_event(event, sid, data):
        print(event, sid, data)
        sio.emit('newData', 'huu', room=sid)
        return 'my-callback'

    app = socketio.WSGIApp(sio)
    eventlet.wsgi.server(eventlet.listen(('', 8000)), app)


if __name__ == '__main__':
    raise SystemExit(main())
