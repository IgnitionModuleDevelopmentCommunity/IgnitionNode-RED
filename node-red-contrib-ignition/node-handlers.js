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
    }

    IgnitionNodesImpl.prototype.addMsg = function (msg) {
        var result = { statusCode: 1, errorMessage:"" };

        if(!this.serverConfig){
            errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Configuration error", "Configuration error");
            return;
        }

        if(!this.serverConfig.defaultTagProvider || this.serverConfig.defaultTagProvider == ""){
            this.serverConfig.defaultTagProvider = "edge";
        }

        var defaultTagProvider = msg.payload.defaultTagProvider ? msg.payload.defaultTagProvider : this.serverConfig.defaultTagProvider;
        var tagPath = msg.payload.tagPath ? msg.payload.tagPath : this.config.tagPath;

        if(!tagPath || tagPath == ""){
            errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag path", "No tag path supplied");
            return;
        }

        var jsonObject = {};

        if(this.command == "tagRead"){
            jsonObject = { apiToken:this.serverConfig.apiToken, secret:this.serverConfig.secret, command:this.command, defaultTagProvider:defaultTagProvider, tagPath:tagPath };
            this.node.status({ fill: "green", shape: "dot", text: "reading" });
        } else if(this.command == "tagWrite"){
            var tagValue = msg.payload.tagValue ? msg.payload.tagValue : this.config.tagValue;

            if(!tagValue){
                errorHandling.HandleResponse(RED, this.node, this.config, msg, result, 2, "Invalid tag value", "No tag value supplied");
                return;
            }

            jsonObject = { apiToken:this.serverConfig.apiToken, secret:this.serverConfig.secret, command:this.command, defaultTagProvider:defaultTagProvider, tagPath:tagPath, value:tagValue };
            this.node.status({ fill: "green", shape: "dot", text: "writing" });
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
                    var jsonResult = JSON.parse(responseString);
                    if(jsonResult.statusCode == 0){
                        statusCode = 4;
                        nodeErrorMessage = "Ignition error";
                        errorMessage = jsonResult.errorMessage;
                    } else {
                        for(var key in jsonResult.ignitionResult){
                            result[key] = jsonResult.ignitionResult[key];
                        }
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

function createIgnitionServerNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.hostname = config.hostname;
    node.port = config.port;
    node.ssl = config.ssl;
    node.defaultTagProvider = config.defaultTagProvider;
    node.apiToken = this.credentials.apiToken;
    node.secret = this.credentials.secret;
}
exports.createIgnitionServerNode = createIgnitionServerNode;