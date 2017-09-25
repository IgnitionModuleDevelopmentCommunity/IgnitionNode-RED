# Node-RED for Ignition

## Overview

Node-RED nodes for interfacing to Ignition by Inductive Automation. Allows for the reading and writing of tags configured in Ignition.

Requires [Node-RED Ignition Module](https://github.com/IgnitionModuleDevelopmentCommunity/IgnitionNode-RED/tree/master/node-red-contrib-ignition) and Ignition 7.9.3 or later.

## Install

Run the following command in your Node-RED user directory:
 
    npm install node-red-contrib-ignition

## Usage

The Tag Read node can read the value of any tag in Ignition. This includes all Gateway tags (OPC, memory, expression, SQL, derived, UDTs) and System tags.

The Tag Write node can write to tags in Ignition. This will only work with tags that are configured with write privileges.

## Copyright and License

Copyright 2017 Ignition Module Development Community

Licensed under the Apache 2.0 license.