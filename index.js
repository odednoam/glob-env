var glob = require('glob');
var Q = require('q');
var exec = require('child_process').exec;

var options = {
    parallel: true,
    collateOutput: true,
    replaceEnvInCmdLine: true
};

var clone = function(dict) {return JSON.parse(JSON.stringify(dict))};

var globbedVariables = {};
var execCommand = [];

var PARSER_STATE_GLOB_ARGS = 0;
var PARSER_STATE_EXEC_ARGS = 1;

var argumentParserState = PARSER_STATE_GLOB_ARGS;

for (var i=2; i<process.argv.length; ++i) {
    var arg = process.argv[i];
    if (argumentParserState == PARSER_STATE_EXEC_ARGS) {
        execCommand.push(arg);
    }
    else if (arg === '--') {
        argumentParserState = PARSER_STATE_EXEC_ARGS;
    }
    else if (arg.startsWith('--parallel-run')) {
        options.parallel = true;
    }
    else if (arg.startsWith('--sequential-run')) {
        options.sequential = true;
    }
    else if (arg.startsWith('--dontCollateOutput')) {
        options.collateOutput = false;
    }
    else if (arg.startsWith('--dontReplace')) {
        options.replaceEnvInCmdLine = false;
    }
    else if (arg.indexOf('=')<0) {
        execCommand.push(arg);
        argumentParserState = PARSER_STATE_EXEC_ARGS;    
    }
    else {
        var equalSignPos = arg.indexOf('=');
        globbedVariables[arg.substring(0,equalSignPos)] = arg.substring(equalSignPos+1);
    }
}

var executeSingle = function(execCommand, env) {
    var commandline = [];
    for (var i=0; i<execCommand.length; ++i) {
        var e = execCommand[i];
        if (options.replaceEnvInCmdLine) {
            e = e.replace(/\$(?:\b(.+?)\b|\{(.+?)\})/, function(fullmatch, match1, match2) {return env[match1||match2]});
        }
        commandline.push(e);
    }
    var cmdlineString = commandline.map(function(k) {return /\s/.test(k)?('\"'+k.replace(/\"/g, '\\\"')+'\"'):k}).join(" ");
    //console.log("Running", cmdlineString);
    return Q.nfcall(exec, cmdlineString, {env: env, silent: !options.collateOutput})
    .spread(function(stdout, stderr) {return [cmdlineString, stdout, stderr]});
}

var printOutput = function(cmdlineString, stdout, stderr) {
    stdout = (stdout||"").trim();
    if (stdout) console.log(stdout);
    stderr = (stderr ||"").trim();
    if (stderr) console.error(stderr);
}

var executionQueue = [];
var cb = function(stack, env) {
    var globVariable = stack[0];
    if (globVariable === undefined) {
        if (executionQueue.length && !options.parallel) {
            executionQueue[0].spread(printOutput);
        }
        else  {
            executionQueue.push(executeSingle(execCommand, env));
        }
        return Q();
    }
    else {
        return Q.nfcall(glob, globbedVariables[globVariable]).then(function(files) {
            var promises = [];
            for (var j=0; j<files.length; ++j) {
                var execEnv = clone(env);
                execEnv[globVariable] = files[j];
                promises.push(cb(stack.slice(1), execEnv));
            }
            return Q.all(promises);
        });
    }
}
cb(Object.keys(globbedVariables), {}).then(function() {
    Q.all(executionQueue).then(function(results) {
        for (var i=0; i<results.length; ++i) {
            printOutput.apply(null, results[i]);
        }
    }).done();
}).catch(function(e) {
    console.error(e);
    console.error(e.stack);
}).done();

