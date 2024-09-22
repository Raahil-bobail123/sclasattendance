/* script.js */

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const header = document.getElementById('header');
    const container = document.getElementById('container');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultSection = document.getElementById('result-section');
    const toggleBtn = document.getElementById('toggle-dark-mode');

    // Hide loader and show header and container after loading with animation
    setTimeout(() => {
        loader.style.display = 'none';
        header.classList.remove('hidden');
        container.classList.remove('hidden');
    }, 1500); // Simulate loading time

    // Academic Calendar Data with Weekend Rules
    const semesters = [
        {
            name: 'First Semester',
            start: new Date('2024-07-10'),
            end: new Date('2024-10-06'),
            weekendRules: {
                includeSundays: true,
                specialSaturdays: [
                    { month: 6, week: 3 }, // July (0-indexed)
                    { month: 7, week: 3 }, // August
                    { month: 8, week: 4 }  // September
                ]
            },
            publicHolidays: ['2024-09-06', '2024-10-02']
        },
        {
            name: 'Second Semester',
            start: new Date('2024-10-07'),
            end: new Date('2025-01-05'),
            weekendRules: {
                includeSundays: true,
                specialSaturdays: [
                    { month: 9, week: 3 }, // October
                    { month: 10, week: 3 }, // November
                    { month: 11, week: 4 }  // December
                ]
            },
            publicHolidays: ['2024-12-25', '2025-01-01']
        },
        // Add more semesters as needed
    ];

    // Function to generate weekends based on rules
    const generateWeekends = (semester) => {
        const weekends = [];
        const start = new Date(semester.start);
        const end = new Date(semester.end);

        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday
            const month = currentDate.getMonth(); // 0-indexed

            // Include all Sundays
            if (semester.weekendRules.includeSundays && dayOfWeek === 0) {
                weekends.push(formatDate(currentDate));
            }

            // Check for special Saturdays
            if (dayOfWeek === 6) { // Saturday
                const week = Math.ceil(currentDate.getDate() / 7);
                for (let rule of semester.weekendRules.specialSaturdays) {
                    if (month === rule.month && week === rule.week) {
                        weekends.push(formatDate(currentDate));
                    }
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return weekends;
    };

    // Function to determine the current semester
    const getCurrentSemester = () => {
        const today = getISTDate();
        for (let sem of semesters) {
            if (today >= sem.start && today <= sem.end) {
                sem.weekends = generateWeekends(sem);
                return sem;
            }
        }
        return null; // Outside of defined semesters
    };

    // Function to format date as YYYY-MM-DD
    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1; // Months start at 0!
        let dd = date.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        return `${yyyy}-${mm}-${dd}`;
    };

    // Function to calculate remaining working days
    const calculateRemainingDays = (semester, today) => {
        let remainingWorkingDays = 0;

        let currentDate = new Date(today);
        while (currentDate <= semester.end) {
            const currentStr = formatDate(currentDate);
            if (
                !semester.weekends.includes(currentStr) &&
                !semester.publicHolidays.includes(currentStr)
            ) {
                remainingWorkingDays += 1;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return remainingWorkingDays;
    };

    // Function to adjust date to IST
    const getISTDate = () => {
        const now = new Date();
        const istOffset = 5.5 * 60; // IST is UTC+5:30
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (istOffset * 60000));
    };

    // Function to initialize the Semester Breakdown
    const initializeBreakdown = () => {
        const currentSemester = getCurrentSemester();
        if (!currentSemester) {
            document.getElementById('weekends').innerText = '--';
            document.getElementById('public-holidays').innerText = '--';
            document.getElementById('working-days').innerText = '--';
            return;
        }

        const today = getISTDate();
        const totalDays = Math.floor((currentSemester.end - currentSemester.start) / (1000 * 60 * 60 * 24)) + 1;
        const workingDays = totalDays - currentSemester.weekends.length - currentSemester.publicHolidays.length;

        // Populate the Semester Breakdown
        updateBreakdown({
            weekends: currentSemester.weekends.length,
            publicHolidays: currentSemester.publicHolidays.length,
            workingDays: workingDays
        });
    };

    // Function to update the semester breakdown
    const updateBreakdown = (breakdown) => {
        if (!breakdown) {
            document.getElementById('weekends').innerText = '--';
            document.getElementById('public-holidays').innerText = '--';
            document.getElementById('working-days').innerText = '--';
            return;
        }

        document.getElementById('weekends').innerText = breakdown.weekends;
        document.getElementById('public-holidays').innerText = breakdown.publicHolidays;
        document.getElementById('working-days').innerText = breakdown.workingDays;
    };

    // Function to handle calculation
    const handleCalculate = () => {
        const totalClassesHeld = parseInt(document.getElementById('total-classes').value);
        const classesAttended = parseInt(document.getElementById('classes-attended').value);

        // Input Validation
        const totalClassesHeldInput = document.getElementById('total-classes');
        const classesAttendedInput = document.getElementById('classes-attended');
        let valid = true;

        // Reset previous error states
        totalClassesHeldInput.classList.remove('invalid');
        classesAttendedInput.classList.remove('invalid');

        if (isNaN(totalClassesHeld) || totalClassesHeld < 0) {
            totalClassesHeldInput.classList.add('invalid');
            valid = false;
        }

        if (isNaN(classesAttended) || classesAttended < 0 || classesAttended > totalClassesHeld) {
            classesAttendedInput.classList.add('invalid');
            valid = false;
        }

        if (!valid) {
            showError('Please enter valid numbers for both fields.');
            return;
        }

        const currentSemester = getCurrentSemester();
        if (!currentSemester) {
            showError('No active semester found based on today\'s date.');
            return;
        }

        const today = getISTDate();
        const remainingDays = calculateRemainingDays(currentSemester, today);
        const totalDays = Math.floor((currentSemester.end - currentSemester.start) / (1000 * 60 * 60 * 24)) + 1;
        const workingDays = totalDays - currentSemester.weekends.length - currentSemester.publicHolidays.length;

        // Current Attendance
        const currentAttendance = totalClassesHeld === 0 ? 0 : (classesAttended / totalClassesHeld) * 100;

        let resultHTML = `
            <h2>Results</h2>
            <p><strong>Current Attendance:</strong> ${currentAttendance.toFixed(2)}%</p>
            <p><strong>Projected Attendance if attending all remaining classes:</strong> ${((classesAttended + remainingDays) / (totalClassesHeld + remainingDays) * 100).toFixed(2)}%</p>
        `;

        if (currentAttendance < 80) {
            // Calculate minimum classes needed to attend
            const requiredAttendance = 0.8;
            const x = Math.ceil((requiredAttendance * (totalClassesHeld + remainingDays)) - classesAttended);
            if (x > remainingDays) {
                resultHTML += `<p class="warning">It's not possible to reach 80% attendance this semester.</p>`;
            } else {
                resultHTML += `<p class="highlight">You need to attend at least <strong>${x}</strong> more classes to reach 80% attendance.</p>`;
            }
        } else {
            resultHTML += `<p class="success">Great job! Your attendance is above 80%.</p>`;
        }

        resultSection.innerHTML = resultHTML;

        // Shift focus to the result section for accessibility
        resultSection.focus();
    };

    // Function to display error messages
    const showError = (message) => {
        resultSection.innerHTML = `<p class="error">${message}</p>`;
    };

    // Dark Mode Toggle Functionality
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        header.classList.toggle('dark-mode');
        container.classList.toggle('dark-mode');
        const explanation = document.getElementById('explanation');
        explanation.classList.toggle('dark-mode');

        // Toggle dark mode for inputs and buttons
        document.querySelectorAll('.input-section input').forEach(input => input.classList.toggle('dark-mode'));
        document.querySelectorAll('.input-section button').forEach(button => button.classList.toggle('dark-mode'));

        // Change toggle button icon
        if (document.body.classList.contains('dark-mode')) {
            toggleBtn.textContent = '☀️'; // Sun icon
        } else {
            toggleBtn.textContent = '🌙'; // Moon icon
        }
    });

    calculateBtn.addEventListener('click', handleCalculate);

    // Initialize Semester Breakdown after loading
    window.onload = initializeBreakdown;
});