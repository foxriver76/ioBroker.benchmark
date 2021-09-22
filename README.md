![Logo](admin/benchmark.png)
# ioBroker.benchmark

[![NPM version](https://img.shields.io/npm/v/iobroker.benchmark.svg)](https://www.npmjs.com/package/iobroker.benchmark)
[![Downloads](https://img.shields.io/npm/dm/iobroker.benchmark.svg)](https://www.npmjs.com/package/iobroker.benchmark)
![Number of Installations](https://iobroker.live/badges/benchmark-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/benchmark-stable.svg)
[![Dependency Status](https://img.shields.io/david/foxriver76/iobroker.benchmark.svg)](https://david-dm.org/foxriver76/iobroker.benchmark)

[![NPM](https://nodei.co/npm/iobroker.benchmark.png?downloads=true)](https://nodei.co/npm/iobroker.benchmark/)

**Tests:** ![Test and Release](https://github.com/foxriver76/ioBroker.benchmark/workflows/Test%20and%20Release/badge.svg)

## benchmark adapter for ioBroker
Benchmark your system.

## How to add a new test?
1. Create a new TypeScript file in src/lib/activeTests, with a class which inherits from TestUtils
2. Define the three steps of your test (execute is automatically measured)
3. Add your test to src/lib/allTests.ts
4. Add a button and translation for your test to admin/jsonConfig.json

## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### 0.1.1 (2021-09-22)
* (foxriver76) implemented `cleanUpBetweenEpoch` and `prepareBetweenEpoch` to save ressources

### 0.1.0 (2021-09-21)
* (foxriver76) write mem stats in MB
* (foxriver76) write summary file
* (foxriver76) also monitor js-controller
* (foxriver76) add overall summary state
* (foxriver76) add epochs and iterations to summary
* (foxriver76) added logging + restructuring code
* (foxriver76) added cleanup button and allow prefixing ids

### 0.0.3 (2021-09-20)
* (foxriver76) we fixed actionsPerSecondStd state if only one epoch

### 0.0.2 (2021-09-20)
* (foxriver76) we fixed actionsPerSecondStd state

### 0.0.1 (2021-09-20)
* (foxriver76) initial release

## License
MIT License

Copyright (c) 2021 foxriver76 <moritz.heusinger@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The adapter icon has been designed using resources from Flaticon.com