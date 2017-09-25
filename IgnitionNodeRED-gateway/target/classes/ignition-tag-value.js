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

module.exports = function(RED) {
    function IgnitionTagValue(config) {
        RED.nodes.createNode(this, config);
        var node = this;
		var serverConfig = RED.nodes.getNode(config.server);

        node.value = config.value;
        node.valueType = config.valueType;
		node.tagPath = config.tagPath;

		if(!node.valueType){
		    node.valueType = "msg.payload";
		}

		IgnitionTagValue.prototype.HandleResponse = function (node, msg, result, statusCode, nodeErrorMessage, errorMessage){
            result.statusCode = statusCode;
            result.errorMessage = errorMessage;

            switch (node.valueType) {
                case "msg":
                    if(!node.value || node.value == ""){
                        node.value = "payload";
                    }
                    break;
                default:
                    node.value = "payload";
            }

            RED.util.setMessageProperty(msg, node.value, { ignitionResult: result }, true);

            if(statusCode > 1){
                node.status({ fill: "red", shape: "ring", text: nodeErrorMessage });
                node.error(errorMessage);
            } else {
                node.send(msg);
                node.status({});
            }
        };
		
        node.on("input", function(msg) {
            var result = { statusCode: 1, errorMessage:"" };

            if(!serverConfig){
                node.HandleResponse(node, msg, result, 2, "Configuration error", "Configuration error");
            }

            if(!serverConfig.defaultTagProvider || serverConfig.defaultTagProvider == ""){
                serverConfig.defaultTagProvider = "edge";
            }

            var defaultTagProvider = msg.payload.defaultTagProvider ? msg.payload.defaultTagProvider : serverConfig.defaultTagProvider;
            var tagPath = msg.payload.tagPath ? msg.payload.tagPath : node.tagPath;

            if(!tagPath || tagPath == ""){
                node.HandleResponse(node, msg, result, 2, "Invalid tag path", "No tag path supplied");
            }

            var jsonObject = { command:"tagValue", defaultTagProvider:defaultTagProvider, tagPath:tagPath };

            node.status({ fill: "green", shape: "dot", text: "reading" });

            var postOptions = {
                host: serverConfig.hostname,
                port: serverConfig.port,
                path: "/main/system/node-red",
                method: "POST",
                rejectUnauthorized: false,
                headers: {
                    "Content-Type": "application/json"
                }
            };

            var requestType = serverConfig.ssl ? https : http;
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

                    node.HandleResponse(node, msg, result, statusCode, nodeErrorMessage, errorMessage);
                });
            });

            postReq.on("error", function(e) {
                node.HandleResponse(node, msg, result, 3, "HTTP error", "HTTP error: " + e.message);
            });

            postReq.write(JSON.stringify(jsonObject));
            postReq.end();
        });

        node.on("close", function() {
            node.status({});
        });
    }
	
    RED.nodes.registerType("ignition-tag-value", IgnitionTagValue);

    function CreateIgnitionServer(config){
        RED.nodes.createNode(this, config);
        var node = this;

        node.hostname = config.hostname;
        node.port = config.port;
        node.ssl = config.ssl;
        node.defaultTagProvider = config.defaultTagProvider;
    }

    RED.nodes.registerType("ignition-server", CreateIgnitionServer);
}