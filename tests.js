const tests={
  SimpleAdd:{
    prog:`
// Pushes and adds two constants.
 push constant 7
push constant 8
add
`,
    addr:[0, 256],
    vals:[257,15]
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
    vals:[266, -1,  0,  0,  0, -1,  0, -1,  0,  0,-91]
  }
};

function test(t){
  initRam(4000)
  const lines=t.prog.split(/\n/).map(parse).forEach(x=>run(x))
  for(let i in t.addr){
    const ri=RAM[t.addr[i]]
    if(ri!=t.vals[i]){
      return `RAM[${t.addr[i]}] == ${ri}, expected: ${t.vals[i]}`
    }
  }
  return false
}

for(let t in tests){
  initRam(0)
  const result=test(tests[t])
  if(result){
    print(`${t} FAIL: ${result}`);
    break;
  }
  print(`Test ${t} PASS`)
}
