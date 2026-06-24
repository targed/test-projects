document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const gameSelect = document.getElementById('game-select');
    const modal = document.getElementById('clue-modal');
    const closeBtn = document.querySelector('.close');
    const modalCategory = document.getElementById('modal-category');
    const modalValue = document.getElementById('modal-value');
    const modalClue = document.getElementById('modal-clue');
    const modalAnswer = document.getElementById('modal-answer');
    const showAnswerBtn = document.getElementById('show-answer-btn');

    let currentBox = null;
    let gamesData = [];

    // Fetch JSON data
    fetch('jeopardy_data.json')
        .then(response => response.json())
        .then(data => {
            gamesData = data.games;

            // Populate selector
            gamesData.forEach((game, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${game.tournament} - Game ${index + 1}`;
                gameSelect.appendChild(option);
            });

            // Render first game
            if (gamesData.length > 0) {
                renderBoard(gamesData[0].categories);
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
            boardElement.innerHTML = '<p>Error loading game data. Make sure to run the scraper and open this through a local server.</p>';
        });

    gameSelect.addEventListener('change', (e) => {
        const gameIndex = e.target.value;
        if (gamesData[gameIndex]) {
            renderBoard(gamesData[gameIndex].categories);
        }
    });

    function renderBoard(categories) {
        boardElement.innerHTML = ''; // Clear previous

        categories.forEach(category => {
            const col = document.createElement('div');
            col.className = 'category-column';

            const header = document.createElement('div');
            header.className = 'category-name';
            header.textContent = category.name;
            col.appendChild(header);

            category.clues.forEach(clue => {
                const box = document.createElement('div');
                box.className = 'clue-box';
                box.textContent = clue.value;

                box.addEventListener('click', () => {
                    if (!box.classList.contains('played')) {
                        openModal(category.name, clue, box);
                    }
                });

                col.appendChild(box);
            });

            boardElement.appendChild(col);
        });
    }

    function openModal(categoryName, clueObj, boxElement) {
        currentBox = boxElement;

        modalCategory.textContent = categoryName;
        modalValue.textContent = clueObj.value;
        modalClue.textContent = clueObj.clue;
        modalAnswer.textContent = clueObj.answer;

        modalAnswer.classList.add('hidden');
        showAnswerBtn.classList.remove('hidden');

        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        if (currentBox) {
            currentBox.classList.add('played');
            currentBox = null;
        }
    }

    closeBtn.addEventListener('click', closeModal);

    showAnswerBtn.addEventListener('click', () => {
        showAnswerBtn.classList.add('hidden');
        modalAnswer.classList.remove('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });
});
