const { createApp } = Vue;
const { jsPDF } = window.jspdf;

createApp({
    data() {
        return {
            sentences: [
                { text: 'The cat is near the dog', scrambled: '', imageData: null }
            ]
        }
    },
    mounted() {
        // Initial scramble
        this.sentences.forEach((item, index) => {
            this.updateScramble(index);
        });
    },
    methods: {
        addSentence() {
            this.sentences.push({ text: '', scrambled: '', imageData: null });
        },
        removeSentence(index) {
            this.sentences.splice(index, 1);
        },
        updateScramble(index) {
            const text = this.sentences[index].text;
            if (!text) {
                this.sentences[index].scrambled = '';
                return;
            }
            // Scramble logic: split by words (keeping punctuation logic simple or just stripping it?
            // The original python code: re.sub("[^\w]", " ",  userSentence).split()
            // Then shuffle each word.

            // Javascript equivalent:
            const words = text.split(/\s+/);
            const scrambledWords = words.map(word => {
                // Keep non-word characters in place? Or just scramble the whole thing?
                // The python code used random.sample on the word.
                // Let's keep it simple: just shuffle the letters of the word.

                // Remove non-alphanumeric for scrambling to avoid weird punctuation in middle?
                // Python: re.sub("[^\w]", " ",  userSentence) -> replaced non-word chars with space.
                // So "The cat." -> "The", "cat".

                // Let's clean the word first for scrambling display, or try to preserve punctuation?
                // The output example showed "hte tca si naer eht gdo" (no punctuation).

                const cleanWord = word.replace(/[^\w]/g, '');
                if (!cleanWord) return word;

                const letters = cleanWord.split('');
                for (let i = letters.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [letters[i], letters[j]] = [letters[j], letters[i]];
                }
                return letters.join('');
            });

            this.sentences[index].scrambled = scrambledWords.join(' ');
        },
        handleImageUpload(event, index) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.sentences[index].imageData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },
        generatePDF() {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter'
            });

            const startY = 20;
            const sectionHeight = 80;

            // Set font
            doc.setFont("helvetica", "normal");
            doc.setFontSize(20);

            this.sentences.forEach((item, index) => {
                // Check if we need a new page
                const yPos = startY + (index % 3) * sectionHeight;
                if (index > 0 && index % 3 === 0) {
                    doc.addPage();
                }

                // Add Image if exists
                if (item.imageData) {
                    try {
                        // x=20, w=50, h=30 (keeping similar to original python script)
                        doc.addImage(item.imageData, 'JPEG', 20, yPos, 50, 30);
                    } catch (e) {
                        console.error("Error adding image", e);
                    }
                }

                // Add Scrambled Text
                // x=80
                doc.text(item.scrambled, 80, yPos + 10);

                // Add Lines
                // Original Python:
                // interval = 10
                // line at y
                // dashed at y - 10
                // line at y - 20
                // dashed at y - 30
                // line at y - 40

                // Wait, handwriting lines usually are: Top (Solid), Middle (Dashed), Bottom (Solid).
                // The python code drew 5 lines?
                // Let's look at the code:
                // line at y (Bottom?)
                // dashed at y-10
                // line at y-20
                // dashed at y-30
                // line at y-40

                // Let's implement a standard 3-line set for handwriting: Top, Mid (dashed), Base.
                // Or follow the python script:
                /*
                    line_y = y
                    self.line(x1=x, y1=line_y, x2=x+length, y2=line_y)
                    line_y = y - interval_between_lines
                    self.dashed_line...
                    line_y = y - 2*interval_between_lines
                    self.line...
                    line_y = y - 3*interval_between_lines
                    self.dashed_line...
                    line_y = y - 4*interval_between_lines
                    self.line...
                */
               // That's two sets of writing lines (each set is Line-Dashed-Line? No, it's 5 lines total).
               // It looks like two rows of writing space.
               // Let's replicate that.

               const lineBaseY = yPos + 75; // Adjusting to fit in section
               const lineX = 20;
               const lineLength = 180;
               const interval = 10;

               doc.setDrawColor(93, 145, 155); // Teal-ish color from python script

               // Function to draw dashed line
               const drawDashedLine = (x1, y1, x2, y2) => {
                   doc.setLineDash([1, 1], 0);
                   doc.line(x1, y1, x2, y2);
                   doc.setLineDash([]); // Reset
               };

               // 1st line (Bottom)
               let currentY = lineBaseY;
               doc.line(lineX, currentY, lineX + lineLength, currentY);

               // 2nd line (Dashed)
               currentY -= interval;
               drawDashedLine(lineX, currentY, lineX + lineLength, currentY);

               // 3rd line (Solid - Middle/Top of first row)
               currentY -= interval;
               doc.line(lineX, currentY, lineX + lineLength, currentY);

               // 4th line (Dashed)
               currentY -= interval;
               drawDashedLine(lineX, currentY, lineX + lineLength, currentY);

               // 5th line (Solid - Top)
               currentY -= interval;
               doc.line(lineX, currentY, lineX + lineLength, currentY);

            });

            doc.save("scrambled-sentences.pdf");
        }
    }
}).mount('#app');
