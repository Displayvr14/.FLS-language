const fs = require('fs');
const path = require('path');

// ================= GLOBALS =================
let Variables = [];
let Functions = {};

// ================= CLASSES =================
class Variable {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

// ================= LOAD =================
const fileName = process.argv[2];
if (!fileName) {
    console.error("Usage: node interpreter.js file.fls");
    process.exit(1);
}
const filePath = path.join(__dirname, fileName);
const code = fs.readFileSync(filePath, 'utf-8');

interpret(code.split('\n'));

// ================= INTERPRETER =================
function interpret(lines, start = 0, end = lines.length, localVars = {}) {
    for (let i = start; i < end; i++) {
        let line = lines[i].trim();
        if (line === '' || line.startsWith('//')) continue;

        // Handle FS statements first
        if (line.startsWith('readFile(') || line.startsWith('writeFile(')) {
            handleFS(line, localVars);
        }
        else if (line.startsWith('console')) handleConsole(line, localVars);
        else if (line.startsWith('set ')) handleSet(line, localVars);
        else if (line.startsWith('if ')) i = handleIf(lines, i, localVars);
        else if (line.startsWith('while ')) i = handleWhile(lines, i, localVars);
        else if (line.startsWith('func ')) i = handleFunctionDef(lines, i);
        else if (line.startsWith('return ')) return evalExpr(line.substring(7), localVars);
        else if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\(.+\)$/)) callFunction(line, localVars);
    }
}

// ================= CONSOLE =================
function handleConsole(line, localVars) {
    const data = getParenContent(line, localVars);
    if (data !== null) console.log(data);
}

// ================= SET =================
function handleSet(line, localVars) {
    const [left, right] = line.split('=');
    const name = left.replace('set','').trim();
    let value = right.trim();

    if(value === 'true') value = true;
    else if(value === 'false') value = false;
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1,-1);
    } else {
        value = evalExpr(value, localVars);
    }

    localVars[name] = value;
    setVar(name, value);
}

// ================= IF =================
function handleIf(lines, i, localVars) {
    const condition = lines[i].substring(3).trim();
    const result = evalExpr(condition, localVars);

    let blockStart = i + 1;
    let elseIndex = -1;
    let endIndex = -1;

    for (let j = blockStart; j < lines.length; j++) {
        const l = lines[j].trim();
        if (l === 'else') elseIndex = j;
        if (l === 'end') { endIndex = j; break; }
    }
    if(endIndex === -1) {
        console.error("Syntax Error: 'if' without matching 'end'");
        return lines.length;
    }

    if (result) interpret(lines, blockStart, elseIndex === -1 ? endIndex : elseIndex, {...localVars});
    else if (elseIndex !== -1) interpret(lines, elseIndex + 1, endIndex, {...localVars});

    return endIndex;
}

// ================= WHILE =================
function handleWhile(lines, i, localVars) {
    const condition = lines[i].substring(6).trim();
    let blockStart = i + 1;
    let endIndex = -1;

    for (let j = blockStart; j < lines.length; j++) {
        if (lines[j].trim() === 'end') { endIndex = j; break; }
    }
    if(endIndex === -1) {
        console.error("Syntax Error: 'while' without matching 'end'");
        return lines.length;
    }

    while (evalExpr(condition, localVars)) {
        interpret(lines, blockStart, endIndex, localVars);
    }

    return endIndex;
}

// ================= FUNCTIONS =================
function handleFunctionDef(lines, i) {
    const parts = lines[i].split(' ');
    const name = parts[1].split('(')[0];
    const args = parseArgs(parts[1].match(/\((.*?)\)/)[1]);

    let blockStart = i + 1;
    let endIndex = -1;
    for (let j = blockStart; j < lines.length; j++) {
        if (lines[j].trim() === 'end') { endIndex = j; break; }
    }
    if(endIndex === -1) {
        console.error("Syntax Error: 'func' without matching 'end' at line " + (i+1));
        return lines.length;
    }

    Functions[name] = { args, body: lines.slice(blockStart, endIndex) };
    return endIndex;
}

function callFunction(line, parentVars) {
    const funcMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
    if (!funcMatch) return;
    const name = funcMatch[1];
    const argsStr = funcMatch[2];
    const func = Functions[name];

    if (!func) return console.error("Function not found:", name);

    const argsVals = parseArgs(argsStr).map(a => evalExpr(a, parentVars));
    const localVars = {...parentVars};
    func.args.forEach((argName,i)=>{ localVars[argName]=argsVals[i]; });

    return interpret(func.body, 0, func.body.length, localVars);
}

// ================= VARIABLES =================
function setVar(name,value) {
    const v = Variables.find(v=>v.name===name);
    if (v) v.value = value;
    else Variables.push(new Variable(name,value));
}

function getVar(name, localVars={}) {
    if (name in localVars) return localVars[name];
    const v = Variables.find(v=>v.name===name);
    return v ? v.value : 0;
}

// ================= PAREN CONTENT =================
function getParenContent(line, localVars) {
    const inside = line.substring(line.indexOf('(')+1, line.lastIndexOf(')')).trim();
    const parts = parseArgs(inside);
    let result = '';
    for (let part of parts) {
        if ((part.startsWith('"') && part.endsWith('"')) ||
            (part.startsWith("'") && part.endsWith("'"))) {
            result += part.slice(1,-1);
        } else if (!isNaN(part)) result += part;
        else result += getVar(part, localVars);
    }
    return result;
}

// ================= ARG PARSING =================
function parseArgs(argStr) {
    let args = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    for (let i=0;i<argStr.length;i++) {
        const c = argStr[i];
        if ((c === '"' || c === "'")) {
            if (inQuote && c === quoteChar) { inQuote=false; current+=c; }
            else if (!inQuote) { inQuote=true; quoteChar=c; current+=c; }
            else current+=c;
        } else if (c === ',' && !inQuote) {
            args.push(current.trim()); current=''; 
        } else current+=c;
    }
    if(current.trim()!=='') args.push(current.trim());
    return args;
}

// ================= ARRAY / OBJECT ACCESS =================
function evalExpr(expr, localVars={}) {
    expr = expr.trim();
    if(expr==='true') return true;
    if(expr==='false') return false;
    if(!isNaN(expr)) return Number(expr);

    // Handle function calls inside expressions
    const funcMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
    if (funcMatch) {
        const name = funcMatch[1];
        const argsStr = funcMatch[2];
        const func = Functions[name];
        if(!func) throw new Error("Function not found: "+name);
        const localScope = {};
        parseArgs(argsStr).forEach((a,i)=>{ localScope[func.args[i]]=evalExpr(a, localVars); });
        return interpret(func.body, 0, func.body.length, localScope);
    }

    // Replace variables
    Object.keys(localVars).forEach(k=>{
        expr = expr.replace(new RegExp(`\\b${k}\\b`, 'g'), JSON.stringify(localVars[k]));
    });
    Variables.forEach(v=>{
        expr = expr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), JSON.stringify(v.value));
    });

    // Evaluate simple JS expression
    try { return eval(expr); } 
    catch(e) { return 0; }
}

// ================= FILE SYSTEM =================
function handleFS(line, localVars) {
    if(line.startsWith('readFile(')) {
        const file = getParenContent(line, localVars);
        localVars['fileContent'] = fs.readFileSync(file, 'utf-8');
    } else if(line.startsWith('writeFile(')) {
        const args = parseArgs(line.substring(line.indexOf('(')+1, line.lastIndexOf(')')));
        const file = args[0].replace(/['"]/g,'');
        const content = args[1];
        fs.writeFileSync(file, getVar(content, localVars).toString());
    }
}