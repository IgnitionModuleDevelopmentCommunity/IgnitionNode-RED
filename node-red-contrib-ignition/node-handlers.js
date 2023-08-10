/*
   Copyright 2017 Ignition Module Development Community

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var http = require("http");
var https = require("https");
var ws = require("ws");
var inspect = require("util").inspect;
var url = require("url");
var HttpsProxyAgent = require('https-proxy-agent');
var errorHandling = require("./error-handling");

var RED;
function setRED(globalRED) {
    RED = globalRED;
}
exports.setRED = setRED;

var IgnitionNodesImpl = (function () {
    function IgnitionNodesImpl(config, serverConfig, node, command) {
        this.config = config;
        this.serverConfig = serverConfig;
        this.node = node;
        this.command = command;

        if(!this.config.valueType){
            this.config.valueType = "msg.payload";
        }
		
		if(!this.serverConfig.defaultTagProvider || this.serverConfig.defaultTagProvider == ""){
            this.serverConfig.defaultTagProvider = "edge";
        }
    }

    IgnitionNodesImpl.prototype.addMsg = function (msg) {
        var result = { ignitionResult: { } };

        if(!this.serverConfig){
            errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Configuration error", "Configuration error");
            return;
        }

        var defaultTagProvider = msg.payload.defaultTagProvider ? msg.payload.defaultTagProvider : this.serverConfig.defaultTagProvider;

        var jsonObject = {};

        if(this.command == "tagRead" || this.command == "tagBrowse"){
			var tagPath = msg.payload.tagPath ? msg.payload.tagPath : this.config.tagPath;

			if(!tagPath || tagPath == ""){
				errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag path", "No tag path supplied");
				return;
			}
			
			var tagPaths = [];
			if (Array.isArray(tagPath)){
				tagPaths = tagPath;
			} else {
				try {
                    tagPaths = tagPath.split(",").map(function(item) {
					  return item.trim();
					});
                } catch(error){
					errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag path", "Error splitting tag path on comma");
					return;
				}
			}
			
            jsonObject = { apiToken:this.serverConfig.apiToken, secret:this.serverConfig.secret, command:this.command, defaultTagProvider:defaultTagProvider, tagPaths:tagPaths };
            this.node.status({ fill: "green", shape: "dot", text: "Reading" });
        } else if(this.command == "tagWrite"){
			var tagPath = msg.payload.tagPath ? msg.payload.tagPath : this.config.tagPath;
			var values = msg.payload.values;

			if(!values && (!tagPath || tagPath == "")){
				errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag path", "No tag path supplied");
				return;
			} else if(values && values.length == 0){
				errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "No values", "No tag values supplied");
				return;
			}
		
			var tagPaths = [];
			var tagValues = [];
			
			if(!values){
				var tagValue = !(typeof msg.payload.tagValue === 'undefined' || msg.payload.tagValue === null) ? msg.payload.tagValue : this.config.tagValue;

				if(typeof tagValue === 'undefined' || tagValue === null){
					errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag value", "No tag value supplied");
					return;
				}
				
				if (Array.isArray(tagPath)){
					tagPaths = tagPath;
				} else {
					try {
						tagPaths = tagPath.split(",").map(function(item) {
						  return item.trim();
						});
					} catch(error){
						errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag path", "Error splitting tag path on comma");
						return;
					}
				}
				
				if (Array.isArray(tagValue)){
					tagValues = tagValue;
				} else {
					if (tagPaths.length > 1){
						try {
							tagValues = tagValue.split(",").map(function(item) {
							  return item.trim();
							});
						} catch(error){
							errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag value", "Error splitting tag value on comma");
							return;
						}
					} else {
						tagValues = [tagValue];
					}
				}
			} else {
				try {
					for (var i = 0; i < values.length; i++){
						var tagRow = values[i];
						tagPaths.push(tagRow.tagPath);
						tagValues.push(tagRow.tagValue);
					}
                } catch(error){
					errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag value", "Tag structure invalid");
					return;
				}
			}
			
			if(tagPaths.length != tagValues.length){
				errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Mismatched tags/values", "Number of tags paths does not match number of values");
				return;
			}
			
			var finalTagPaths = [];
			var finalTagValues = [];
			
			function checkTagValueObjects(tp, tv, finalTagPaths, finalTagValues) {
				if(tv != null && typeof tv == 'object' && !(tv.hasOwnProperty("columns") && tv.hasOwnProperty("rows"))){
					for (const key in tv) {
						var ktp = tp + "/" + key;
						var ktv = tv[key];
						checkTagValueObjects(ktp, ktv, finalTagPaths, finalTagValues);
					}
				} else {
					finalTagPaths.push(tp);
					finalTagValues.push(tv);
				}
			}
			
			try{
				for (var i = 0; i < tagPaths.length; i++){
					var tp = tagPaths[i];
					var tv = tagValues[i];
					checkTagValueObjects(tp, tv, finalTagPaths, finalTagValues);					
				}
			} catch(error){
				errorHandling.HandleResponse(RED, node, config, msg, result, 2, "Invalid tag value", "Tag structure invalid");
				return;
			}

            jsonObject = { apiToken:this.serverConfig.apiToken, secret:this.serverConfig.secret, command:this.command, defaultTagProvider:defaultTagProvider, tagPaths:finalTagPaths, values:finalTagValues };
            this.node.status({ fill: "green", shape: "dot", text: "Writing" });
        }

        var postOptions = {
            host: this.serverConfig.hostname,
            port: this.serverConfig.port,
            path: "/system/node-red",
            method: "POST",
            rejectUnauthorized: false,
            headers: {
                "Content-Type": "application/json"
            }
        };

        var requestType = this.serverConfig.ssl ? https : http;
        var nodeImpl = this;
        var postReq = requestType.request(postOptions, function(res) {
            var responseString = "";

            res.setEncoding("utf8");

            res.on("data", function (data) {
                responseString += data;
            });

            res.on("end", function (data) {
                var statusCode = 1;
                var nodeErrorMessage = "";
                var errorMessage = "";

                try {
                    result = JSON.parse(responseString);
                    if(result.statusCode == 0){
                        statusCode = 4;
                        nodeErrorMessage = "Ignition error";
                        errorMessage = result.errorMessage;
                    }
                } catch(error){
                    statusCode = 2;
                    nodeErrorMessage = "JSON error";
                    errorMessage = "JSON error: " + error;
                }

                errorHandling.HandleResponse(RED, nodeImpl.node, nodeImpl.config, msg, result, statusCode, nodeErrorMessage, errorMessage);
            });
        });

        postReq.on("error", function(e) {
            errorHandling.HandleResponse(RED, nodeImpl.node, nodeImpl.config, msg, result, 3, "HTTP error", "HTTP error: " + e.message);
        });

        postReq.write(JSON.stringify(jsonObject));
        postReq.end();
    };

    IgnitionNodesImpl.prototype.onClose = function () {
        this.node.status({});
    };

    return IgnitionNodesImpl;
}());
exports.IgnitionNodesImpl = IgnitionNodesImpl;

function createIgnitionTagReadNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var serverConfig = RED.nodes.getNode(config.server);

    var impl = new IgnitionNodesImpl(config, serverConfig, node, "tagRead");
    node.on('close', function () {
        impl.onClose();
    });
    node.on('input', function (msg) {
        impl.addMsg(msg);
    });
}
exports.createIgnitionTagReadNode = createIgnitionTagReadNode;

function createIgnitionTagWriteNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var serverConfig = RED.nodes.getNode(config.server);

    var impl = new IgnitionNodesImpl(config, serverConfig, node, "tagWrite");
    node.on('close', function () {
        impl.onClose();
    });
    node.on('input', function (msg) {
        impl.addMsg(msg);
    });
}
exports.createIgnitionTagWriteNode = createIgnitionTagWriteNode;

var IgnitionWSNodesImpl = (function () {
    function IgnitionWSNodesImpl(config, serverConfig, node, command) {
        this.config = config;
        this.serverConfig = serverConfig;
        this.node = node;
        this.command = command;
		
		if(!this.serverConfig.defaultTagProvider || this.serverConfig.defaultTagProvider == ""){
            this.serverConfig.defaultTagProvider = "edge";
        }
    }
	
	IgnitionWSNodesImpl.prototype.init = function () {
        this.addMsg({ payload:{} });
    };

    IgnitionWSNodesImpl.prototype.addMsg = function (msg) {
        var defaultTagProvider = msg.payload.defaultTagProvider ? msg.payload.defaultTagProvider : this.serverConfig.defaultTagProvider;
		var tagPath = msg.payload.tagPath ? msg.payload.tagPath : this.config.tagPath;
		var tagPaths = [];
		
        if(!tagPath || tagPath == ""){
            this.node.status({ fill: "yellow", shape: "dot", text: "No tag path" });
        } else {
			if (Array.isArray(tagPath)){
				tagPaths = tagPath;
			} else {
				tagPaths = tagPath.split(",").map(function(item) {
				  return item.trim();
				});
			}
		}
		
		var jsonObject = {};

        if(this.command == "tagRead"){
            jsonObject = { apiToken:this.serverConfig.apiToken, secret:this.serverConfig.secret, command:this.command, defaultTagProvider:defaultTagProvider, tagPaths:tagPaths };
			this.node.server.send(JSON.stringify(jsonObject));
        }
    };
	
	IgnitionWSNodesImpl.prototype.handleEvent = function (id, socket, event, data, flags) {
		var result = { ignitionResult: { } };
        var statusCode = 1;
		var nodeErrorMessage = "";
		var errorMessage = "";

		try {
			result = JSON.parse(data);
			if(result.statusCode == 0){
				statusCode = 4;
				nodeErrorMessage = "Ignition error";
				errorMessage = result.errorMessage;
			}
		} catch(error){
			statusCode = 2;
			nodeErrorMessage = "JSON error";
			errorMessage = "JSON error: " + error;
		}
		
		errorHandling.HandleWSResponse(RED, this.node, this.config, result, statusCode, nodeErrorMessage, errorMessage);
    };

    IgnitionWSNodesImpl.prototype.onClose = function () {
        this.node.status({});
    };

    return IgnitionWSNodesImpl;
}());
exports.IgnitionWSNodesImpl = IgnitionWSNodesImpl;

function createIgnitionTagReadWSClientNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
	var serverConfig = RED.nodes.getNode(config.server);
	
	node.serverConfig = serverConfig;
	node.wholemsg = (config.wholemsg === "true");
	node.closing = false;
	
	if(!node.serverConfig){
		node.status({ fill: "red", shape: "ring", text: "Configuration error" });
		node.error("Missing server configuration");
		return;
	}
	
	var impl = new IgnitionWSNodesImpl(config, serverConfig, node, "tagRead");
	
	if (config.hb) {
		var heartbeat = parseInt(config.hb);
		if (heartbeat > 0) {
			node.heartbeat = heartbeat * 1000;
		}
	}
	
	function startconn() {
		node.tout = null;
		var prox, noprox;
		if (process.env.http_proxy) { prox = process.env.http_proxy; }
		if (process.env.HTTP_PROXY) { prox = process.env.HTTP_PROXY; }
		if (process.env.no_proxy) { noprox = process.env.no_proxy.split(","); }
		if (process.env.NO_PROXY) { noprox = process.env.NO_PROXY.split(","); }

		var noproxy = false;
		if (noprox) {
			for (var i in noprox) {
				if (node.path.indexOf(noprox[i].trim()) !== -1) { noproxy=true; }
			}
		}

		var agent = undefined;
		if (prox && !noproxy) {
			agent = new HttpsProxyAgent(prox);
		}

		var options = {};
		if (agent) {
			options.agent = agent;
		}
		
		if (node.serverConfig.ssl && node.serverConfig.tls) {
			var tlsNode = RED.nodes.getNode(node.serverConfig.tls);
			if (tlsNode) {
				tlsNode.addTLSOptions(options);
			}
		}
		
		var wsPath = node.serverConfig.ssl && node.serverConfig.tls ? "wss://" : "ws://";
		wsPath += node.serverConfig.hostname + ":" + node.serverConfig.port + "/system/node-red-ws";
		var socket = new ws(wsPath, options);
		socket.setMaxListeners(0);
		node.server = socket;
		handleConnection(socket);
	}
	
	function handleConnection(socket) {
		var id = RED.util.generateId();
		socket.nrId = id;
		socket.nrPendingHeartbeat = false;
		
		if (node.heartbeat) {
			node.heartbeatInterval = setInterval(function() {
				if (socket.nrPendingHeartbeat) {
					socket.terminate();
					socket.nrErrorHandler(new Error("timeout"));
					return;
				}
				socket.nrPendingHeartbeat = true;
				socket.ping();
			}, node.heartbeat);
		}
		
		socket.on('open',function() {
			node.status({ fill:"green", shape:"dot", text:"Ignition connected" });
			impl.init();
		});
		
		socket.on('close',function() {
			clearInterval(node.heartbeatInterval);
			
			node.status({ fill:"red", shape:"ring", text:"Ignition disconnected" });
			
			if (!node.closing) {
				clearTimeout(node.tout);
				node.tout = setTimeout(function() { startconn(); }, 3000);
			}
		});
		
		socket.on('message',function(data, flags) {
			impl.handleEvent(id, socket, 'message', data, flags);
		});
		
		socket.nrErrorHandler = function(err) {
			clearInterval(node.heartbeatInterval);
			
			node.status({ fill: "red", shape: "ring", text: "Communication error" });
			
			if (!node.closing) {
				clearTimeout(node.tout);
				node.tout = setTimeout(function() { startconn(); }, 3000);
			}
		};
		
		socket.on('error', socket.nrErrorHandler);
		
		socket.on('ping', function() {
			socket.nrPendingHeartbeat = false;
		});
		
		socket.on('pong', function() {
			socket.nrPendingHeartbeat = false;
		});
	}
	
	node.closing = false;
	startconn();
	
	node.on("close", function() {
		if (node.heartbeatInterval) {
			clearInterval(node.heartbeatInterval);
		}
		
		node.closing = true;
		node.server.close();
		if (node.tout) {
			clearTimeout(node.tout);
			node.tout = null;
		}
		
		impl.onClose();
	});

    node.on('input', function (msg) {
        impl.addMsg(msg);
    });
}
exports.createIgnitionTagReadWSClientNode = createIgnitionTagReadWSClientNode;

function createIgnitionTagBrowseNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var serverConfig = RED.nodes.getNode(config.server);

    var impl = new IgnitionNodesImpl(config, serverConfig, node, "tagBrowse");
    node.on('close', function () {
        impl.onClose();
    });
    node.on('input', function (msg) {
        impl.addMsg(msg);
    });
}
exports.createIgnitionTagBrowseNode = createIgnitionTagBrowseNode;

function createIgnitionServerNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.hostname = config.hostname;
    node.port = config.port;
    node.ssl = config.ssl;
	node.tls = config.tls;
    node.defaultTagProvider = config.defaultTagProvider;
    node.apiToken = this.credentials.apiToken;
    node.secret = this.credentials.secret;
}
exports.createIgnitionServerNode = createIgnitionServerNode;