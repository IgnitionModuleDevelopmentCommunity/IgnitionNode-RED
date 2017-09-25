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
module.exports = {
    HandleResponse: function (RED, node, config, msg, result, statusCode, nodeErrorMessage, errorMessage){
        result.statusCode = statusCode;
        result.errorMessage = errorMessage;

        switch (config.valueType) {
            case "msg":
                if(!config.value || config.value == ""){
                    config.value = "payload";
                }
                break;
            default:
                config.value = "payload";
        }

        RED.util.setMessageProperty(msg, config.value, { ignitionResult: result }, true);

        if(statusCode > 1){
            node.status({ fill: "red", shape: "ring", text: nodeErrorMessage });
            node.error(errorMessage, msg);
        } else {
            node.send(msg);
            node.status({});
        }
    }
};