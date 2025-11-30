// Scientific Calculator Application
class ScientificCalculator {
    constructor() {
        this.display = document.getElementById('main-display');
        this.historyDisplay = document.getElementById('history-display');
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForNewNumber = false;
        this.lastResult = 0;
        this.memory = 0;
        this.angleMode = 'DEG'; // DEG, RAD, GRAD
        this.complexMode = false;
        this.displayMode = 'normal'; // normal, scientific, engineering
        this.decimalPlaces = 10;
        this.history = [];
        this.currentExpression = '';
        
        this.initializeCalculator();
        this.setupEventListeners();
        this.setupKeyboardSupport();
        this.setupTabs();
        this.setupModeToggles();
        this.setupHelp();
        
        // Initialize dynamic inputs
        this.generateMatrixInputs(2);
        this.generateEquationInputs('linear');
        this.generateConversionInputs('base');
    }

    initializeCalculator() {
        this.updateDisplay();
        this.updateModeIndicators();
        
        // Initialize math.js with custom configuration
        if (typeof math !== 'undefined') {
            this.math = math.create(math.all);
            this.math.config({
                number: 'BigNumber',
                precision: 64
            });
        }
    }

    setupEventListeners() {
        // Calculator button listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('calc-btn')) {
                this.handleButtonClick(e.target);
            }
        });

        // History item listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-item')) {
                this.recallFromHistory(e.target.textContent);
            }
        });

        // Matrix size change
        const matrixSizeSelect = document.getElementById('matrix-size-select');
        matrixSizeSelect?.addEventListener('change', (e) => {
            this.generateMatrixInputs(parseInt(e.target.value));
        });

        // Equation type change
        const equationTypeSelect = document.getElementById('equation-type');
        equationTypeSelect?.addEventListener('change', (e) => {
            this.generateEquationInputs(e.target.value);
        });

        // Conversion type change
        const conversionTypeSelect = document.getElementById('conversion-type');
        conversionTypeSelect?.addEventListener('change', (e) => {
            this.generateConversionInputs(e.target.value);
        });

        // Settings listeners
        const decimalPlacesInput = document.getElementById('decimal-places');
        decimalPlacesInput?.addEventListener('change', (e) => {
            this.decimalPlaces = parseInt(e.target.value);
        });

        const displayModeSelect = document.getElementById('display-mode');
        displayModeSelect?.addEventListener('change', (e) => {
            this.displayMode = e.target.value;
            this.updateDisplay();
        });
    }

    setupKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            
            const key = e.key;
            
            if (key >= '0' && key <= '9' || key === '.') {
                this.inputNumber(key);
            } else if (['+', '-', '*', '/'].includes(key)) {
                this.inputOperator(key);
            } else if (key === '(' || key === ')') {
                this.inputParenthesis(key);
            } else if (key === 'Enter' || key === '=') {
                this.calculate();
            } else if (key === 'Escape') {
                this.clear();
            } else if (key === 'Backspace') {
                this.delete();
            } else if (key === '%') {
                this.inputOperator('%');
            }
        });
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab panel
                tabPanels.forEach(panel => panel.classList.remove('active'));
                const targetPanel = document.getElementById(`tab-${targetTab}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }

    setupModeToggles() {
        // Angle mode toggle
        const angleButtons = document.querySelectorAll('.angle-btn');
        angleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                angleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.angleMode = btn.textContent;
                this.updateModeIndicators();
            });
        });

        // Complex mode toggle
        const complexToggle = document.getElementById('complex-toggle');
        complexToggle?.addEventListener('click', () => {
            this.complexMode = !this.complexMode;
            complexToggle.classList.toggle('active');
            this.updateModeIndicators();
        });
    }

    setupHelp() {
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const closeBtn = helpModal?.querySelector('.close');

        helpBtn?.addEventListener('click', () => {
            if (helpModal) helpModal.style.display = 'block';
        });

        closeBtn?.addEventListener('click', () => {
            if (helpModal) helpModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }

    handleButtonClick(button) {
        const action = button.dataset.action;
        const value = button.dataset.value;
        const func = button.dataset.function;

        // Add visual feedback
        button.classList.add('btn-pressed');
        setTimeout(() => button.classList.remove('btn-pressed'), 150);

        if (action) {
            this.handleAction(action);
        } else if (value !== undefined) {
            this.handleValue(value);
        } else if (func) {
            this.handleFunction(func);
        }
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'delete':
                this.delete();
                break;
            case 'equals':
                this.calculate();
                break;
            case 'sign':
                this.toggleSign();
                break;
            case 'ans':
                this.inputAns();
                break;
            // Memory actions
            case 'mc':
                this.memoryClear();
                break;
            case 'mr':
                this.memoryRecall();
                break;
            case 'ms':
                this.memoryStore();
                break;
            case 'mplus':
                this.memoryAdd();
                break;
            case 'mminus':
                this.memorySubtract();
                break;
            // Other actions
            case 'clear-history':
                this.clearHistory();
                break;
            // Matrix actions
            case 'matrix-add':
                this.performMatrixOperation('add');
                break;
            case 'matrix-sub':
                this.performMatrixOperation('subtract');
                break;
            case 'matrix-mult':
                this.performMatrixOperation('multiply');
                break;
            case 'matrix-scalar':
                this.performMatrixOperation('scalar');
                break;
            case 'matrix-transpose':
                this.performMatrixOperation('transpose');
                break;
            case 'matrix-det':
                this.performMatrixOperation('determinant');
                break;
            case 'matrix-inv':
                this.performMatrixOperation('inverse');
                break;
            case 'matrix-rref':
                this.performMatrixOperation('rref');
                break;
            // Statistics actions
            case 'mean':
            case 'median':
            case 'mode':
            case 'stddev':
            case 'variance':
            case 'sum':
            case 'count':
            case 'quartiles':
            case 'regression':
            case 'correlation':
                this.performStatisticalOperation(action);
                break;
            // Calculus actions
            case 'derivative':
            case 'integral':
            case 'definite-integral':
            case 'limit':
                this.performCalculusOperation(action);
                break;
            // Solver actions
            case 'solve':
                this.solveEquation();
                break;
            case 'clear-solver':
                this.clearSolver();
                break;
            // Conversion actions
            case 'convert':
                this.performConversion();
                break;
            case 'clear-convert':
                this.clearConversion();
                break;
        }
    }

    handleValue(value) {
        if (value === 'pi') {
            this.inputConstant(Math.PI);
        } else if (value === 'e') {
            this.inputConstant(Math.E);
        } else if (value === 'phi') {
            this.inputConstant((1 + Math.sqrt(5)) / 2); // Golden ratio
        } else if (value === 'i') {
            this.inputComplex();
        } else if (['+', '-', '*', '/', '%'].includes(value)) {
            this.inputOperator(value);
        } else if (value === '(' || value === ')') {
            this.inputParenthesis(value);
        } else {
            this.inputNumber(value);
        }
    }

    handleFunction(func) {
        switch (func) {
            // Power and root functions
            case 'square':
                this.applyUnaryFunction(x => x * x);
                break;
            case 'cube':
                this.applyUnaryFunction(x => x * x * x);
                break;
            case 'power':
                this.inputOperator('^');
                break;
            case 'sqrt':
                this.applyUnaryFunction(Math.sqrt);
                break;
            case 'cbrt':
                this.applyUnaryFunction(Math.cbrt);
                break;
            case 'reciprocal':
                this.applyUnaryFunction(x => 1 / x);
                break;
            case 'abs':
                this.applyUnaryFunction(Math.abs);
                break;
            // Exponential and logarithmic functions
            case 'exp':
                this.applyUnaryFunction(Math.exp);
                break;
            case 'exp10':
                this.applyUnaryFunction(x => Math.pow(10, x));
                break;
            case 'ln':
                this.applyUnaryFunction(Math.log);
                break;
            case 'log':
                this.applyUnaryFunction(Math.log10);
                break;
            // Trigonometric functions
            case 'sin':
                this.applyTrigFunction(Math.sin);
                break;
            case 'cos':
                this.applyTrigFunction(Math.cos);
                break;
            case 'tan':
                this.applyTrigFunction(Math.tan);
                break;
            case 'asin':
                this.applyInverseTrigFunction(Math.asin);
                break;
            case 'acos':
                this.applyInverseTrigFunction(Math.acos);
                break;
            case 'atan':
                this.applyInverseTrigFunction(Math.atan);
                break;
            // Hyperbolic functions
            case 'sinh':
                this.applyUnaryFunction(Math.sinh);
                break;
            case 'cosh':
                this.applyUnaryFunction(Math.cosh);
                break;
            case 'tanh':
                this.applyUnaryFunction(Math.tanh);
                break;
            case 'asinh':
                this.applyUnaryFunction(Math.asinh);
                break;
            case 'acosh':
                this.applyUnaryFunction(Math.acosh);
                break;
            case 'atanh':
                this.applyUnaryFunction(Math.atanh);
                break;
            // Special functions
            case 'factorial':
                this.applyUnaryFunction(this.factorial.bind(this));
                break;
            case 'random':
                this.inputConstant(Math.random());
                break;
            // Complex functions would be implemented here
            case 'conj':
            case 're':
            case 'im':
            case 'arg':
                this.handleComplexFunction(func);
                break;
        }
    }

    inputNumber(num) {
        if (this.waitingForNewNumber) {
            this.currentInput = num === '.' ? '0.' : num;
            this.waitingForNewNumber = false;
        } else {
            if (num === '.' && this.currentInput.includes('.')) return;
            this.currentInput = this.currentInput === '0' ? (num === '.' ? '0.' : num) : this.currentInput + num;
        }
        this.updateDisplay();
    }

    inputOperator(op) {
        if (this.currentInput !== '' && !this.waitingForNewNumber) {
            this.currentExpression += this.currentInput + ' ' + op + ' ';
        } else {
            // Replace last operator
            this.currentExpression = this.currentExpression.replace(/\s[+\-*/^%]\s$/, ' ' + op + ' ');
        }
        this.waitingForNewNumber = true;
        this.updateDisplay();
    }

    inputParenthesis(paren) {
        this.currentExpression += paren;
        this.updateDisplay();
    }

    inputConstant(value) {
        this.currentInput = this.formatNumber(value);
        this.waitingForNewNumber = false;
        this.updateDisplay();
    }

    inputComplex() {
        if (this.complexMode) {
            this.currentInput += 'i';
            this.updateDisplay();
        }
    }

    inputAns() {
        this.currentInput = this.formatNumber(this.lastResult);
        this.waitingForNewNumber = false;
        this.updateDisplay();
    }

    clear() {
        this.currentInput = '0';
        this.currentExpression = '';
        this.operator = null;
        this.previousInput = '';
        this.waitingForNewNumber = false;
        this.updateDisplay();
    }

    delete() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    toggleSign() {
        if (this.currentInput !== '0') {
            this.currentInput = this.currentInput.startsWith('-') 
                ? this.currentInput.slice(1) 
                : '-' + this.currentInput;
        }
        this.updateDisplay();
    }

    calculate() {
        try {
            let expression = this.currentExpression;
            if (this.currentInput && !this.waitingForNewNumber) {
                expression += this.currentInput;
            }
            
            if (!expression) {
                expression = this.currentInput || '0';
            }
            
            // Handle angle conversions for trig functions
            expression = this.preprocessExpression(expression);
            
            let result;
            if (this.math && typeof this.math.evaluate === 'function') {
                result = this.math.evaluate(expression);
                result = parseFloat(result.toString());
            } else {
                result = this.evaluateExpression(expression);
            }
            
            if (isNaN(result)) {
                throw new Error('Invalid calculation');
            }
            
            this.lastResult = result;
            this.addToHistory(expression + ' = ' + this.formatNumber(result));
            
            this.currentInput = this.formatNumber(result);
            this.currentExpression = '';
            this.waitingForNewNumber = true;
            
        } catch (error) {
            this.currentInput = 'Error';
            this.display.classList.add('error-display');
            setTimeout(() => {
                this.display.classList.remove('error-display');
                this.clear();
            }, 2000);
        }
        
        this.updateDisplay();
    }

    preprocessExpression(expr) {
        // Convert operators to math.js format
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        
        // Handle angle conversions for trigonometric functions
        if (this.angleMode === 'DEG') {
            expr = expr.replace(/sin\(([^)]+)\)/g, 'sin(($1) * pi / 180)');
            expr = expr.replace(/cos\(([^)]+)\)/g, 'cos(($1) * pi / 180)');
            expr = expr.replace(/tan\(([^)]+)\)/g, 'tan(($1) * pi / 180)');
        } else if (this.angleMode === 'GRAD') {
            expr = expr.replace(/sin\(([^)]+)\)/g, 'sin(($1) * pi / 200)');
            expr = expr.replace(/cos\(([^)]+)\)/g, 'cos(($1) * pi / 200)');
            expr = expr.replace(/tan\(([^)]+)\)/g, 'tan(($1) * pi / 200)');
        }
        
        return expr;
    }

    evaluateExpression(expr) {
        // Fallback basic expression evaluator
        try {
            // Replace mathematical operators
            expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
            
            // Simple evaluation using Function constructor (be careful with this in production)
            const result = Function('"use strict"; return (' + expr + ')')();
            return result;
        } catch {
            return NaN;
        }
    }

    applyUnaryFunction(func) {
        try {
            const value = parseFloat(this.currentInput);
            const result = func(value);
            this.currentInput = this.formatNumber(result);
            this.waitingForNewNumber = true;
            this.updateDisplay();
        } catch (error) {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    applyTrigFunction(func) {
        try {
            let value = parseFloat(this.currentInput);
            
            // Convert to radians based on angle mode
            if (this.angleMode === 'DEG') {
                value = value * Math.PI / 180;
            } else if (this.angleMode === 'GRAD') {
                value = value * Math.PI / 200;
            }
            
            const result = func(value);
            this.currentInput = this.formatNumber(result);
            this.waitingForNewNumber = true;
            this.updateDisplay();
        } catch (error) {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    applyInverseTrigFunction(func) {
        try {
            const value = parseFloat(this.currentInput);
            let result = func(value);
            
            // Convert from radians based on angle mode
            if (this.angleMode === 'DEG') {
                result = result * 180 / Math.PI;
            } else if (this.angleMode === 'GRAD') {
                result = result * 200 / Math.PI;
            }
            
            this.currentInput = this.formatNumber(result);
            this.waitingForNewNumber = true;
            this.updateDisplay();
        } catch (error) {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    handleComplexFunction(func) {
        // Placeholder for complex number functions
        // This would require a complex number library or custom implementation
        this.currentInput = 'Complex functions not implemented';
        this.updateDisplay();
    }

    factorial(n) {
        if (n < 0 || !Number.isInteger(n)) throw new Error('Invalid input for factorial');
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // Memory functions
    memoryClear() {
        this.memory = 0;
        this.updateModeIndicators();
    }

    memoryRecall() {
        this.currentInput = this.formatNumber(this.memory);
        this.waitingForNewNumber = false;
        this.updateDisplay();
    }

    memoryStore() {
        this.memory = parseFloat(this.currentInput) || 0;
        this.updateModeIndicators();
        document.getElementById('memory-value').textContent = this.formatNumber(this.memory);
    }

    memoryAdd() {
        this.memory += parseFloat(this.currentInput) || 0;
        this.updateModeIndicators();
        document.getElementById('memory-value').textContent = this.formatNumber(this.memory);
    }

    memorySubtract() {
        this.memory -= parseFloat(this.currentInput) || 0;
        this.updateModeIndicators();
        document.getElementById('memory-value').textContent = this.formatNumber(this.memory);
    }

    // Matrix operations
    generateMatrixInputs(size) {
        const container = document.getElementById('matrix-input');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < size; i++) {
            const row = document.createElement('div');
            row.className = 'matrix-row';
            
            for (let j = 0; j < size; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'matrix-cell';
                input.placeholder = `${i + 1},${j + 1}`;
                input.step = 'any';
                row.appendChild(input);
            }
            
            container.appendChild(row);
        }
    }

    getMatrixFromInputs() {
        const rows = document.querySelectorAll('.matrix-row');
        const matrix = [];
        
        rows.forEach(row => {
            const rowValues = [];
            const cells = row.querySelectorAll('.matrix-cell');
            cells.forEach(cell => {
                rowValues.push(parseFloat(cell.value) || 0);
            });
            matrix.push(rowValues);
        });
        
        return matrix;
    }

    performMatrixOperation(operation) {
        // Placeholder for matrix operations
        // This would require a matrix mathematics library
        const resultDiv = document.createElement('div');
        resultDiv.textContent = `Matrix ${operation} operation would be performed here`;
        document.querySelector('.matrix-input').appendChild(resultDiv);
    }

    // Statistics operations
    performStatisticalOperation(operation) {
        const dataInput = document.getElementById('stats-data');
        const resultsDiv = document.getElementById('stats-results');
        
        if (!dataInput || !resultsDiv) return;
        
        try {
            const data = dataInput.value.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
            
            if (data.length === 0) {
                resultsDiv.innerHTML = '<div class="text-error">No valid data entered</div>';
                return;
            }
            
            let result;
            
            switch (operation) {
                case 'mean':
                    result = data.reduce((a, b) => a + b) / data.length;
                    break;
                case 'median':
                    const sorted = [...data].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    result = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                    break;
                case 'sum':
                    result = data.reduce((a, b) => a + b);
                    break;
                case 'count':
                    result = data.length;
                    break;
                case 'stddev':
                    const mean = data.reduce((a, b) => a + b) / data.length;
                    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
                    result = Math.sqrt(variance);
                    break;
                case 'variance':
                    const avg = data.reduce((a, b) => a + b) / data.length;
                    result = data.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / data.length;
                    break;
                default:
                    result = 'Operation not implemented';
            }
            
            resultsDiv.innerHTML = `<div><strong>${operation.toUpperCase()}:</strong> ${this.formatNumber(result)}</div>`;
            
        } catch (error) {
            resultsDiv.innerHTML = '<div class="text-error">Error in calculation</div>';
        }
    }

    // Calculus operations
    performCalculusOperation(operation) {
        const functionInput = document.getElementById('calc-function');
        if (!functionInput) return;
        
        // Placeholder for calculus operations
        alert(`${operation} operation would be performed on: ${functionInput.value}`);
    }

    // Equation solver
    generateEquationInputs(type) {
        const container = document.getElementById('equation-inputs');
        if (!container) return;
        
        container.innerHTML = '';
        
        switch (type) {
            case 'linear':
                container.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">ax + b = 0</label>
                        <input type="number" placeholder="a" class="form-control" id="coeff-a" step="any">
                        <input type="number" placeholder="b" class="form-control" id="coeff-b" step="any">
                    </div>
                `;
                break;
            case 'quadratic':
                container.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">ax² + bx + c = 0</label>
                        <input type="number" placeholder="a" class="form-control" id="coeff-a" step="any">
                        <input type="number" placeholder="b" class="form-control" id="coeff-b" step="any">
                        <input type="number" placeholder="c" class="form-control" id="coeff-c" step="any">
                    </div>
                `;
                break;
        }
    }

    solveEquation() {
        const type = document.getElementById('equation-type').value;
        const resultsDiv = document.getElementById('solver-results');
        
        if (!resultsDiv) return;
        
        try {
            let result = '';
            
            if (type === 'linear') {
                const a = parseFloat(document.getElementById('coeff-a').value) || 0;
                const b = parseFloat(document.getElementById('coeff-b').value) || 0;
                
                if (a === 0) {
                    result = b === 0 ? 'Infinite solutions' : 'No solution';
                } else {
                    const x = -b / a;
                    result = `x = ${this.formatNumber(x)}`;
                }
            } else if (type === 'quadratic') {
                const a = parseFloat(document.getElementById('coeff-a').value) || 0;
                const b = parseFloat(document.getElementById('coeff-b').value) || 0;
                const c = parseFloat(document.getElementById('coeff-c').value) || 0;
                
                if (a === 0) {
                    result = 'Not a quadratic equation';
                } else {
                    const discriminant = b * b - 4 * a * c;
                    
                    if (discriminant > 0) {
                        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                        result = `x₁ = ${this.formatNumber(x1)}<br>x₂ = ${this.formatNumber(x2)}`;
                    } else if (discriminant === 0) {
                        const x = -b / (2 * a);
                        result = `x = ${this.formatNumber(x)} (double root)`;
                    } else {
                        result = 'No real solutions';
                    }
                }
            }
            
            resultsDiv.innerHTML = `<div>${result}</div>`;
            
        } catch (error) {
            resultsDiv.innerHTML = '<div class="text-error">Error in solving equation</div>';
        }
    }

    clearSolver() {
        const inputs = document.querySelectorAll('#equation-inputs input');
        inputs.forEach(input => input.value = '');
        document.getElementById('solver-results').innerHTML = '';
    }

    // Conversion functions
    generateConversionInputs(type) {
        const container = document.getElementById('conversion-inputs');
        if (!container) return;
        
        container.innerHTML = '';
        
        switch (type) {
            case 'base':
                container.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">Number:</label>
                        <input type="text" class="form-control" id="convert-input" placeholder="Enter number">
                        <label class="form-label">From Base:</label>
                        <select class="form-control" id="from-base">
                            <option value="10">Decimal (10)</option>
                            <option value="2">Binary (2)</option>
                            <option value="8">Octal (8)</option>
                            <option value="16">Hexadecimal (16)</option>
                        </select>
                        <label class="form-label">To Base:</label>
                        <select class="form-control" id="to-base">
                            <option value="10">Decimal (10)</option>
                            <option value="2">Binary (2)</option>
                            <option value="8">Octal (8)</option>
                            <option value="16">Hexadecimal (16)</option>
                        </select>
                    </div>
                `;
                break;
            case 'angle':
                container.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">Angle:</label>
                        <input type="number" class="form-control" id="convert-input" step="any">
                        <label class="form-label">From:</label>
                        <select class="form-control" id="from-unit">
                            <option value="deg">Degrees</option>
                            <option value="rad">Radians</option>
                            <option value="grad">Gradians</option>
                        </select>
                        <label class="form-label">To:</label>
                        <select class="form-control" id="to-unit">
                            <option value="deg">Degrees</option>
                            <option value="rad">Radians</option>
                            <option value="grad">Gradians</option>
                        </select>
                    </div>
                `;
                break;
        }
    }

    performConversion() {
        const type = document.getElementById('conversion-type').value;
        const resultsDiv = document.getElementById('conversion-results');
        const input = document.getElementById('convert-input').value;
        
        if (!resultsDiv || !input) return;
        
        try {
            let result = '';
            
            if (type === 'base') {
                const fromBase = parseInt(document.getElementById('from-base').value);
                const toBase = parseInt(document.getElementById('to-base').value);
                
                const decimalValue = parseInt(input, fromBase);
                const convertedValue = decimalValue.toString(toBase).toUpperCase();
                
                result = `${input} (base ${fromBase}) = ${convertedValue} (base ${toBase})`;
            } else if (type === 'angle') {
                const fromUnit = document.getElementById('from-unit').value;
                const toUnit = document.getElementById('to-unit').value;
                const value = parseFloat(input);
                
                let radians = value;
                if (fromUnit === 'deg') radians = value * Math.PI / 180;
                else if (fromUnit === 'grad') radians = value * Math.PI / 200;
                
                let convertedValue = radians;
                if (toUnit === 'deg') convertedValue = radians * 180 / Math.PI;
                else if (toUnit === 'grad') convertedValue = radians * 200 / Math.PI;
                
                result = `${value} ${fromUnit} = ${this.formatNumber(convertedValue)} ${toUnit}`;
            }
            
            resultsDiv.innerHTML = `<div>${result}</div>`;
            
        } catch (error) {
            resultsDiv.innerHTML = '<div class="text-error">Error in conversion</div>';
        }
    }

    clearConversion() {
        const inputs = document.querySelectorAll('#conversion-inputs input, #conversion-inputs select');
        inputs.forEach(input => input.value = input.type === 'select-one' ? input.options[0].value : '');
        document.getElementById('conversion-results').innerHTML = '';
    }

    // History functions
    addToHistory(calculation) {
        this.history.unshift(calculation);
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyContainer = document.getElementById('calculation-history');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '';
        
        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = item;
            historyContainer.appendChild(historyItem);
        });
    }

    recallFromHistory(historyText) {
        const parts = historyText.split(' = ');
        if (parts.length === 2) {
            this.currentInput = parts[1];
            this.waitingForNewNumber = false;
            this.updateDisplay();
        }
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
    }

    // Display and formatting functions
    updateDisplay() {
        let displayText = this.currentExpression;
        if (this.currentInput && !this.waitingForNewNumber) {
            displayText += this.currentInput;
        }
        
        if (!displayText || displayText.trim() === '') {
            displayText = this.currentInput || '0';
        }
        
        this.display.textContent = displayText;
        this.historyDisplay.textContent = this.currentExpression;
    }

    updateModeIndicators() {
        const angleModeIndicator = document.getElementById('angle-mode');
        const memoryIndicator = document.getElementById('memory-indicator');
        const complexModeIndicator = document.getElementById('complex-mode');
        
        if (angleModeIndicator) {
            angleModeIndicator.textContent = this.angleMode;
        }
        
        if (memoryIndicator) {
            memoryIndicator.classList.toggle('hidden', this.memory === 0);
        }
        
        if (complexModeIndicator) {
            complexModeIndicator.classList.toggle('hidden', !this.complexMode);
        }
    }

    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }
        
        if (!isFinite(num)) {
            return num > 0 ? '∞' : '-∞';
        }
        
        // Handle display mode
        if (this.displayMode === 'scientific') {
            return num.toExponential(this.decimalPlaces);
        } else if (this.displayMode === 'engineering') {
            const exponent = Math.floor(Math.log10(Math.abs(num)) / 3) * 3;
            const mantissa = num / Math.pow(10, exponent);
            return `${mantissa.toFixed(this.decimalPlaces)}e${exponent}`;
        }
        
        // Normal mode
        if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(this.decimalPlaces);
        }
        
        // Remove trailing zeros
        let formatted = num.toFixed(this.decimalPlaces);
        formatted = formatted.replace(/\.?0+$/, '');
        
        return formatted;
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ScientificCalculator();
});