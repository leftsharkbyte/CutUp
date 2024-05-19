document.getElementById('generateButton').addEventListener('click', generateCutUpText);
document.getElementById('saveButton').addEventListener('click', saveState);
document.getElementById('loadButton').addEventListener('click', () => document.getElementById('loadFile').click());
document.getElementById('loadFile').addEventListener('change', loadStateFromFile);
document.getElementById('clearButton').addEventListener('click', clearUnlockedFragments);
document.getElementById('canvasColor').addEventListener('input', updateCanvasColor);

const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
let zIndexCounter = 1; // Initialize z-index counter

function generateCutUpText() {
    const sourceText = document.getElementById('sourceText').value;
    const minWords = parseInt(document.getElementById('minWords').value);
    const maxWords = parseInt(document.getElementById('maxWords').value);
    const numFragments = parseInt(document.getElementById('numFragments').value);
    const minFontSize = parseInt(document.getElementById('minFontSize').value);
    const maxFontSize = parseInt(document.getElementById('maxFontSize').value);
    const boldChance = parseInt(document.getElementById('boldChance').value);
    const italicChance = parseInt(document.getElementById('italicChance').value);
    const invertChance = parseInt(document.getElementById('invertChance').value);
    const randomBgChance = parseInt(document.getElementById('randomBgChance').value);
    const rotateChance = parseInt(document.getElementById('rotateChance').value);
    const maxRotation = parseInt(document.getElementById('maxRotation').value);
    const output = document.getElementById('output');

    // Clear previous fragments but keep locked fragments
    const lockedFragments = Array.from(output.getElementsByClassName('locked'));
    output.innerHTML = '';
    lockedFragments.forEach(fragment => output.appendChild(fragment));

    // Split source text into words
    const words = sourceText.split(/\s+/);

    const maxStartIndex = words.length - minWords;
    const startIndices = [];

    for (let i = 0; i < numFragments; i++) {
        let startIndex;
        do {
            startIndex = getRandomInt(0, maxStartIndex);
        } while (startIndices.some(index => Math.abs(index - startIndex) < minWords));
        startIndices.push(startIndex);

        // Determine number of words for this fragment
        const numWords = getRandomInt(minWords, maxWords);
        const fragmentWords = words.slice(startIndex, startIndex + numWords);

        // Create fragment element
        const fragment = document.createElement('div');
        fragment.className = 'fragment';
        fragment.textContent = fragmentWords.join(' ');

        // Style fragment
        const fontSize = getRandomInt(minFontSize, maxFontSize);
        fragment.style.fontSize = fontSize + 'px';
        fragment.style.fontFamily = fonts[getRandomInt(0, fonts.length - 1)];
        if (Math.random() < boldChance / 100) fragment.style.fontWeight = 'bold';
        if (Math.random() < italicChance / 100) fragment.style.fontStyle = 'italic';

        let bgColor = 'white';
        let textColor = 'black';
        if (Math.random() < randomBgChance / 100) {
            bgColor = getRandomColor();
            if (isDarkColor(bgColor)) {
                textColor = 'white';
            }
        }
        if (Math.random() < invertChance / 100) {
            [bgColor, textColor] = [textColor, bgColor];
        }
        fragment.style.backgroundColor = bgColor;
        fragment.style.color = textColor;

        if (Math.random() < rotateChance / 100) {
            const rotation = getRandomInt(-maxRotation, maxRotation);
            fragment.style.transform = `rotate(${rotation}deg)`;
        }

        // Position fragment
        fragment.style.left = getRandomInt(0, output.clientWidth - 100) + 'px';
        fragment.style.top = getRandomInt(0, output.clientHeight - 50) + 'px';

        // Make fragment draggable
        fragment.addEventListener('pointerdown', onPointerDown);
        fragment.addEventListener('dblclick', onDoubleClick);

        // Append fragment to output
        output.appendChild(fragment);
    }
}

function updateCanvasColor() {
    const canvasColor = document.getElementById('canvasColor').value;
    document.getElementById('output').style.backgroundColor = canvasColor;
}

function onPointerDown(event) {
    const fragment = event.target;
    if (fragment.classList.contains('locked')) return; // Prevent dragging if locked

    const startX = event.clientX;
    const startY = event.clientY;
    const initialLeft = parseInt(fragment.style.left, 10);
    const initialTop = parseInt(fragment.style.top, 10);

    // Bring the fragment to the top
    zIndexCounter += 1;
    fragment.style.zIndex = zIndexCounter;

    function moveAt(pageX, pageY) {
        fragment.style.left = initialLeft + pageX - startX + 'px';
        fragment.style.top = initialTop + pageY - startY + 'px';
    }

    function onPointerMove(event) {
        moveAt(event.clientX, event.clientY);
    }

    function onPointerUp() {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

function onDoubleClick(event) {
    const fragment = event.target;
    fragment.classList.toggle('locked');
    if (fragment.classList.contains('locked')) {
        fragment.style.outline = `1px dotted ${fragment.style.color}`;
    } else {
        fragment.style.outline = 'none';
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function isDarkColor(color) {
    const rgb = parseInt(color.slice(1), 16); // Convert hex to RGB
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    // Use luminance formula to determine brightness
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140; // Adjust threshold as needed
}

function saveState() {
    const output = document.getElementById('output');
    const fragments = Array.from(output.children).map(fragment => ({
        text: fragment.textContent,
        fontSize: fragment.style.fontSize,
        fontFamily: fragment.style.fontFamily,
        fontWeight: fragment.style.fontWeight,
        fontStyle: fragment.style.fontStyle,
        backgroundColor: fragment.style.backgroundColor,
        color: fragment.style.color,
        transform: fragment.style.transform,
        left: fragment.style.left,
        top: fragment.style.top,
        zIndex: fragment.style.zIndex, // Save zIndex
        locked: fragment.classList.contains('locked')
    }));
    const state = {
        canvasColor: document.getElementById('canvasColor').value,
        fragments: fragments
    };
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = prompt('Enter file name', 'cut-up-state.json') || 'cut-up-state.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadStateFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const state = JSON.parse(e.target.result);
        loadState(state);
    };
    reader.readAsText(file);
}

function loadState(state) {
    if (!state) {
        alert('No saved state found!');
        return;
    }
    document.getElementById('canvasColor').value = state.canvasColor;
    document.getElementById('output').style.backgroundColor = state.canvasColor;

    const output = document.getElementById('output');
    output.innerHTML = '';

    state.fragments.forEach(data => {
        const fragment = document.createElement('div');
        fragment.className = 'fragment';
        fragment.textContent = data.text;
        fragment.style.fontSize = data.fontSize;
        fragment.style.fontFamily = data.fontFamily;
        fragment.style.fontWeight = data.fontWeight;
        fragment.style.fontStyle = data.fontStyle;
        fragment.style.backgroundColor = data.backgroundColor;
        fragment.style.color = data.color;
        fragment.style.transform = data.transform;
        fragment.style.left = data.left;
        fragment.style.top = data.top;
        fragment.style.zIndex = data.zIndex; // Load zIndex
        if (data.locked) {
            fragment.classList.add('locked');
            fragment.style.outline = `1px dotted ${fragment.style.color}`;
        }
        fragment.addEventListener('pointerdown', onPointerDown);
        fragment.addEventListener('dblclick', onDoubleClick);
        output.appendChild(fragment);
    });
}

function clearUnlockedFragments() {
    const output = document.getElementById('output');
    const unlockedFragments = Array.from(output.children).filter(fragment => !fragment.classList.contains('locked'));
    unlockedFragments.forEach(fragment => fragment.remove());
}
