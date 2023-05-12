const tests={
  SimpleAdd:{
    prog:`
// Pushes and adds two constants.
 push constant 7 //comments too
push constant 8
add
`,
    addr:[0, 256],
    vals:[257,15],
    steps:3
  },

  StackTest:{
    prog:`
// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/07/StackArithmetic/StackTest/StackTest.vm

// Executes a sequence of arithmetic and logical operations
// on the stack.
push constant 17
push constant 17
eq
push constant 17
push constant 16
eq
push constant 16
push constant 17
eq
push constant 892
push constant 891
lt
push constant 891
push constant 892
lt
push constant 891
push constant 891
lt
push constant 32767
push constant 32766
gt
push constant 32766
push constant 32767
gt
push constant 32766
push constant 32766
gt
push constant 57
push constant 31
push constant 53
add
push constant 112
sub
neg
and
push constant 82
or
not
`,
    addr:[0,  256,257,258,259,260,261,262,263,264,265],
    vals:[266, -1,  0,  0,  0, -1,  0, -1,  0,  0,-91],
    steps:38
  },

  BasicTest:{
    prog:`
push constant 10
pop local 0
push constant 21
push constant 22
pop argument 2
pop argument 1
push constant 36
pop this 6
push constant 42
push constant 45
pop that 5
pop that 2
push constant 510
pop temp 6
push local 0
push that 5
add
push argument 1
sub
push this 6
push this 6
add
sub
push temp 6
add
`,
    setup:()=>{RAM[ptr.local]=300;RAM[ptr.argument]=400;RAM[ptr.this]=3000;RAM[ptr.that]=3010},
    addr:[256,300,401,402,3006,3012,3015, 11],
    vals:[472, 10, 21, 22,  36,  42,  45,510],
    steps:25
  },

  PointerTest:{
    prog:`
// Executes pop and push commands using the
// pointer, this, and that segments.
push constant 3030
pop pointer 0
push constant 3040
pop pointer 1
push constant 32
pop this 2
push constant 46
pop that 6
push pointer 0
push pointer 1
add
push this 2
sub
push that 6
add
`,
    addr:[ 256,   3,   4,3032,3046],
    vals:[6084,3030,3040,  32,  46],
    steps:15
  },

  StaticTest:{
    prog:`// Executes pop and push commands using the static segment.
push constant 111
push constant 333
push constant 888
pop static 8
pop static 3
pop static 1
push static 3
push static 1
sub
push static 8
add
`,
    addr:[256],
    vals:[1110],
    steps:11
  },

  BasicLoop:{
    prog:`// Computes the sum 1 + 2 + ... + argument[0] and pushes the
// result onto the stack. Argument[0] is initialized by the test
// script before this code starts running.
push constant 0
pop local 0         // initializes sum = 0
label LOOP_START
push argument 0
push local 0
add
pop local 0         // sum = sum + counter
push argument 0
push constant 1
sub
pop argument 0      // counter--
push argument 0
if-goto LOOP_START  // If counter != 0, goto LOOP_START
push local 0
`,
    setup:()=>{RAM[0]=256;RAM[1]=300;RAM[2]=400;RAM[400]=3},
    addr:[0,256],
    vals:[257,6],
    steps:36
  },

};


function test(t){
  resetAll()
  initRam(4000)
  const parsed=parse(t.prog.split(/\n/))
  if('err'in parsed)return -1
  if('setup'in t) t.setup()
  const cmds=parsed.ok
  while(PC>=0 && t.steps-->0){
    let result=_eval(cmds[PC])
    if(result==undefined) PC+=1
    else PC=result
  }

  let pass=1
  for(let i in t.addr){
    const ri=RAM[t.addr[i]]
    if(ri!=t.vals[i]){
      pass&=0
      print(`RAM[${t.addr[i]}]==${ri}, expected: ${t.vals[i]}`)
    }
  }
  return pass
}

for(let t in tests){
  const result=test(tests[t])
  if(result) print(`${t} PASS`)
  else {print(`${t} FAIL`);break}
}
