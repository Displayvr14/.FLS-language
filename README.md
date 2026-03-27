# FLS Language

**FLS** is a lightweight, interpreted programming language designed for experimentation and scripting. It is **functional and simple**, focusing on core features rather than performance or advanced paradigms. Originally created for a personal game project, it can also serve as a learning tool for building your own language.

> ⚠️ Note: FLS is intended for educational purposes and experimentation, not production use.

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/fls-language.git
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
if x > 10
    console.text("x is greater than 10")
else
    console.text("x is 10 or less")
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
