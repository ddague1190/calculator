
"use strict";

// Get access to your screen result and ledger sections

const result = document.querySelector('.result');
const ledger = document.querySelector('.ledger');

// Variables

let ledgerArray = [];
let ledgerValue = '';
let currentOperandHasDecimal = false;
let parentheticalProblem = false;
const operationTypes = ['÷', '+', '−', '×', '*', '/'];
const otherTypes = [')', '.', '%'];
const operations = {
    '/': (x,y) => x/y,
    '*': (x,y) => x*y,
    '+': (x,y) => x+y,
    '-': (x,y) => x-y,
    // 'x': (x,y) => x-y
}

// Gather parentheses buttons

const startParenthesis = document.getElementById('sym(');
const endParenthesis = document.getElementById('sym)');

// Clear button

document.querySelector('#symCE').addEventListener('click', ()=> {
    ledgerValue = ledgerValue.trim().slice(0,-1);
    updateLedger();
})

// Event listeners for operator buttons

const operatorNodes = document.querySelectorAll(".operator");

operatorNodes.forEach(operator => {
    operator.addEventListener('click', ()=> {
        let ledgerValueConcatentated = ledgerValue.split(' ').join('');
        let lastEntry = ledgerValueConcatentated.slice(-1);
        
        // check if lastEntry is number or a decimal
        if(!isNaN(parseInt(lastEntry)) || otherTypes.includes(lastEntry)) {

            // kluge to disallow consecutive percentage symbols
            if(operator.innerHTML=='%' && lastEntry == '%') return; 

            ledgerValue += ` ${operator.innerHTML} `;
            currentOperandHasDecimal = false;            
        }

        //if lastEntry is another operator, then change it out
        if(operationTypes.includes(lastEntry)) {
            ledgerValue = ledgerValue.slice(0,-3) + ` ${operator.innerHTML} `;
        }
        updateLedger();
    })
})

// Starting parentheses

const startParens = document.getElementById('sym(');

startParens.addEventListener('click', () => {
    let ledgerValueConcatentated = ledgerValue.split(' ').join('');
    let lastEntry = ledgerValueConcatentated.slice(-1);
    if (lastEntry == '' || lastEntry == '(' || operationTypes.includes(lastEntry)) {
        ledgerValue += ` ${startParens.innerHTML} `
        updateLedger();
    }
});

// Adding a period (like other operators but no space added to ledger)

    const period  = document.querySelector('.symPeriod');
    period.addEventListener('click', () => {
        let lastEntry = ledgerValue.slice(-1);
        
        
        if(!isNaN(parseInt(lastEntry)) && !currentOperandHasDecimal) {
            ledgerValue += `${period.innerHTML}`;
            currentOperandHasDecimal = true;
            updateLedger();
        }
    })

// Event listeners for numbers buttons

const numberNodes = document.querySelectorAll(".num");

numberNodes.forEach(number => {

    number.addEventListener('click', () => {

        const reg = /^[\d%]\s/;    
        if(reg.test(ledgerValue.slice(-2))) return;
        ledgerValue += number.innerHTML;
        updateLedger();
    }); 
})

// Utility function to update ledgerValue on each click

function updateLedger () {

    ledger.innerHTML = ledgerValue;
};

//Check if last value is operator 

function lastEntryIsOperator () {
    let ledgerValueConcatentated = ledgerValue.split(' ').join('');
    let lastEntry = ledgerValueConcatentated.slice(-1);
    
    if(operationTypes.includes(lastEntry)) {
        return true;
    };
    return false;
}
    
//Replace operators with those we can use in javascript directly;
function replaceOperators() {
    
    ledgerValue = ledgerValue.replace(/÷/g, '/').replace(/−/g, '-').replace(/×/g, '*').replace(/x/g, '*').replace(/\s{2,}/g, ' ');
};

// Convert ledger to array, convert strings to numbers (if applicable)

function makeLedgerArray() {
    ledgerArray = ledgerValue.trim().split(' ');

    ledgerArray.forEach((el, i) => {
        if(!isNaN(el)) {
            ledgerArray[i] = Number(el);
        };
    });
}

// If percentage follows number, divide the number by 100

function executePercentage() {
    ledgerArray.forEach((el, i) => {
        if(el=='%') {
            if(!isNaN(ledgerArray[i-1])) {
                ledgerArray.splice(i-1, 2, ledgerArray[i-1]/100);
            }
        }
    })
}

// Perform operations inside parenthesis first
function gatherIndecesOfParens () {
    let indecesOfParens = new Map();
    let start = '';
    let end = '';
    ledgerArray.forEach((el, i) => {
        if(el=='(') {
            start = i+1;
            let skip = 0;

            for(let j = i+1; j<ledgerArray.length; j++) {
                if(ledgerArray[j]=='(') {
                    skip++;
                }
                if(ledgerArray[j]==')') {
                    if(skip==0){
                        end = j;
                        break;
                    }
                    else {
                        skip--;
                    };
                }
            }
            
        }
        if(start && end) {
            indecesOfParens.set(start, end);
        };

        if(start && !end) {

            parentheticalProblem = true;
        }
        
        if(el==')' && !start) {

            parentheticalProblem = true;
        }
    })

    return [...indecesOfParens];
} 

//Sort parenthesis indeces list by the end parenthesis, so that we do the most internal parenthesis operations first

function sortedIndecesList() {
    const arr = gatherIndecesOfParens();
    const sortedArr = arr.sort((a, b) => {
        return a[1] - b[1];
      });
    return sortedArr;
}

function calculateParensInternals() {
    const arr = sortedIndecesList()[0];
    if(!arr) {
        return;
    }   
    let result = calc(ledgerArray.slice(...arr));
    ledgerArray.splice(arr[0]-1, arr[1]-arr[0]+2, result);
    return calculateParensInternals();
}

function calc(resultArray) {
    if(resultArray.length == 1)
        {   
            return resultArray[0];
        }
    resultArray = [operations[resultArray[1]](resultArray[0],resultArray[2]), ...resultArray.slice(3)];
    return calc(resultArray);
}

// Calculate result

const equals  = document.getElementById('symEquals');
equals.addEventListener('click', () => {
    parentheticalProblem = false;
    result.classList.remove('error');
    result.innerHTML = calculate();
})

function calculate() {
	if(lastEntryIsOperator()) {
        result.classList.add('error');
		return 'too many operators';
	}
	replaceOperators();
	makeLedgerArray();
	executePercentage();

	calculateParensInternals();
    if(parentheticalProblem) {
        result.classList.add('error');
        return 'missing parenthesis'
    }
	executePercentage();    
    let x = calc(ledgerArray)    
    return Math.round((x + Number.EPSILON) * 100) / 100;
}

