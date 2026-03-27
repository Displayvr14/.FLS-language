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

        if (line.startsWith('console')) handleConsole(line, localVars);
        else if (line.startsWith('set ')) handleSet(line, localVars);
        else if (line.startsWith('if ')) i = handleIf(lines, i, localVars);
        else if (line.startsWith('while ')) i = handleWhile(lines, i, localVars);
        else if (line.startsWith('func ')) i = handleFunctionDef(lines, i);
        else if (line.startsWith('return ')) return evalExpr(line.substring(7), localVars);
        else if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\(.+\)$/)) callFunction(line, localVars);
        else if (line.startsWith('readFile(') || line.startsWith('writeFile(')) handleFS(line, localVars);
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

    if(value == 'true') value = "1";
    if(value == 'false') value = "0";

    if ((value.startsWith('"') && value.endsWith('"')) ||
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
    let condition = lines[i].substring(6).trim();
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
        interpret(lines, blockStart, endIndex, {...localVars});
    }

    return endIndex;
}

// ================= FUNCTIONS =================
function handleFunctionDef(lines, i) {
    const parts = lines[i].split(' ');
    const name = parts[1].split('(')[0];
    const args = parts[1].match(/\((.*?)\)/)[1].split(',').map(s=>s.trim()).filter(s=>s);

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
    const name = line.split('(')[0];
    const argsStr = line.match(/\((.*?)\)/)[1];
    const func = Functions[name];

    if (!func) return console.error("Function not found:", name);

    const argsVals = argsStr.split(',').map(a => evalExpr(a, parentVars));
    const localVars = {...parentVars};
    func.args.forEach((argName,i)=>{ localVars[argName]=argsVals[i]; });

    const ret = interpret(func.body, 0, func.body.length, localVars);
    if (ret !== undefined) return ret;
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
    const parts = inside.match(/(["'])(.*?)\1|([^"\s]+)/g);
    let result = '';

    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        if ((part.startsWith('"') && part.endsWith('"')) ||
            (part.startsWith("'") && part.endsWith("'"))) {
            result += part.slice(1,-1);
        } else if (part.match(/^[\d.]+$/)) result += part;
        else result += evaluateAccess(part, localVars);
    }

    return result;
}

// ================= ARRAY / OBJECT ACCESS =================
function evaluateAccess(expr, localVars={}) {
    // Replace variables first
    Object.keys(localVars).forEach(k => {
        expr = expr.replace(new RegExp(`\\b${k}\\b`, 'g'), JSON.stringify(localVars[k]));
    });

    Variables.forEach(v => {
        expr = expr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), JSON.stringify(v.value));
    });

    try {
        // Check if the expression is a function call
        const funcCallMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
        if (funcCallMatch) {
            const fname = funcCallMatch[1];
            const argsStr = funcCallMatch[2];
            const func = Functions[fname];
            if (!func) throw new Error("Function not found: " + fname);

            const argsVals = argsStr.split(',').map(a => evalExpr(a.trim(), localVars));
            const localScope = {...localVars};
            func.args.forEach((argName, i) => { localScope[argName] = argsVals[i]; });
            return interpret(func.body, 0, func.body.length, localScope);
        }

        // Otherwise, evaluate normally (numbers, arrays, objects, math)
        return JSON.parse(JSON.stringify(eval(expr)));
    } catch(e) {
        console.error("Error evaluating:", expr);
        return 0;
    }
}

// ================= EXPRESSION ENGINE =================
function evalExpr(expr, localVars={}) {
    return evaluateAccess(expr, localVars);
}

// ================= FILE SYSTEM =================
function handleFS(line, localVars) {
    if (line.startsWith('readFile(')) {
        const file = getParenContent(line, localVars);
        localVars['fileContent'] = fs.readFileSync(file, 'utf-8');
    } else if (line.startsWith('writeFile(')) {
        const [file, content] = line.match(/\((.*?),(.*?)\)/).slice(1,3).map(s=>s.trim());
        fs.writeFileSync(file.replace(/['"]/g,''), getVar(content, localVars));
    }
}