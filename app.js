const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');

let currentInputState = 'typing'; // 'typing', 'incorrect', 'correct'
let typingBuffer = '';
let inputLocked = false;
let correctHistory = [];
let score = 0;
let visibleScore = 0;
let wordlist = [];
let loaded = false;
let letterBag = "eeeeeeeeeeeeaaaaaaaaaiiiiiiiiioooooooonnnnnnrrrrrrttttttllllssssuuuuddddgggbbccmmppkjxqz";
let letterStack = [];

loadWordlist();
setupStack();
render();



function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);

    for ( let i in typingBuffer ) {
        drawTile(typingBuffer[i], i, 0, currentInputState);
    }

    for ( let w in correctHistory ) {
        let word = correctHistory[w];

        for ( let i in word ) {
            drawTile(word[i], i, (1*w)+1, 'typing');
        }
    }

    drawScore();

    drawStack();

    window.requestAnimationFrame(render);
}


window.addEventListener('keydown', typeLetter);

function typeLetter(e) {
    if ( inputLocked || ! loaded ) {
        return;
    }

    const key = e.key;

    if ( key == 'Enter' ) {
        validateWord();
        return;
    }

    if ( key == 'Backspace' ) {
        typingBuffer = typingBuffer.slice(0, -1);
        return;
    }

    if ( key.match(/^[a-zA-Z]$/) ) {
        typingBuffer += e.key.toLowerCase();
        return;
    }
}

function loadWordlist() {
    const request = new Request("wordlist.txt");

    window.fetch(request)
        .then( (response) => response.text())
        .then( (text) => {
            let words = text.split("\n");

            for ( let i in words ) {
                let word = words[i];
                wordlist.push( word.toLowerCase() );
            }

            loaded = true;
        });
}

function validateWord() {
    const word = typingBuffer;

    if ( ! word.length ) {
        incorrect();
        return;
    }

    // using letter not in stack
    let tempStack = [...letterStack];
    for ( let i in word) {
        let letter = word[i];
        let index = tempStack.indexOf(letter);

        if (index == -1) {
            incorrect();
            return;
        }

        delete tempStack[index];
    }

    // already used this word
    if ( correctHistory.indexOf(word) !== -1 ) {
        incorrect();
        return
    }

    // correct word
    if ( wordlist.indexOf(word) !== -1 ) {
        correct();
        return;
    }

    incorrect();


    
}

function correct() {
    currentInputState = 'correct';

    inputLocked = true;

    setTimeout( () => {
        removeBufferLettersFromStack();
        pushBufferToHistory();
        setupStack();
        unlock();
    }, 500);
}

function incorrect() {
    currentInputState = 'incorrect';

    inputLocked = true;

    setTimeout(unlock, 500);
}

function removeBufferLettersFromStack() {
    console.log(letterStack);
    for ( let i in typingBuffer ) {
        let letter = typingBuffer[i];
        
        for ( let j in letterStack ) {
            let stackLetter = letterStack[j];
            
            if ( letter == stackLetter ) {
                delete letterStack[j];
                break;
            }
        }
    }
    
    letterStack = letterStack.filter( n => n );
    console.log(letterStack);
}

function pushBufferToHistory() {
    correctHistory.unshift(typingBuffer);

    addPoints(typingBuffer);
}

function addPoints(word) {
    const pointsForLetter = {
        "a": 1,
        "e": 1,
        "i": 1,
        "l": 1,
        "n": 1,
        "o": 1,
        "r": 1,
        "s": 1,
        "t": 1,
        "u": 1,
        
        "d": 2,
        "g": 2,

        "b": 3,
        "c": 3,
        "m": 3,
        "p": 3,

        "f": 4,
        "h": 4,
        "v": 4,
        "w": 4,
        "y": 4,

        "k": 5,
        
        "j": 8,
        "x": 8,

        "q": 10,
        "z": 10
    }

    let pointsForWord = 0;

    for (let i in word) {
        let letter = word[i];

        pointsForWord += pointsForLetter[letter];
    }

    score += pointsForWord;
}

function updateVisibleScore() {
    if ( visibleScore < score ) {
        visibleScore++;
    }
}

setInterval(updateVisibleScore, 100);

function drawScore() {
    context.fillStyle = 'black';
    context.font = 'bold 64px serif';
    context.fillText("Score: " + visibleScore, 10, canvas.height - 10);
}

function drawStack() {
    context.fillStyle = 'black';
    context.font = 'bold 64px serif';
    context.fillText("Stack: " + letterStack.join(", "), 500, canvas.height - 10);
}

function unlock() {
    currentInputState = 'typing';
    typingBuffer = '';
    inputLocked = false;
}

function drawTile( letter, index, row, style ) {
    const offsetX = 8 + index * (64+8);
    const offsetY = 8 + row * (64+8);
    const tileWidth = 64;


    // console.log(letter, offsetY, row);
    
    let strokeStyle = 'orange';
    let fillStyle = 'yellow';
    
    if ( style == 'correct' ) {
        strokeStyle = 'green';
        fillStyle = 'green';
    } else if ( style == 'incorrect' ) {
        strokeStyle = 'red';
        fillStyle = 'red';
    }
    
    // draw the tile
    context.strokeStyle = strokeStyle;
    context.fillStyle = fillStyle;
    context.beginPath();
    context.roundRect(offsetX,offsetY,tileWidth,tileWidth,8);
    context.fill();
    context.stroke();


    // draw the text
    context.fillStyle = 'black';
    context.font = 'bold 64px serif';
    const letterWidth = context.measureText(letter).width;
    context.fillText(letter, offsetX + tileWidth / 2 - letterWidth / 2, offsetY + 48 );
    

    // console.log(letterWidth);


    
    // console.log(letter, offsetX, tileWidth / 2, letterWidth / 2);
}

function setupStack() {
    const bag = letterBag.split("");
    const count = 7;

    shuffle(bag);

    while( letterStack.length < 7 && bag.length ) {
        letterStack.push(bag.pop());
    }

    letterBag = bag.join("");
}

function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  }
