### VegaStream

#### IO

- each plot is data independent, that is, we dont share anything. Not always optimal, but makes it easier.
- each client shall be independent, and in fact each plot generation shall be independent. That is, each plot registers itself at the server, receiving custom init and onupdate data
- socketio should be fine for this.
- specify what data should be recieved on register to server
- client must also unregister -> maybe done automatically, but server must maybe check for it
- on plot change, and on config change, we delete old and resend. maybe there just get rid of complete component
