### VegaStream

#### IO

- each plot is data independent, that is, we dont share anything. Not always optimal, but makes it easier.
- each client shall be independent, and in fact each plot generation shall be independent. That is, each plot registers itself at the server, receiving custom init and onupdate data
- socketio should be fine for this.
- specify what data should be recieved on register to server
- client must also unregister -> maybe done automatically, but server must maybe check for it
- on plot change, and on config change, we delete old and resend. maybe there just get rid of complete component


- on connect:
    - first ask for spec given name and config. Server knows what data spec requires.
    - recv spec and prev until current data
    - on server, add to list of receiver for all required data

- during connect:
    - recv onupdate

- on disconnect:
    - 

!!! later in UI have play button to advance view window in real time. also have the car drive


- write a test to check if all data is received when we connect and get data up until now, and then get live updates
