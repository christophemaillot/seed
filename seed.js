#!/usr/bin/env node

var colors = require('colors')
var child_process = require('child_process')
var ejs = require('ejs')
var _  = require('underscore')

var helper = require('./helper')

exports.options = {
    'user':'root',
    'hosts':[]
}

/**
 * 
 * @param {String} cmd a local command to execute 
 */
exports.local = function(cmd) {
    helper.log("local", "executing : " + cmd)
    var result = child_process.spawnSync(cmd, [], {shell:true})
    console.log("local", result.output.join("\n"))
}

/**
 * 
 * @param {String} cmd a command that will be executed on the remote servers
 */
exports.remote = async function(cmd) {

    target = exports.options.hosts

    let retcodes = []

    for (var i = 0; i < target.length; i++) {
        var host = target[i]
        helper.log(host, "executing command : " + cmd)
        retcodes.push(await helper.execute_via_ssh(exports.options.user, host, cmd))
    }

    if (retcodes.length == 0) {
        return 0
    } else if (retcodes.length == 1) {
        return retcodes[0]
    } else {
        return retcodes.reduce( (acc, val) =>  { if (val !=0) -1; else acc; })
    }
}

/**
 * Execute a command to a remote server and capture (and return) the output.
 * 
 * @param {String} cmd a command to be executed on the remote servers
 */
exports.capture = async function(cmd) {
    target = exports.options.hosts

    let content = []

    for (var i = 0; i < target.length; i++) {
        var host = target[i]
        helper.log(host, "executing command : " + cmd)
        content.push(await helper.capture_via_ssh(exports.options.user, host, cmd))
    }

    return content
}

/**
 * Execute the given nodejs callback synchroneously for each remote servers.
 * 
 * @param {*} script a nodejs callback
 */
exports.script = async function(script) {
    for (var i=0; i < exports.options.hosts.length; i++) {
        let host = exports.options.hosts[i]
        helper.log(host, "executing script")
        await script(host)
    }
}

exports.log = function(msg) {
    helper.log('info', msg)
}

exports.putString = async function(content, dest, host = null) {
    var target = []
    if (host == null) {
        target = exports.options.hosts
    } else {
        target = [host]
    }

    let retcodes = []

    for (var i = 0; i < target.length; i++) {
        var host = target[i]
        helper.log(host, "putting content to " + dest)
        retcodes.push(await helper.scp_put_string_ssh(exports.options.user, host, content, dest))
    }

    if (retcodes.length == 0) {
        return 0
    } else if (retcodes.length == 1) {
        return retcodes[0]
    } else {
        return retcodes.reduce( (acc, val) =>  { if (val !=0) -1; else acc; })
    }
}

exports.put = async function(src, dest, host = null) {
    var target = []
    if (host == null) {
        target = exports.options.hosts
    } else {
        target = [host]
    }

    let retcodes = []

    for (var i = 0; i < target.length; i++) {
        var host = target[i]
        helper.log(host, "transfering from" + src + " to " + dest)
        retcodes.push(await helper.scp_put_file(exports.options.user, host, src, dest))
    }

    if (retcodes.length == 0) {
        return 0
    } else if (retcodes.length == 1) {
        return retcodes[0]
    } else {
        return retcodes.reduce( (acc, val) =>  { if (val !=0) -1; else acc; })
    }    
}

exports.asset = function(path) {
    return "./seed/assets/" + path
}

exports.template = async function(localTemplate, data, remotePath) {
    let content = await ejs.renderFile(localTemplate, data)
    await exports.putString(content, remotePath)
}