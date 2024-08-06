# Node-RED for Ignition

### 1.5.5

September 25, 2017

 * Initial Release
 * Compatible with Ignition 7.9
 
### 1.5.6

July 20, 2020

 * Updated for Ignition 8.0
 * Compatible with Ignition 8.0
 
### 1.5.7

July 30, 2020

 * Allows a write of 0 or false in the tag write node
 * Compatible with Ignition 8.1
 * Compatible with Ignition Maker
 
### 1.5.8

August 15, 2021

 * Added web socket tag read node
 * Added browse tag node
 * Added support for reading/writing multiple tags
 * Compatible with Ignition 8.1
 * Compatible with Ignition Maker
 
### 1.5.9

August 20, 2021

 * Added dependencies for ws, https-proxy-agent, and url

### 1.5.10

September 9, 2022

 * Fixed issue with TLS configuration

### 1.5.11

September 28, 2022

 * Fixed issue with saving heartbeat and message type on ignition-tag-read-ws node

### 1.5.12

February 17, 2023

 * Bumped the module version from 1.5.11 to 1.5.12
 * Also bumped the module artifact versions from 1.0.0 to 1.1.0
 * Set the required Ignition version to 8.1.25 (and made small adjustment to README to help folks find the appropriate module for older versions)

### 1.5.13

February 27, 2023

 * Version bump only for alignment with Ignition module and support for 8.1.25+

### 1.5.14

August 8, 2023

 * Added support for reading Datasets from Ignition
 * Added audit profile to token settings to log tag writes
 * Fixed bug with false or 0 value when writing to a single tag
 
### 1.5.15

August 9, 2023

 * Added write support for Datasets
 * Made it so the nodes are not destructive on the payload. They now merge results.
 
### 1.5.16

August 5, 2024

 * Added support for browsing tag providers (root)
 * Fixed issue when browsing a path that doesn't exist