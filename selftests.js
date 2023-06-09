const tests={
  SimpleAdd:{
    prog:`push constant 7
push constant 8
add
`,
    addr:[0, 256],
    vals:[257,15],
    steps:3
  },

  StackTest:{
    prog:`
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

  FibonacciSeries:{
    prog:`push argument 1
pop pointer 1           // that = argument[1]
push constant 0
pop that 0              // first element in the series = 0
push constant 1
pop that 1              // second element in the series = 1
push argument 0
push constant 2
sub
pop argument 0          // num_of_elements -= 2 (first 2 elements are set)
label MAIN_LOOP_START
push argument 0
if-goto COMPUTE_ELEMENT // if num_of_elements > 0, goto COMPUTE_ELEMENT
goto END_PROGRAM        // otherwise, goto END_PROGRAM
label COMPUTE_ELEMENT
push that 0
push that 1
add
pop that 2              // that[2] = that[0] + that[1]
push pointer 1
push constant 1
add
pop pointer 1           // that += 1
push argument 0
push constant 1
sub
pop argument 0          // num_of_elements--
goto MAIN_LOOP_START
label END_PROGRAM
`,
    setup:()=>{RAM[0]=256; RAM[1]=300; RAM[2]=400; RAM[400]=6; RAM[401]=3000;},
    addr:[3000,3001,3002,3003,3004,3005],
    vals:[0,1,1,2,3,5],
    steps:73
  },

  SimpleFunction:{
    prog:`function SimpleFunction.test 2
push local 0
push local 1
add
not
push argument 0
add
push argument 1
sub
return
`,
    setup:()=>{RAM[0]=317;RAM[1]=317;RAM[2]=310;RAM[3]=3000;RAM[4]=4000;
               RAM[310]=1234;RAM[311]=37;
               RAM[312]=1000;RAM[313]=305;
               RAM[314]=300;RAM[315]=3010;
               RAM[316]=4010;},
    addr:[0,1,2,3,4,310],
    vals:[311,305,300,3010,4010,1196],
    steps:10
  },

  TempTest:{
    prog:`
push constant 3
push constant 4
push constant 5
pop temp 0
pop temp 1
push temp 1
push temp 1
add
pop temp 2
push constant 10
push constant 20
add
pop temp 3
`,
    addr:[5,6,7,8],
    vals:[5,4,8,30],
    steps:13
  },

  NestedCall:{
    prog:`
// Sys.vm for NestedCall test.
// call Sys.init 0 //bootstrap manually
// Sys.init()
// Calls Sys.main() and stores return value in temp 1.
// Does not return.  (Enters infinite loop.)
function Sys.init 0
push constant 4000  // test THIS and THAT context save
pop pointer 0
push constant 5000
pop pointer 1
call Sys.main 0
pop temp 1
label LOOP
goto LOOP

// Sys.main()
// Sets locals 1, 2 and 3, leaving locals 0 and 4 unchanged to test
// default local initialization to 0.  (RAM set to -1 by test setup.)
// Calls Sys.add12(123) and stores return value (135) in temp 0.
// Returns local 0 + local 1 + local 2 + local 3 + local 4 (456) to confirm
// that locals were not mangled by function call.
function Sys.main 5
push constant 4001
pop pointer 0
push constant 5001
pop pointer 1
push constant 200
pop local 1
push constant 40
pop local 2
push constant 6
pop local 3
push constant 123
call Sys.add12 1
pop temp 0
push local 0
push local 1
push local 2
push local 3
push local 4
add
add
add
add
return
end

// Sys.add12(int n) // Returns n+12.
function Sys.add12 0
push constant 4002
pop pointer 0
push constant 5002
pop pointer 1
push argument 0
push constant 12
add
return
end
`,
    setup:()=>{
      RAM[0]=261; RAM[1]=261; RAM[2]=256; RAM[3]=-3; RAM[4]=-4;
      RAM[5]=-1; RAM[6]=-1; // test results
      RAM[256]=1234; // fake stack frame from call Sys.init
      RAM[257]=-1; RAM[258]=-2; RAM[259]=-3; RAM[260]=-4;
      for(let i=261;i<300;i++){RAM[i]=-1;}
      RAM[sp.this]=3000
      RAM[sp.that]=4000
    },
    addr:[  0,  1,  2,   3,   4,  5,  6],
    vals:[261,261,256,4000,5000,135,246],
    steps:50,
  },

};
