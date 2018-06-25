const colors = require('colors')
const SSHClient = require('ssh2').Client
const scp2 = require('scp2')
const SCPClient = scp2.Client

function OutputBuffer(prefix) {
    this.prefix = prefix
    this.buffer = ""
    this.content = ""

    this.append = function(data) {
        data = data.toString()
        this.buffer = this.buffer + data.toString()

        while (this.buffer.includes('\n')) {
            let pos = this.buffer.indexOf('\n')
            let line = this.buffer.substr(0, pos)
            let leftover = this.buffer.substr(pos + 1)
            this.buffer = leftover
            console.log(prefix + colors.grey(line))
        }
    }

    this.end = function() {
        if (this.buffer.length > 0) {
            console.log(prefix + colors.grey(buffer))
        }
    }
}

exports.log = function(category, msg) {
    var d =  "[" + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + "]"
    console.log(d.white, colors.blue("[" + category + "]"), msg.green)
}

exports.timeout = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.execute_via_ssh = function (username, host, command) {
    return new Promise(function(fullfill, reject) {
        var conn = new SSHClient();

        var stdoutBuffer = new OutputBuffer("    | ".green)
        var stderrBuffer = new OutputBuffer("    | ".red)
        
        conn.on('ready', function() {
            conn.exec(command, function(err, stream) {
                if (err) 
                    reject(err)
                stream.on('close', function(code, signal) {
                    conn.end();
                    stdoutBuffer.end()
                    stderrBuffer.end()
                    fullfill(code)
                }).on('data', function(data) {  
                    stdoutBuffer.append(data)
                }).stderr.on('data', function(data) {
                    stderrBuffer.append(data)
                });
            });
        }).connect({
            host: host,
            username: username,
            port: 22,
            agent: process.env.SSH_AUTH_SOCK
        });    
    })
}

exports.capture_via_ssh = function (username, host, command) {
    return new Promise(function(fullfill, reject) {
        var conn = new SSHClient();

        var stdout = ""
        var stderr = ""
        
        conn.on('ready', function() {
            conn.exec(command, function(err, stream) {
                if (err) 
                    reject(err)
                stream.on('close', function(code, signal) {
                    fullfill({out:stdout, err:stderr, host:host})
                }).on('data', function(data) {  
                    stdout = stdout + data
                }).stderr.on('data', function(data) {
                    stderr = stderr + data
                });
            });
        }).connect({
            host: host,
            username: username,
            port: 22,
            agent: process.env.SSH_AUTH_SOCK
        });    
    })
}


exports.scp_put_string_ssh = function(username, host, content, destination) {
    return new Promise(function(fullfill, reject) {
        var buffer = Buffer.from(content, 'utf8')
        var client = new SCPClient({
            host: host,
            username: username,
            port: 22,
            agent: process.env.SSH_AUTH_SOCK
        });    

        client.on('write', function() {
            fullfill()
        })

        client.write({
            destination: destination,
            content: buffer
        }, function(err) {
            if (err) {
                reject(err)
            } else {
                fullfill()
            }
        })

    })
}

exports.scp_put_file = function(username, host, source, destination) {
    return new Promise(function(fullfill, reject) {
        scp2.scp(source,
            {
                host: host,
                username: username,
                port: 22,
                agent: process.env.SSH_AUTH_SOCK,
                path: destination
        }, function(err) {
            if (err) {
                reject(err)
            } else {
                fullfill()
            }
        });    
    })
}