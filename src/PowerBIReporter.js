'use strict'
const axios = require('axios')
const request = require('sync-request')
class PowerbiReporter {
    /**
     * 
     * @param {*} emitter 
     * @param {*} reporterOptions 
     * @param {*} options 
     * @param {String=} reporterOptions.powerbiURL - Url for powerbi
     * @param {String=} reporterOptions.component - The name of the repository/component
     * @param {String=} reporterOptions.product - The name of the project/product
     * @param {String=} reporterOptions.environment - Environment we which to test (QA, PROD, DEV)
     */
    constructor(emitter, reporterOptions, options) {
        this.crashed = false
        this.currentDate = Date.now()
        this.options = options;
        this.reporterOptions = reporterOptions;
        this.responseTimes = []
        this.responseSizes = []
        this.avgResponseTime = 0
        this.avgResponseSize = 0
        this.component = this.reporterOptions.component
        this.product = this.reporterOptions.product
        this.environment = this.reporterOptions.environment
        this.apiURL = this.reporterOptions.url
        this.collectionName = options.collection.name
        this.testCollectionPassed = true

        const events = 'start beforeIteration iteration beforeItem item beforePrerequest prerequest beforeScript script beforeRequest request beforeTest test beforeAssertion assertion console exception beforeDone done'.split(' ');
        events.forEach((e) => { if (typeof this[e] == 'function') emitter.on(e, (err, args) => this[e](err, args)) });
    }

    start(err, args) {
        console.log("Currently running",this.collectionName);
    }

    beforeItem(err, args) {
        this.currItem = { name: this.itemName(args.item, args.cursor), passed: true, failedAssertions: [] };

        console.log(`[testStarted name='${this.currItem.name}' captureStandardOutput='true'`);
    }

    request(err, args) {
        if (!args.response) {
            console.error("Response invalid. Check if the tested API can be reached. Response is null")
            this.responseTimes = []
            this.responseSizes = []
        }
        else {
            this.responseTimes.push(args.response.responseTime)
            this.responseSizes.push(args.response.responseSize)
        }
    }

    assertion(err, args) {
        console.error("Assertion Error", err)
        if (err) {
            this.testCollectionPassed = false
            console.log("Item",this.currItem)
        }
    }

    done(err, args) {
        console.log("Tests finished. Now preparing results file for PowerBI")
        let sumResponseSize = 0;
        let sumResponseTime = 0;
        if(this.responseTimes.length > 0) {
            for (let i = 0; i < this.responseTimes.length; i++) {
                const element = this.responseTimes[i];
                sumResponseTime += element
            }
            for (let i = 0; i < this.responseSizes.length; i++) {
                const element = this.responseSizes[i];
                sumResponseSize += element
            }
            this.avgResponseTime = sumResponseTime / this.responseTimes.length
            this.avgResponseSize = sumResponseSize / this.responseSizes.length
        }          

        this.generateData()
    }

    generateData() {
        let passed = this.testCollectionPassed ? true : false
        let endDate = Date.now()
        let duration = Math.abs((endDate - this.currentDate) / 1000)
        let dateObj = new Date(this.currentDate)
        let currentDateISO = dateObj.toISOString()

        const data = [{
            product: this.product,
            component: this.component,
            environment: this.environment,
            duration,
            avgResponseSize: this.avgResponseSize,
            avgResponseTime: this.avgResponseTime,
            success: passed,
            date: currentDateISO,
            false: 0,
            true: 1
        }]
        
        this.sendData(data)
    }

    async sendData(data) {
        console.log("\r\nSending data via Axios to PowerBI URL", data, this.apiURL)
        if(!this.apiURL) {
            console.error("PowerBi URL is undefined...exit")
            return
        }
        try {                
            const resp = await axios({
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                url: this.apiURL,
                data
            })
            console.log(`Status code: ${resp.status}`);
            console.log(`Status text: ${resp.statusText}`);
            console.log(`Request method: ${resp.request.method}`);
            console.log(`Path: ${resp.request.path}`);        
            console.log(`Date: ${resp.headers.date}`);

        } catch (error) {
            console.log("Failed to send status", error.response)
        }
    }

    itemName(item, cursor) {
        const parentName = item.parent && item.parent() && item.parent().name ? item.parent().name : "";
        const folderOrEmpty = (!parentName || parentName === this.options.collection.name) ? "" : parentName + "/";
        const iteration = cursor && cursor.cycles > 1 ? "/" + cursor.iteration : "";
        return this.escape(folderOrEmpty + item.name + iteration);
    }

    escape(string) {
        return string
            .replace(/['|\[\]]/g, '|$&')
            .replace('\n', '|n')
            .replace('\r', '|r')
            .replace(/[\u0100-\uffff]/g, (c) => `| 0x${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
    }
}

module.exports = PowerbiReporter 
