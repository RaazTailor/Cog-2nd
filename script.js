// Questions data structure
const questions = [
    {
        id: 1,
        text: "You're stuck in a traffic jam and running late for an important meeting. What do you do?",
        options: [
            "Wait in traffic and inform your team about the delay",
            "Take a longer but faster toll road for ₹200",
            "Cancel the meeting and reschedule",
            "Park your car and take a cab to reach faster"
        ],
        displayType: "normal",
        background: "red",
        timeLimit: 20 // No time limit
    },
    {
        id: 2,
        text: "You're buying a laptop for work. Which one do you pick?",
        headers: ["Amount", "RAM", "Processor", "Storage"],
        options: [
            ["Amount", "Ram", "processor", "Storage"],
            ["₹50,000", "8GB RAM", "i5 processor", "256GB SSD"],
            ["₹55,000", "16GB RAM", "i5 processor", "512GB SSD"],
            ["₹60,000", "8GB RAM", "i7 processor", "1TB HDD"],
            ["₹48,000", "8GB RAM", "Ryzen 5", "256GB SSD"]
        ],
        displayType: "table",
        background: "green",
        timeLimit: 0   
    },
    // {
    //     id: 3,
    //     text: "You're stuck in a traffic jam and running late for an important meeting. What do you do?",
    //     options: [
    //         "Wait in traffic and inform your team about the delay",
    //         "Take a longer but faster toll road for ₹200",
    //         "Cancel the meeting and reschedule",
    //         "Park your car and take a cab to reach faster"
    //     ],
    //     displayType: "normal",
    //     background: "red",
    //     timeLimit: 10 // No time limit
    // },
    // {
    //     id: 4,
    //     text: "You're buying a laptop for work. Which one do you pick?",
    //     options: [
    //         ["₹50,000", "8GB RAM", "i5 processor", "256GB SSD"],
    //         ["₹55,000", "16GB RAM", "i5 processor", "512GB SSD"],
    //         ["₹60,000", "8GB RAM", "i7 processor", "1TB HDD"],
    //         ["₹48,000", "8GB RAM", "Ryzen 5", "256GB SSD"]
    //     ],
    //     displayType: "table",
    //     background: "green",
    //     timeLimit: 0  
    // },
    // Add more questions following the same structure
];



let currentQuestion = 0;
let responses = {
    basicInfo: {},
    questions: [],
    likertScales: [],
    timers: [],
    stressAssessment: {}
};

let currentTimer = null;

// Page Navigation
function showPage(pageId) {
    $('.page').addClass('hidden');
    $(`#${pageId}`).removeClass('hidden');
}

// Basic Information Validation
$('#basic-info-form').on('submit', function(e) {
    e.preventDefault();
    const name = $('#name').val();
    const age = $('#age').val();
    const gender = $('#gender').val();

    if (!name || !age || !gender) {
        showValidationMessage('All fields are mandatory');
        return;
    }

    responses.basicInfo = { name, age, gender };
    showPage('instructions-page');
});

// Timer functionality
class Timer {
    constructor(duration = 0, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onComplete = onComplete;
        this.isRunning = false;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now();
            this.interval = setInterval(() => this.update(), 1000);
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.interval);
            return this.getElapsedTime();
        }
        return 0;
    }

    update() {
        if (this.duration > 0) {
            this.remaining = Math.max(0, this.duration - Math.floor((Date.now() - this.startTime) / 1000));
            $('#time-value').text(this.remaining);
            
            if (this.remaining === 0) {
                this.stop();
                if (this.onComplete) this.onComplete();
            }
        } else {
            // For unlimited timer, just show elapsed time
            $('#time-value').text(Math.floor((Date.now() - this.startTime) / 1000));
        }
    }

    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

// Question Display
function displayQuestion(question) {
    const $questionContainer = $('#question-page');
    const $questionText = $('#question-text');
    const $optionsContainer = $('#options-container');

    // Set background color
    $questionContainer.removeClass('bg-green bg-red').addClass(`bg-${question.background}`);

    // Display question text
    $questionText.text(question.text);

    // Clear previous options
    $optionsContainer.empty();

    // Display options based on type
    if (question.displayType === 'table') {
        displayTableOptions(question.options, $optionsContainer);
    } else {
        displayNormalOptions(question.options, $optionsContainer);
    }

    // Setup timer
    currentTimer = setupQuestionTimer(question);

    // Ensure the next button is initially disabled
    $('#next-question').prop('disabled', true);

    // Set up the next button functionality
    $('#next-question').off('click').on('click', function () {
        saveResponse();
        displayLikertScale();
    });

    showPage('question-page');
}

function displayNormalOptions(options, container) {
    const $optionsList = $('<div>').addClass('options-normal');

    options.forEach((option, index) => {
        const $option = $('<div>')
            .addClass('option')
            .text(option)
            .data('value', index)
            .on('click', handleOptionSelection);

        $optionsList.append($option);
    });

    container.append($optionsList);
}

function displayTableOptions(options, container) {
    const $table = $('<table>').addClass('options-table');

    options.forEach((option, index) => {
        const $row = $('<tr>').data('value', index);  // Add data-value to the row
        option.forEach(cell => {
            $('<td>')
                .text(cell)
                .appendTo($row);
        });

        // Add click handler to the entire row
        $row.on('click', handleTableRowSelection);
        $table.append($row);
    });

    container.append($table);
}

function handleTableRowSelection() {
    const $row = $(this);
    // Remove selection from all rows
    $('.options-table tr').removeClass('selected');
    // Add selection to clicked row
    $row.addClass('selected');
    // Enable next button
    $('#next-question').prop('disabled', false);
}

function handleOptionSelection() {
    $('.option, .options-table td').removeClass('selected');
    $(this).addClass('selected');
    $('#next-question').prop('disabled', false);
}

// Timer Setup
function setupQuestionTimer(question) {
    if (currentTimer) currentTimer.stop(); // Stop the previous timer

    currentTimer = new Timer(
        question.timeLimit,
        question.timeLimit > 0 ? handleTimeLimitExpired : null
    );

    $('#timer')
        .removeClass('time-limit time-free')
        .addClass(question.timeLimit > 0 ? 'time-limit' : 'time-free');

    currentTimer.start();
    return currentTimer;
}

function handleTimeLimitExpired() {
    // Save current response and move to next question
    saveResponse();
    moveToNextQuestion();
}

// Response Handling
function saveResponse() {
    const currentQ = questions[currentQuestion];
    let selectedValue;

    if (currentQ.displayType === 'table') {
        selectedValue = $('.options-table tr.selected').data('value');
    } else {
        selectedValue = $('.option.selected').data('value');
    }

    const timeSpent = currentTimer ? currentTimer.getElapsedTime() : 0;

    responses.questions.push({
        questionId: currentQ.id,
        response: selectedValue,
        timeSpent: timeSpent
    });
}

// Likert Scale Handling
function displayLikertScale() {
    console.log('Displaying Likert scale');
    // Ensure page transition
    showPage('likert-page');

    $('input[name="confidence"]').prop('checked', false); // Reset radio buttons
    // Reset the next Likert button

    $('#next-likert').prop('disabled', true);

    // Handle Likert option change
    $('.likert-option input').off('change').on('change', function () {
        $('#next-likert').prop('disabled', false);
    });

    // Handle Likert next button
    $('#next-likert').off('click').on('click', function () {
        const likertValue = $('input[name="confidence"]:checked').val();
        responses.likertScales.push({
            questionId: questions[currentQuestion].id,
            confidence: parseInt(likertValue)
        });
        moveToNextQuestion();
    });
}

// Survey Navigation
function moveToNextQuestion() {
    currentQuestion++;

    // Reset states for the next question
    $('.option, .options-table tr').removeClass('selected');
    $('#next-question').prop('disabled', true);

    if (currentQuestion < questions.length) {
        displayQuestion(questions[currentQuestion]);
    } else {
        showStressAssessment();
    }
}

// Stress Assessment
function showStressAssessment() {
    showPage('stress-assessment');

    // Reset stress assessment state
    $('input[name="free-stress"]').prop('checked', false);
    $('input[name="stress-level"]').prop('checked', false);
    $('.stress-scale').addClass('hidden');
    updateStressNextButton();

    // Handle stress inputs
    $('input[name="free-stress"]').off('change').on('change', function () {
        const showScale = $(this).val() === 'yes';
        $('.stress-scale').toggleClass('hidden', !showScale);
        updateStressNextButton();
    });

    $('input[name="stress-level"]').off('change').on('change', function () {
        updateStressNextButton();
    });

    // Handle the next button for stress assessment
    $('#next-stress-assessment').off('click').on('click', function () {
        saveStressAssessment();

        // Show the final stress type question before submission
        showStressTypeQuestion();
    });

    function showStressTypeQuestion() {
        const stressQuestionHtml = `
            <div class="page hidden" id="stress-type-page">
                <h2>Which type of question made you more stressed?</h2>
                <div class="stress-options">
                    <input type="radio" name="stress-type" value="time-free" id="stress-free">
                    <label for="stress-free">Time-Free</label>
        
                    <input type="radio" name="stress-type" value="time-bound" id="stress-bound">
                    <label for="stress-bound">Time-Bound</label>
                </div>
                <button id="submit-survey" disabled>Submit</button>
            </div>
        `;

        $('.container').append(stressQuestionHtml); // Add question to DOM
        showPage('stress-type-page'); // Show the new question

        // Enable the submit button when an option is selected
        $('input[name="stress-type"]').off('change').on('change', function () {
            $('#submit-survey').prop('disabled', false);
        });

        // Handle the survey submission
        $('#submit-survey').off('click').on('click', function () {
            const selectedStressType = $('input[name="stress-type"]:checked').val();
            responses.stressAssessment.stressType = selectedStressType;

            // Submit the survey and navigate to the Thank You page
            submitSurvey();
            showPage('thank-you-page');
        });
    }
}


function updateStressNextButton() {
    const hasAnswer = $('input[name="free-stress"]:checked').length > 0;
    const needsScale = $('input[name="free-stress"]:checked').val() === 'yes';
    const hasScale = needsScale ? $('input[name="stress-level"]:checked').length > 0 : true;

    $('#next-stress-assessment').prop('disabled', !(hasAnswer && hasScale));
}

function saveStressAssessment() {
    const stressAnswer = $('input[name="free-stress"]:checked').val();
    const stressLevel = $('input[name="stress-level"]:checked').val();

    responses.stressAssessment = {
        freeStress: stressAnswer,
        stressLevel: stressAnswer === 'yes' ? parseInt(stressLevel) : null
    };
}

// Data Submission
function submitSurvey() {
    const data = {
        timestamp: new Date().toISOString(),
        ...responses
    };

    // Submit to Google Sheets
    submitToGoogleSheets(data)
        .then(() => {
            showSubmissionSuccess();
        })
        .catch(error => {
            showSubmissionError();
            console.error('Submission error:', error);
        });
}

async function submitToGoogleSheets(data) {
    const endpoint = 'https://script.google.com/macros/s/AKfycbwtEa2l8B2uyMjaY92nlR63oNYyqJLuwtApWuT12z9z0buhYM5SfloTXF_WuvrEjinP/exec'; // Replace with the Apps Script web app URL

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to submit data');
    } catch (error) {
        throw error;
    }
}


function formatDataForSheet(data) {
    return [
        data.timestamp,
        data.basicInfo.name,
        data.basicInfo.age,
        data.basicInfo.gender,
        JSON.stringify(data.questions),
        JSON.stringify(data.likertScales),
        JSON.stringify(data.stressAssessment)
    ];
}

function showSubmissionSuccess() {
    alert('Your response has been recorded successfully');
}

function showSubmissionError() {
    alert('There is an issue to submit your form. Please try again after some time');
}

// Initialize survey
$(document).ready(function() {
    questions.sort(() => Math.random() - 0.5);

    $('#consent-checkbox').on('change', function() {
        $('#start-survey').prop('disabled', !this.checked);
    });

    $('#instructions-checkbox').on('change', function() {
        $('#start-questions').prop('disabled', !this.checked);
    });

    $('#start-survey').on('click', function() {
        showPage('basic-info-page');
    });

    $('#start-questions').on('click', function() {
        currentQuestion = 0;
        displayQuestion(questions[currentQuestion]);
    });

    $('#submit-survey').on('click', submitSurvey);
});

function doGet(e) {
    return ContentService.createTextOutput("Web App is running!")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  