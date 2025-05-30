const server = require('websocket').server;
const http = require('http');

let serverhttp;
let socketme;

function sockCreate(MESSAGE, EXTRA) {
    socketme.socket = new server({
        httpServer: serverhttp,
        maxReceivedFrameSize: 64 * 1024 * 1024,
        maxReceivedMessageSize: 64 * 1024 * 1024,
        fragmentOutgoingMessages: false,
        keepalive: true,
    });
    console.log('WebSocket Created' + EXTRA);
    socketme.ONREQUEST(MESSAGE);
}

module.exports = {
    protocolName: "uniquename",
    socket: null,
    lastid: 0,

    START: function (PORT, MESSAGE) {
        socketme = this;
        if (typeof PORT === "number") {
            console.log('🟢 Criando servidor HTTP na porta', PORT);
            serverhttp = http.createServer((req, res) => {});
            serverhttp.listen(PORT, () => {
                sockCreate(MESSAGE, ' in port ' + PORT);
            });
        } else {
            console.log('🟢 Usando servidor externo (HTTP/HTTPS)');
            serverhttp = PORT;
            sockCreate(MESSAGE, '');
        }
    },

    Wsinitialize: function (connection, MESSAGE) {
        if (typeof MESSAGE === "function") {
            MESSAGE({
                KEY: 'CONNECTED',
                ID: 'KEY' + connection.id,
                CONNECTION: connection,
            }, connection);
        }

        connection.on("message", message => {
            if (typeof MESSAGE === "function") {
                try {
                    const JSONMESSAGE = JSON.parse(message.utf8Data);
                    if (typeof JSONMESSAGE.KEY !== 'undefined') {
                        JSONMESSAGE.ID = 'KEY' + connection.id;
                        MESSAGE(JSONMESSAGE, connection);
                    }
                } catch (e) {
                    console.error("Erro ao processar mensagem WebSocket:", e);
                }
            }
        });

        connection.on("close", () => {
            if (typeof MESSAGE === "function") {
                MESSAGE({
                    KEY: 'DISCONECTED',
                    ID: 'KEY' + connection.id,
                    CONNECTION: connection
                });
            }
        });
    },

    ONREQUEST: function (MESSAGE) {
        this.socket.on("request", req => {
            if (req.requestedProtocols.includes(this.protocolName)) {
                const connection = req.accept(this.protocolName);
                connection.id = this.lastid++;
                this.Wsinitialize(connection, MESSAGE);
            } else {
                req.accept(req.requestedProtocols[0])
                   .drop(1002, "ERROR: INVALID WEBSOCKET REQUEST");
            }
        });
    },
};
