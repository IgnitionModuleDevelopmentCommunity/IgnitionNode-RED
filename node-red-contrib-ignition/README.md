# Node-RED Nodes for Ignition

## Overview

Node-RED nodes for interfacing to Ignition by Inductive Automation. Allows for the reading, writing, and browsing tags configured in Ignition.

Requires [Node-RED Ignition Module](https://github.com/IgnitionModuleDevelopmentCommunity/IgnitionNode-RED/blob/master/Ignition-Node-RED-Module-signed.modl) and Ignition 8.1.0 or later.

Use version 1.5.5 for Ignition 7.9 found [here](https://www.npmjs.com/package/node-red-contrib-ignition-nodes/v/1.5.5).

## Install

Run the following command in your Node-RED user directory:
 
    npm install node-red-contrib-ignition-nodes

## Usage

The Tag Read node can read the value of any tag in Ignition. This includes all Gateway tags (OPC, memory, expression, SQL, derived, UDTs) and System tags.

The Tag Read Web Socket node utilizes web sockets so tag value changes get pushed to Node-RED without polling.

The Tag Write node can write to tags in Ignition. This will only work with tags that are configured with write privileges.

The Tag Browse node can browse for tags in Ignition. This allows you to discover tags configured in Ignition.

## Copyright and License

Copyright 2021 Ignition Module Development Community

Licensed under the Apache 2.0 license.