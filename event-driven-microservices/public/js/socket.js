function webSocketInvoke() {
    var socket = io('http://localhost:3000', { path: '/websocketupdates'});
    socket.on('event', (value) => {
      console.log(`Received event ${JSON.stringify(value)}`)
      processMessage(value)
    });
  }

  

webSocketInvoke();
