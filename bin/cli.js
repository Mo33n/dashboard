#!/usr/bin/env node

// Netbeast app tool suite
// By jesus, NetBeast CTO
// jesus@netbeast.co
// ====================

require('../lib/init')

var path = require('path')
var cli = require('commander')
var fs = require('fs-extra')
var didYouMean = require('didyoumean')

var App = require('../lib/app')
var scan = require('../lib/scan')
var install = require('../lib/install')
var start = require('../lib/start')
var uninstall = require('../lib/uninstall')
var stop = require('../lib/stop')
var restart = require('../lib/restart')
var launch = require('../lib/launch')
var _pkg = require('../lib/pkg')

const ACTIONS_LIST = ['new', 'create', 'package', 'unpackage', 'unpkg',
'publish', 'scan', 'install', 'forget', 'start', 'uninstall', 'stop', 'restart',
 'launch', 'pkg']

var pkg = require('../package.json')

cli.version(pkg.version)

// Init nconf file
var nconf_path = path.join(__dirname, '.nconf')
if (!fs.existsSync(nconf_path)) {
  fs.writeJsonSync(nconf_path, {})
}

cli.command('new <app>').alias('create')
.description('Create the basic app structure')
.option('--plugin', 'Create the basic plugin struture (no App)')
.action(App.create)

cli.command('package [app]').alias('pkg')
.option('-o, --to <path>', 'Output file name')
.description('Compress your app as tar.gz')
.action(_pkg)

cli.command('unpackage [app]').alias('unpkg')
.option('-o, --to <path>', 'Output dir name')
.description('Uncompress your app from tar.gz')
.action(App.unpackage)

// cli.command('publish <file>')
// .description("Upload your app to the netbeast's repos")
// .action(publish)

cli.command('scan').alias('discover')
.description('Find available Netbeasts in range and shows their IP')
.action(scan)

cli.command('install <file> [host]')
.description('Upload an app to a Netbeast remotely')
.action(install)

cli.command('forget')
.description('Reset netbeast-cli configuration')
.action(function () {
  fs.removeSync(__dirname + '/.nconf')
})

cli.command('start')
.description('Launches netbeast dashboard')
.option('--silent', 'Capture dashboard output on console')
.option('-p, --port <n>', 'Port to start the HTTP server', parseInt)
.action(start)

cli.command('uninstall <app name>')
.description('Uninstall an app')
.action(uninstall)

cli.command('stop <app name>')
.description('Stops a running app')
.action(stop)

cli.command('restart <app name>')
.description('Restarts a running app')
.action(restart)

cli.command('launch <app name>')
.description('Launches an installed app')
.action(launch)

cli.parse(process.argv)

// No command specified or unrecognaized command
if (cli.args.length === 0) {
  cli.help()
} else if (ACTIONS_LIST.indexOf(process.argv[2]) === -1) {
  didYouMean.threshold = null
  var matched = didYouMean(process.argv[2], ACTIONS_LIST)
  if (matched != null) {
    console.log('\n\tDid you mean "' + didYouMean(process.argv[2], ACTIONS_LIST) + '"?')
    console.log('\n\tType "beast ' + matched + ' -h" to know its parameters' + '\n')
  } else {
    cli.help()
  }
}
