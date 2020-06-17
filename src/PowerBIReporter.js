'use strict'
const axios = require('axios')

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
        this.currentDate = Date.now()
        this.options = options;
        this.component = reporterOptions.component
        this.product = reporterOptions.product
        this.environment = reporterOptions.environment
        this.apiURL = reporterOptions.powerbiURL
        this.collectionName = options.collection.name
        this.testCollectionPassed = true

        const events = 'start beforeIteration iteration beforeItem item beforePrerequest prerequest beforeScript script beforeRequest request beforeTest test beforeAssertion assertion console exception beforeDone done'.split(' ');
        events.forEach((e) => { if (typeof this[e] == 'function') emitter.on(e, (err, args) => this[e](err, args)) });
    }

    start(err, args) {
        console.log(`Currently running ${this.collectionName}`);
    }
    beforeItem(err, args) {
        this.currItem = { name: this.itemName(args.item, args.cursor), passed: true, failedAssertions: [] };

        console.log(`[testStarted name='${this.currItem.name}' captureStandardOutput='true'`);
    }

    request(err, args) {
        console.log(args)
        if (!err) {
            console.log(`Running ${args.item.name}`);
            console.log(`Response time: ${args.response.responseTime}ms`)
            console.log(`Response size: ${args.response.responseSize}B`)
        }
        //     this.currItem.responseTime = args.response.responseTime;
        //     this.currItem.responseSize = args.response.responseSize;
        //     console.log(`Response time: ${this.currItem.responseTime}ms`)
        //     console.log(`Response size: ${this.currItem.responseSize}B`)
        // }
    }

    assertion(err, args) {
        if (err) {
            if (this.testCollectionPassed && !this.currItem.passed) {
                this.testCollectionPassed = false
            }
            console.log(`Item: ${JSON.stringify(this.currItem)}`)
        }
    }

    done(err, args) {
        console.log("Tests finished. Now preparing results file for PowerBI")
        // console.log(JSON.stringify(args))
        this.generateData()
    }

    generateData() {
        let passed = this.testCollectionPassed ? 1 : 0
        let endDate = Date.now()
        let duration = Math.abs((endDate - this.currentDate) / 1000)
        let dateObj = new Date(this.currentDate)
        let currentDateISO = dateObj.toISOString()
        const data = [{
            product: this.product,
            component: this.appName,
            environment: this.env,
            duration,
            success: passed,
            date: currentDateISO,
            false: 0,
            true: 1
        }]
        this.sendData(data)
    }

    async sendData(data) {
        try {
            await axios({
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                url: this.apiURL,
                data
            })
        } catch (error) {
            console.log(error)
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