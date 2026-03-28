# FLS Language

**FLS** is a lightweight, interpreted programming language designed for experimentation and scripting. It is **functional and simple**, focusing on core features rather than performance or advanced paradigms. Originally created for a personal game project, it can also serve as a learning tool for building your own language.

> ⚠️ Note: FLS is intended for educational purposes and experimentation, not production use.

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/Displayvr14/.FLS-language.git
cd fls-language
```
2. Install Node.js (v18+ recommended) if you don’t have it: [Download Node.js](https://nodejs.org/)
3. Run scripts using the interpreter
* Scripts must have the .fls extension.
```bash
node interpreter.js YourScript.fls
```
* The interpreter will process the file line by line and execute supported instructions.
## Language Features / Syntax Examples
### Variable
```fls
set x = 25
set name = "Alice"
```
### Console Output
```fls
console.text("Hello, World!" name x)
```
### Math & Expressions
```fls
set result = (5 + 3) * 2
```
### Boolean Logic & If Statements
```fls
set x = true
set y = false

if x && y
console.text("Hello, World!")
end

if x
console.text("X is true!")
end

if y
console.text("Y is true!")
end
```
### Loops
```fls
while x > 0
    console.text(x)
    set x = x - 1
end
```
### Functions
```fls
func add(a,b) 
    return a + b
end

console.text(add(1,2))
```
### Arrays
```fls
set arr = [1, 2, 3]

console.text(arr[0])
console.text(arr[1])
console.text(arr[2])
```
### Reading/Writing Files
```fls
# Reading
readFile("file.txt")
set file = fileContent
console.text(file)

# Writing
set message = "Hello, FLS World!"
writeFile("output.txt", message)
```
### String Methods
```fls
set str = "  hello, world! welcome to fls.  "

# Trim whitespace
set trimmed = str.trim()
console.text("Trimmed: "trimmed)

# Uppercase / Lowercase
set upper = trimmed.toUpperCase()
console.text("Uppercase: "upper)

set lower = trimmed.toLowerCase()
console.text("Lowercase: "lower)

# Replace text
set replaced = trimmed.replace("fls", "FLS Language")
console.text("Replaced: "replaced)

# Split string
set parts = trimmed.split(" ")
console.text("First word: "parts[0])
console.text("Second word: "parts[1])

# Slice / Substring
set slice1 = trimmed.slice(0,5)
console.text("Slice(0,5): "slice1)

set substring1 = trimmed.substring(7,12)
console.text("Substring(7,12): "substring1)

# IndexOf / LastIndexOf
set idx = trimmed.indexOf("world")
console.text("Index of 'world': "idx)

set lastIdx = trimmed.lastIndexOf("o")
console.text("Last index of 'o': "lastIdx)

# StartsWith / EndsWith
set starts = trimmed.startsWith("hello")
console.text("Starts with 'hello': "starts)

set ends = trimmed.endsWith("fls.")
console.text("Ends with 'fls.': "ends)

# Includes
set hasWelcome = trimmed.includes("welcome")
console.text("Includes 'welcome': "hasWelcome)

# CharAt / CharCodeAt
set char1 = trimmed.charAt(1)
console.text("Char at 1: "char1)

set code1 = trimmed.charCodeAt(1)
console.text("Char code at 1: "code1)

# Concatenation
set concatStr = trimmed.concat(" Enjoy learning!")
console.text("Concatenated: "concatStr)

# Repeat
set repeatStr = "ha!".repeat(3)
console.text("Repeat: "repeatStr)

# PadStart / PadEnd
set paddedStart = "5".padStart(3, "0")
set paddedEnd = "5".padEnd(3, "0")
console.text("PadStart: "paddedStart)
console.text("PadEnd: "paddedEnd)

# Split and access
set words = trimmed.split(" ")
console.text("All words: "words)
console.text("Third word: "words[2])
```
