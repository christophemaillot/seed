#!/usr/bin/env node --harmony

const fs = require('fs')
const path = require('path')
const program = require('commander');

program
    .version('0.1.0')
    .option("-h --hosts [hosts]", "override the list of hosts to connect to")
    .option("-f --file [file]",  "location of the seed file (default is seed/seedfile.js)", "seed/seedfile.js")
    .parse(process.argv)

var tasks = program.args

if (program.file.startsWith("/")) {
    var fullpath = program.file
} else {
    var fullpath = path.join(process.cwd(), program.file)
}

if (fs.existsSync(fullpath)) {

    require('app-module-path').addPath(__dirname)

    var module = require(fullpath)

    var all = async function() {
        for (i in tasks) {
            var task = tasks[i]
            try {
                await module[task]()
            } catch (e) {
                console.error(e)
            }
        }
        process.exit(0)
    }
    all()
} else {
    console.log("ERROR : seed file not found at %s", program.file)
}