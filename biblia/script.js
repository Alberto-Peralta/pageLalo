document.addEventListener('DOMContentLoaded', () => {
    fetch('bible.txt')
        .then(response => response.text())
        .then(text => {
            const bibleChapters = parseBible(text);
            generateNav(bibleChapters);

            if (bibleChapters.length > 0) {
                displayChapter(bibleChapters[0]);
            }
        });

    function parseBible(text) {
        const chapters = [];
        const chapterLines = text.split(/\n/);
        let chapter = null;

        chapterLines.forEach(line => {
            const chapterMatch = line.match(/^Capítulo (\d+)/);
            const verseMatch = line.match(/^(\d+):(\d+) (.+)/);

            if (chapterMatch) {
                chapter = { number: parseInt(chapterMatch[1], 10), verses: [] };
                chapters.push(chapter);
            } else if (verseMatch) {
                const verse = { number: parseInt(verseMatch[2], 10), text: verseMatch[3] };
                chapter.verses.push(verse);
            }
        });

        return chapters;
    }

    function generateNav(chapters) {
        const nav = document.getElementById('nav');
        chapters.forEach(chapter => {
            const chapterLink = document.createElement('a');
            chapterLink.href = `#chapter-${chapter.number}`;
            chapterLink.textContent = `Capítulo ${chapter.number}`;
            nav.appendChild(chapterLink);

            chapterLink.addEventListener('click', () => {
                displayChapter(chapter);
            });
        });
    }

    function displayChapter(chapter) {
        const content = document.getElementById('content');
        content.innerHTML = `<h2>Capítulo ${chapter.number}</h2>`;
        chapter.verses.forEach(verse => {
            const verseElement = document.createElement('p');
            verseElement.textContent = `${verse.number}: ${verse.text}`;
            content.appendChild(verseElement);
        });
    }
});
