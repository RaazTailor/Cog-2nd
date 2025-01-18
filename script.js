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
        background: "#ff0000",  // Red color for time limit questions
        timeLimit: 20
    },
    {
        id: 2,
        text: "You're buying a laptop for work. Which one do you pick?",
        headers: ["Amount", "RAM", "Processor", "Storage"],
        options: [
            ["Amount", "RAM", "Processor", "Storage"],
            ["₹50,000", "8GB RAM", "i5 processor", "256GB SSD"],
            ["₹55,000", "16GB RAM", "i5 processor", "512GB SSD"],
            ["₹60,000", "8GB RAM", "i7 processor", "1TB HDD"],
            ["₹48,000", "8GB RAM", "Ryzen 5", "256GB SSD"]
        ],
        displayType: "table",
        background: "#fdee98",  // Blue color for time free questions
        timeLimit: 0   
    },
    // {
    //     id: 3,
    //     text: "nasir nasir nasir nasir nasir",
    //     options: [
    //         "Wait in traffic and inform your team about the delay",
    //         "Take a longer but faster toll road for ₹200",
    //         "Cancel the meeting and reschedule",
    //         "Park your car and take a cab to reach faster"
    //     ],
    //     displayType: "normal",
    //     background: "#fdee98",  // white color for time free questions
    //     timeLimit: 0
    // },
    // {
    //     id: 4,
    //     text: "You're buying a laptop for work. Which one do you pick?",
    //     headers: ["Amount", "RAM", "Processor", "Storage"],
    //     options: [
    //         ["saba", "nari", "kadir", "zeba","Hussain"],
    //         ["₹50,000", "8GB RAM", "i5 processor", "256GB SSD","good"],
    //         ["₹55,000", "16GB RAM", "i5 processor", "512GB SSD","bad"],
    //         ["₹60,000", "8GB RAM", "i7 processor", "1TB HDD","fare"],
    //         ["₹48,000", "8GB RAM", "Ryzen 5", "256GB SSD","not"]
    //     ],
    //     displayType: "table",
    //     background: "#ff0000",  
    //     timeLimit: 30   
    // }
    // // Add more questions following the same structure
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
    const $timer = $('#timer');

    // Set question text
    $questionText.text(question.text);

    // Clear previous options
    $optionsContainer.empty();

    // Display options based on type
    if (question.displayType === 'table') {
        displayTableOptions(question.options, $optionsContainer);
    } else {
        displayNormalOptions(question.options, $optionsContainer);
    }

    // Set timer color and start timer
    $timer.css({
        'background-color': question.background || (question.timeLimit > 0 ? '#ff0000' : '#fdee98')
    });

    // Setup timer
    currentTimer = setupQuestionTimer(question);

    // Reset next button state
    $('#next-question').off('click').on('click', function () {
        saveResponse();
        displayLikertScale();
    });

    showPage('question-page');
}

function displayTableOptions(options, container) {
    const $table = $('<table>').addClass('options-table');
    
    // Create header row
    const headers = options[0];
    const $thead = $('<thead>');
    const $headerRow = $('<tr>');
    
    headers.forEach(header => {
        $('<th>')
            .text(header)
            .appendTo($headerRow);
    });
    
    $thead.append($headerRow);
    $table.append($thead);
    
    // Create tbody for data rows
    const $tbody = $('<tbody>');
    
    // Add data rows (skip the header row)
    for(let i = 1; i < options.length; i++) {
        const $row = $('<tr>').data('value', i);
        options[i].forEach(cell => {
            $('<td>')
                .text(cell)
                .appendTo($row);
        });
        
        // Add click handler to the row
        $row.on('click', handleTableRowSelection);
        $tbody.append($row);
    }
    
    $table.append($tbody);
    container.append($table);
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

function handleTableRowSelection() {
    $('.options-table tr').removeClass('selected');
    $(this).addClass('selected');
    $('#next-question').prop('disabled', false);
}

function handleOptionSelection() {
    $('.option').removeClass('selected');
    $(this).addClass('selected');
    $('#next-question').prop('disabled', false);
}

// Timer Setup
function setupQuestionTimer(question) {
    if (currentTimer) currentTimer.stop();

    const timer = new Timer(
        question.timeLimit,
        question.timeLimit > 0 ? handleTimeLimitExpired : null
    );

    timer.start();
    return timer;
}

function handleTimeLimitExpired() {
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
    showPage('likert-page');
    $('input[name="confidence"]').prop('checked', false);
    $('#next-likert').prop('disabled', true);

    $('.likert-option input').off('change').on('change', function() {
        $('#next-likert').prop('disabled', false);
    });

    $('#next-likert').off('click').on('click', function() {
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

    $('input[name="free-stress"]').prop('checked', false);
    $('input[name="stress-level"]').prop('checked', false);
    $('.stress-scale').addClass('hidden');
    updateStressNextButton();

    $('input[name="free-stress"]').off('change').on('change', function() {
        const showScale = $(this).val() === 'yes';
        $('.stress-scale').toggleClass('hidden', !showScale);
        updateStressNextButton();
    });

    $('input[name="stress-level"]').off('change').on('change', updateStressNextButton);

    $('#next-stress-assessment').off('click').on('click', function() {
        saveStressAssessment();
        showStressTypeQuestion();
    });
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

function showStressTypeQuestion() {
    const stressQuestionHtml = `
        <div class="page" id="stress-type-page">
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

    $('.container').append(stressQuestionHtml);
    showPage('stress-type-page');

    $('input[name="stress-type"]').on('change', function() {
        $('#submit-survey').prop('disabled', false);
    });

    $('#submit-survey').on('click', function() {
        const selectedStressType = $('input[name="stress-type"]:checked').val();
        responses.stressAssessment.stressType = selectedStressType;
        submitSurvey();
    });
}

// Form Submission
// Format the submission data
function formatSubmissionData(responses) {
    return {
        timestamp: new Date().toISOString(),
        basicInfo: {
            name: responses.basicInfo.name,
            age: responses.basicInfo.age,
            gender: responses.basicInfo.gender
        },
        questions: responses.questions.map(q => ({
            questionId: q.questionId,
            response: q.response,
            timeSpent: q.timeSpent
        })),
        likertScales: responses.likertScales.map(l => ({
            questionId: l.questionId,
            confidence: l.confidence
        })),
        stressAssessment: {
            freeStress: responses.stressAssessment.freeStress,
            stressLevel: responses.stressAssessment.stressLevel,
            stressType: responses.stressAssessment.stressType
        }
    };
}

// Submit data to Google Sheets
async function submitToGoogleSheets(data) {
    // Replace with your Google Apps Script deployment URL
    const endpoint = 'https://script.google.com/macros/s/AKfycbzQsWVOXsNpd0IdYwKYQylOi1Ket1SQn9PIvE-4kgUZ7n0RM9gg84I3ovxMB1p1u8A/exec';
    
    try {
        // Show loading indicator
        showLoadingSpinner();
        
        const formattedData = formatSubmissionData(data);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedData)
        });

        // Hide loading indicator
        hideLoadingSpinner();
        
        return true;
    } catch (error) {
        // Hide loading indicator
        hideLoadingSpinner();
        
        console.error('Submission error:', error);
        throw error;
    }
}

// Helper functions for loading indicator
function showLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-overlay">
            <div class="spinner-content">
                <div class="spinner"></div>
                <p>Submitting your response...</p>
            </div>
        </div>
    `;
    document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Main submit function
function submitSurvey() {
    // Validate responses before submission
    if (!validateResponses(responses)) {
        alert('Please complete all required fields before submitting.');
        return;
    }

    // Add submission timestamp
    const data = {
        timestamp: new Date().toISOString(),
        ...responses
    };

    // Submit to Google Sheets
    submitToGoogleSheets(data)
        .then(() => {
            // Show success message
            showSuccessMessage();
            // Navigate to thank you page
            showPage('thank-you-page');
        })
        .catch(error => {
            // Show error message
            showErrorMessage();
            console.error('Submission error:', error);
        });
}

// Validation function
function validateResponses(responses) {
    // Check basic info
    if (!responses.basicInfo ||
        !responses.basicInfo.name ||
        !responses.basicInfo.age ||
        !responses.basicInfo.gender) {
        return false;
    }

    // Check if all questions were answered
    if (!responses.questions || responses.questions.length === 0) {
        return false;
    }

    // Check if all confidence ratings were provided
    if (!responses.likertScales || 
        responses.likertScales.length !== responses.questions.length) {
        return false;
    }

    // Check stress assessment
    if (!responses.stressAssessment ||
        !responses.stressAssessment.freeStress) {
        return false;
    }

    // If stress is "yes", check if level is provided
    if (responses.stressAssessment.freeStress === 'yes' &&
        !responses.stressAssessment.stressLevel) {
        return false;
    }

    return true;
}

// Success message function
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = 'Your response has been submitted successfully!';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Error message function
function showErrorMessage() {
    const message = document.createElement('div');
    message.className = 'error-message';
    message.textContent = 'There was an error submitting your response. Please try again.';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
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
});
