# Ignition Node-RED Module

## Overview

Adds support for Node-RED nodes by adding an API to an Ignition Gateway. The API allows for the reading, writing, and browsing of tags configured in Ignition.

## Configuration

Once the module is installed, you must add an API Token and Secret that allow access to the API. You can administrate these tokens in the Ignition Gateway configuration page under Connections -> Node-RED -> Tokens.

## Requirements

- Ignition 8.1+ and the Node-RED module
  - For Ignition 8.1.0 - 8.1.47, use version 1.5.17 or previous
  - For Ignition 8.1.48, use version 1.5.18
  - For Ignition 8.3.0+, use version 2.0.0
- Node-RED (node-red-contrib-ignition) nodes installed at the same version as this module

## Copyright and License

Copyright 2025 Ignition Module Development Community

Licensed under the Apache 2.0 license.
