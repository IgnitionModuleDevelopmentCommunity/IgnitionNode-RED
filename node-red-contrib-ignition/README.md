# Node-RED Nodes for Ignition

## Overview

Node-RED nodes for interfacing to Ignition by Inductive Automation. Allows for the reading, writing, and browsing tags configured in Ignition.

Requires [Node-RED Ignition Module](https://github.com/IgnitionModuleDevelopmentCommunity/IgnitionNode-RED/releases) and Ignition 8.1+.

- For Ignition 8.1.0 - 8.1.47, use version 1.5.17 or previous
- For Ignition 8.1.48, use version 1.5.18
- For Ignition 8.3.0+, use version 2.0.0

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